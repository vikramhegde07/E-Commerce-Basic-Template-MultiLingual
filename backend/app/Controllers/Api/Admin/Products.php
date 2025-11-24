<?php

namespace App\Controllers\Api\Admin;

use App\Controllers\BaseController;
use App\Models\ProductModel;

class Products extends BaseController
{

    private function ensureProductExists(int $productId): void
    {
        $prod = (new ProductModel())->find($productId);
        if (!$prod) {
            $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found'])->send();
            exit;
        }
    }

    // GET /api/admin/products?locale=&q=&page=&limit=&sortBy=&order=&category_id=&status=&type=
    // Listing returns the SAME card/table payload as public (with en fallback for listing use-case).
    public function index()
    {
        $req      = $this->request;
        $locale   = $req->getGet('locale') ?: 'en';
        $q        = trim((string)($req->getGet('q') ?? ''));
        $page     = max(1, (int)($req->getGet('page') ?? 1));
        $limit    = max(1, min(100, (int)($req->getGet('limit') ?? 50)));
        $offset   = ($page - 1) * $limit;
        $sortBy   = $req->getGet('sortBy') ?: 'created_at';
        $order    = strtoupper($req->getGet('order') ?: 'DESC');
        $catId    = $req->getGet('category_id');
        $status   = $req->getGet('status');
        $type     = $req->getGet('type');

        $allowedSorts = ['created_at', 'published_at', 'name', 'id', 'code'];
        if (!in_array($sortBy, $allowedSorts, true)) $sortBy = 'created_at';
        if (!in_array($order, ['ASC', 'DESC'], true)) $order = 'DESC';

        $db = \Config\Database::connect();
        $b  = $db->table('products p');

        // joins for locale + en fallback (listing keeps cards readable)
        $b->join('product_translations tr', "tr.product_id = p.id AND tr.locale = " . $db->escape($locale), 'left');
        $b->join('product_translations en', "en.product_id = p.id AND en.locale = 'en'", 'left');

        if ($catId !== null && $catId !== '') {
            $b->join('product_categories pc', 'pc.product_id = p.id', 'inner')
                ->where('pc.category_id', (int)$catId);
        }
        if ($status) $b->where('p.status', $status);
        if ($type)   $b->where('p.type', $type);

        if ($q !== '') {
            $b->groupStart()
                ->like('p.slug', $q)
                ->orLike('tr.name', $q)
                ->orLike('tr.description', $q)
                ->orLike('en.name', $q)
                ->orLike('en.description', $q)
                ->groupEnd();
        }

        // total
        $countQ = clone $b;
        $countQ->select('COUNT(*) AS c');
        $total = (int)($countQ->get()->getRow('c') ?? 0);

        // image subselect
        $imgGroupId = "(SELECT pig.id FROM product_image_groups pig WHERE pig.product_id = p.id ORDER BY pig.sort_order ASC, pig.id ASC LIMIT 1)";
        $imgUrlExpr = "(SELECT pi.url FROM product_images pi WHERE pi.group_id = $imgGroupId ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1)";

        // select
        $b->select([
            'p.id',
            'p.slug',
            "COALESCE(tr.name, en.name) AS name",
            "COALESCE(tr.description, en.description) AS `desc`",
            "$imgUrlExpr AS imgurl",
        ]);

        if ($sortBy === 'name') {
            $b->orderBy("COALESCE(tr.name, en.name)", $order);
        } else {
            $b->orderBy('p.' . $sortBy, $order);
        }
        $b->orderBy('p.id', 'DESC');

        $rows = $b->get($limit, $offset)->getResultArray();

        return $this->response->setJSON([
            'meta' => [
                'total'       => $total,
                'page'        => $page,
                'limit'       => $limit,
                'q'           => $q,
                'sortBy'      => $sortBy,
                'order'       => $order,
                'locale'      => $locale,
                'category_id' => $catId ? (int)$catId : null,
                'status'      => $status ?? null,
                'type'        => $type ?? null,
            ],
            'data' => array_map(static function ($r) {
                return [
                    'name'   => $r['name'] ?? null,
                    'desc'   => $r['desc'] ?? null,
                    'imgurl' => $r['imgurl'] ?? null,
                    'slug'   => $r['slug'],
                    'id'     => (int)$r['id'],
                ];
            }, $rows),
        ]);
    }

