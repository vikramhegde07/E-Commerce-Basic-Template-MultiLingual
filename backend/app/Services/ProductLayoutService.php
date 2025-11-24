<?php
// app/Services/ProductLayoutService.php
namespace App\Services;

use Config\Database;

class ProductLayoutService
{
    /**
     * Ensure a layout exists (default), then insert a block.
     *
     * @param int         $productId
     * @param string      $blockType   one of: images,image_set,basic,specs_all,spec_group,table,table_group,list,custom_html,content_paragraph
     * @param int|null    $refId       nullable; e.g. group/content id the block points to
     * @param int|null    $sortOrder   optional; if null appends to end
     * @param mixed|null  $config      array/object (json-encoded) or raw json string
     * @param int|null    $layoutId    optional; if null uses/creates default layout for product
     *
     * @return array { id, layout_id, block_type, ref_id, sort_order }
     * @throws \InvalidArgumentException | \RuntimeException
     */
    public static function addBlock(
        int $productId,
        string $blockType,
        ?int $refId = null,
        ?int $sortOrder = null,
        $config = null,
        ?int $layoutId = null
    ): array {
        $db = Database::connect();

        $allowed = [
            'images',
            'image_set',
            'basic',
            'specs_all',
            'spec_group',
            'table',
            'table_group',
            'list',
            'custom_html',
            'content_paragraph'
        ];
        $blockType = strtolower(trim($blockType));
        if (!in_array($blockType, $allowed, true)) {
            throw new \InvalidArgumentException('Invalid block_type: ' . $blockType);
        }

        $db->transStart();

        // 1) Get or create default layout if not provided
        if (!$layoutId) {
            $layout = $db->table('product_layouts')
                ->where('product_id', $productId)
                ->orderBy('is_default', 'DESC')
                ->orderBy('id', 'ASC')
                ->get()->getFirstRow('array');

            if (!$layout) {
                $now = date('Y-m-d H:i:s');
                $db->table('product_layouts')->insert([
                    'product_id' => $productId,
                    'name'       => 'Default',
                    'is_default' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $layoutId = (int)$db->insertID();
            } else {
                $layoutId = (int)$layout['id'];
            }
        }

        // 2) Decide sort order (append if null)
        if ($sortOrder === null) {
            $max = $db->table('product_layout_blocks')
                ->selectMax('sort_order', 'm')
                ->where('layout_id', $layoutId)
                ->get()->getRowArray();
            $sortOrder = isset($max['m']) ? ((int)$max['m'] + 1) : 0;
        }

        // 3) Prepare config json
        $configJson = null;
        if (is_string($config)) {
            $configJson = $config;
        } elseif ($config !== null) {
            $configJson = json_encode($config, JSON_UNESCAPED_UNICODE);
        }

        // 4) Insert block
        $now = date('Y-m-d H:i:s');
        $db->table('product_layout_blocks')->insert([
            'layout_id'  => $layoutId,
            'block_type' => $blockType,
            'ref_id'     => $refId,
            'config_json' => $configJson,
            'sort_order' => $sortOrder,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $blockId = (int)$db->insertID();

        $db->transComplete();
        if (!$db->transStatus()) {
            throw new \RuntimeException('Failed to insert layout block');
        }

        return [
            'id'         => $blockId,
            'layout_id'  => $layoutId,
            'block_type' => $blockType,
            'ref_id'     => $refId,
            'sort_order' => $sortOrder,
        ];
    }

    /**
     * Remove block(s) by product, type and ref_id across all layouts of the product.
     *
     * @param int    $productId
     * @param string $blockType   images|image_set|basic|specs_all|spec_group|table|table_group|list|custom_html|content_paragraph
     * @param int    $refId
     * @return int   number of deleted rows
     */
    public static function removeBlockByRef(int $productId, string $blockType, int $refId): int
    {
        $allowed = [
            'images',
            'image_set',
            'basic',
            'specs_all',
            'spec_group',
            'table',
            'table_group',
            'list',
            'custom_html',
            'content_paragraph'
        ];
        $blockType = strtolower(trim($blockType));
        if (!in_array($blockType, $allowed, true)) {
            throw new \InvalidArgumentException('Invalid block_type: ' . $blockType);
        }

        $db = Database::connect();

        // Find all layouts for this product
        $layouts = $db->table('product_layouts')
            ->select('id')
            ->where('product_id', $productId)
            ->get()->getResultArray();

        if (empty($layouts)) return 0;

        $layoutIds = array_map(static fn($r) => (int)$r['id'], $layouts);

        // Delete blocks referencing this ref_id in any product layout
        $db->table('product_layout_blocks')
            ->whereIn('layout_id', $layoutIds)
            ->where('block_type', $blockType)
            ->where('ref_id', $refId)
            ->delete();

        return $db->affectedRows();
    }

    /**
     * (Optional) Remove a block by its ID.
     */
    public static function removeBlockById(int $blockId): bool
    {
        $db = Database::connect();
        $db->table('product_layout_blocks')->where('id', $blockId)->delete();
        return $db->affectedRows() > 0;
    }
}