    // GET /api/admin/products/{slug}?locale=
    // ADMIN: NO fallback — return null/[] for missing locale parts.
    public function show($slug = null)
    {
        $locale = $this->request->getGet('locale') ?: 'en';
        $db     = \Config\Database::connect();

        // Base (strict, no fallback)
        $b = $db->table('products p');
        $b->join('product_translations tr', "tr.product_id=p.id AND tr.locale=" . $db->escape($locale), 'left');
        $b->select(['p.id', 'p.slug', 'tr.name', 'tr.description'])->where('p.slug', $slug);

        $base = $b->get()->getRowArray();
        if (!$base) return $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found']);
        $productId = (int)$base['id'];

        // Layout
        $layout = $db->table('product_layouts l')
            ->select('l.id, l.name, l.is_default')
            ->where('l.product_id', $productId)
            ->orderBy('l.is_default', 'DESC')->orderBy('l.id', 'ASC')
            ->get()->getFirstRow('array');

        $blocks = [];
        $listIds = $specGroupIds = $tableIds = $paragraphIds = [];
        if ($layout) {
            $blockRows = $db->table('product_layout_blocks b')
                ->select('b.id,b.block_type,b.ref_id,b.config_json,b.sort_order')
                ->where('b.layout_id', $layout['id'])
                ->orderBy('b.sort_order', 'ASC')->orderBy('b.id', 'ASC')
                ->get()->getResultArray();
            foreach ($blockRows as $br) {
                $blocks[] = [
                    'id'         => (int)$br['id'],
                    'block_type' => $br['block_type'],
                    'ref_id'     => $br['ref_id'] ? (int)$br['ref_id'] : null,
                    'sort_order' => (int)$br['sort_order'],
                    'config'     => $br['config_json'] ? json_decode($br['config_json'], true) : null,
                ];
                if ($br['block_type'] === 'list' && $br['ref_id']) $listIds[] = (int)$br['ref_id'];
                if ($br['block_type'] === 'spec_group' && $br['ref_id']) $specGroupIds[] = (int)$br['ref_id'];
                if ($br['block_type'] === 'table' && $br['ref_id']) $tableIds[] = (int)$br['ref_id'];
                if ($br['block_type'] === 'content_paragraph' && $br['ref_id']) $paragraphIds[] = (int)$br['ref_id'];
                if ($br['block_type'] === 'specs_all') {
                    $all = $db->table('product_spec_groups')->select('id')->where('product_id', $productId)->get()->getResultArray();
                    foreach ($all as $a) $specGroupIds[] = (int)$a['id'];
                }
                if ($br['block_type'] === 'table_group') {
                    $all = $db->table('product_tables')->select('id')->where('product_id', $productId)->get()->getResultArray();
                    foreach ($all as $a) $tableIds[] = (int)$a['id'];
                }
            }
        }

        // Images
        $imgGroups = $db->table('product_image_groups')
            ->select('id,name,sort_order')
            ->where('product_id', $productId)
            ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')
            ->get()->getResultArray();
        $images = [];
        foreach ($imgGroups as $g) {
            $items = $db->table('product_images')
                ->select('id,url,alt,sort_order')
                ->where('group_id', $g['id'])
                ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')
                ->get()->getResultArray();
            $images[] = [
                'group_id' => (int)$g['id'],
                'name'     => $g['name'],
                'items'    => array_map(static function ($r) {
                    return [
                        'id' => (int)$r['id'],
                        'url' => $r['url'],
                        'alt' => $r['alt'],
                        'sort_order' => (int)$r['sort_order'],
                    ];
                }, $items),
            ];
        }

        // Lists (STRICT locale, NO fallback)
        $listsOut = [];
        if (!empty($listIds)) {
            $trs = $db->table('product_list_translations')
                ->whereIn('list_id', array_values(array_unique($listIds)))
                ->where('locale', $locale)
                ->get()->getResultArray();
            $trMap = [];
            foreach ($trs as $t) $trMap[$t['list_id']] = $t;

            foreach (array_values(array_unique($listIds)) as $lid) {
                $tr = $trMap[$lid] ?? null;
                if ($tr) {
                    $items = $db->table('product_list_items')
                        ->where('list_translation_id', $tr['id'])
                        ->orderBy('sort_order', 'ASC')->get()->getResultArray();
                    $listsOut[] = [
                        'list-' . $lid => [
                            'id' => $lid,
                            'title' => $tr['title'],
                            'desc'  => $tr['description'],
                            'items' => array_map(fn($r) => $r['text'], $items),
                        ]
                    ];
                } else {
                    $listsOut[] = ['list-' . $lid => ['id' => $lid, 'title' => null, 'desc' => null, 'items' => []]];
                }
            }
        }

        // Specs (STRICT)
        $specsOut = [];
        if (!empty($specGroupIds)) {
            $specGroupIds = array_values(array_unique($specGroupIds));
            $trs = $db->table('product_spec_group_translations')
                ->whereIn('group_id', $specGroupIds)
                ->where('locale', $locale)
                ->get()->getResultArray();
            $trMap = [];
            foreach ($trs as $t) $trMap[$t['group_id']] = $t;

            foreach ($specGroupIds as $gid) {
                $tr = $trMap[$gid] ?? null;
                if ($tr) {
                    $items = $db->table('product_spec_items')
                        ->where('spec_group_translation_id', $tr['id'])
                        ->orderBy('sort_order', 'ASC')->get()->getResultArray();
                    $specsOut[] = [
                        'spec-' . $gid => [
                            'id' => $gid,
                            'title' => $tr['title'],
                            'desc'  => $tr['description'],
                            'items' => array_map(fn($r) => [
                                'key'   => $r['spec_key'],
                                'value' => $r['spec_value'],
                                'unit'  => $r['unit'],
                            ], $items),
                        ]
                    ];
                } else {
                    $specsOut[] = ['spec-' . $gid => ['id' => $gid, 'title' => null, 'desc' => null, 'items' => []]];
                }
            }
        }

        // Tables (STRICT)
        $tablesOut = [];
        if (!empty($tableIds)) {
            $tableIds = array_values(array_unique($tableIds));
            $trs = $db->table('product_table_translations')
                ->whereIn('table_id', $tableIds)
                ->where('locale', $locale)
                ->get()->getResultArray();
            $trMap = [];
            foreach ($trs as $t) $trMap[$t['table_id']] = $t;

            foreach ($tableIds as $tid) {
                $tr = $trMap[$tid] ?? null;
                if ($tr) {
                    $tablesOut[] = [
                        'table-' . $tid => [
                            'id' => $tid,
                            'title'    => $tr['title'],
                            'subtitle' => $tr['subtitle'],
                            'columns'  => json_decode($tr['columns_json'] ?: '[]', true),
                            'rows'     => json_decode($tr['rows_json'] ?: '[]', true),
                            'notes'    => $tr['notes'],
                        ]
                    ];
                } else {
                    $tablesOut[] = [
                        'table-' . $tid => [
                            'id' => $tid,
                            'title' => null,
                            'subtitle' => null,
                            'columns' => [],
                            'rows' => [],
                            'notes' => null
                        ]
                    ];
                }
            }
        }

        $paraOut = [];
        if (!empty($paragraphIds)) {
            $paragraphIds = array_values(array_unique($paragraphIds));
            $trs = $db
                ->table('product_content_paragraph_translations')
                ->whereIn('paragraph_id', $paragraphIds)
                ->where('locale', $locale)
                ->get()->getResultArray();

            $trMap = [];
            foreach ($trs as $t) $trMap[$t['paragraph_id']] = $t;

            foreach ($paragraphIds as $tid) {
                $tr = $trMap[$tid] ?? null;
                if ($tr) {
                    $paraOut[] = [
                        'paragraph-' . $tid => [
                            'id' => $tid,
                            'title'    => $tr['title'],
                            'subtitle' => $tr['subtitle'],
                            'full_text'  => $tr['full_text'],
                        ]
                    ];
                } else {
                    $paraOut[] = [
                        'paragraph-' . $tid => [
                            'id' => $tid,
                            'title' => null,
                            'subtitle' => null,
                            'full_text'  => null,
                        ]
                    ];
                }
            }
        }

        $fullData = true;
        if (empty($base['name'])) $fullData = false;
        foreach (array_merge($listsOut, $specsOut, $tablesOut) as $grp) {
            $payload = array_values($grp)[0];
            if ($payload['title'] === null) {
                $fullData = false;
                break;
            }
        }

        return $this->response->setJSON([
            'meta' => [
                'fullData' => $fullData,
                'locale'   => $locale,
                'slug'     => $base['slug'],
                'id'       => $productId,
            ],
            'base' => [
                'name' => $base['name'] ?? null,
                'desc' => $base['description'] ?? null,
            ],
            'layout' => [
                'id'        => $layout['id'] ?? null,
                'name'      => $layout['name'] ?? null,
                'is_default' => isset($layout['is_default']) ? (int)$layout['is_default'] : null,
                'blocks'    => $blocks,
            ],
            'images' => $images,
            'lists'  => $listsOut,
            'specs'  => $specsOut,
            'tables' => $tablesOut,
            'paragraphs' => $paraOut
        ]);
    }


    // DELETE /api/admin/products/{productId}
    public function deleteProduct($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        $dir = FCPATH . 'uploads/products/' . $productId . '/';

        $db->transStart();
        try {
            // Hard delete product; all children go via ON DELETE CASCADE
            $db->table('products')->where('id', $productId)->delete();

            $db->transComplete();
            if (!$db->transStatus()) {
                throw new \RuntimeException('tx failed');
            }

            // Best-effort filesystem cleanup (after successful DB commit)
            $this->rrmdir($dir);

            return $this->response->setJSON([
                'deleted' => ['product_id' => $productId]
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response
                ->setStatusCode(422)
                ->setJSON(['error' => 'Delete failed', 'detail' => $e->getMessage()]);
        }
    }

    /**
     * Recursively remove a directory (best-effort).
     */
    private function rrmdir(string $dir): void
    {
        if (!is_dir($dir)) return;
        $items = scandir($dir);
        if ($items === false) return;

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $this->rrmdir($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }
}
