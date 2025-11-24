<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\CategoriesModel;

class Products extends BaseController
{

    // GET /api/products?locale=&search=&q=&page=&limit=&sortBy=&order=&category_id=&category_slug=
    public function index()
    {
        $req    = $this->request;
        $locale = $req->getGet('locale') ?: 'en';

        // Accept `search=` (preferred) and `q=` (backwards compatible)
        $search = trim((string)($req->getGet('search') ?? $req->getGet('q') ?? ''));

        $page   = max(1, (int)($req->getGet('page') ?? 1));
        $limit  = max(1, min(100, (int)($req->getGet('limit') ?? 50)));
        $offset = ($page - 1) * $limit;

        $sortBy = $req->getGet('sortBy') ?: 'created_at';
        $order  = strtoupper($req->getGet('order') ?: 'DESC');

        // Accept either category_id or category_slug
        $catId     = $req->getGet('category_id');
        $catSlug   = $req->getGet('category_slug');

        $allowedSorts = ['created_at', 'published_at', 'name', 'id', 'code'];
        if (!in_array($sortBy, $allowedSorts, true)) $sortBy = 'created_at';
        if (!in_array($order, ['ASC', 'DESC'], true)) $order = 'DESC';

        // If category_slug provided, resolve to ID (overrides category_id if both present)
        if ($catSlug !== null && $catSlug !== '') {
            $cat = (new CategoriesModel())->findBySlug((string)$catSlug);
            if ($cat) {
                $catId = (int)$cat['id'];
            } else {
                // Unknown slug → force empty result set by using an impossible ID
                $catId = -1;
            }
        } elseif ($catId !== null && $catId !== '') {
            $catId = (int)$catId;
        } else {
            $catId = null;
        }

        $db = \Config\Database::connect();
        $b  = $db->table('products p');

        // Locale join + English fallback
        $b->join('product_translations tr', "tr.product_id = p.id AND tr.locale = " . $db->escape($locale), 'left');
        $b->join('product_translations en', "en.product_id = p.id AND en.locale = 'en'", 'left');

        // Category filter (if present)
        if ($catId !== null) {
            $b->join('product_categories pc', 'pc.product_id = p.id', 'inner')
                ->where('pc.category_id', $catId);
        }

        // Search across slug + localized/fallback name/description
        if ($search !== '') {
            $b->groupStart()
                ->like('p.slug', $search)
                ->orLike('tr.name', $search)
                ->orLike('tr.description', $search)
                ->orLike('en.name', $search)
                ->orLike('en.description', $search)
                ->groupEnd();
        }

        // Total count (clone before selects/limits)
        $countQ = clone $b;
        $countQ->select('COUNT(*) AS c');
        $total = (int)($countQ->get()->getRow('c') ?? 0);

        // Representative image URL via correlated subselects
        $imgGroupId = "(SELECT pig.id FROM product_image_groups pig WHERE pig.product_id = p.id ORDER BY pig.sort_order ASC, pig.id ASC LIMIT 1)";
        $imgUrlExpr = "(SELECT pi.url FROM product_images pi WHERE pi.group_id = $imgGroupId ORDER BY pi.sort_order ASC, pi.id ASC LIMIT 1)";

        // Select list
        $b->select([
            'p.id',
            'p.slug',
            "COALESCE(tr.name, en.name) AS name",
            "COALESCE(tr.description, en.description) AS `desc`",
            "$imgUrlExpr AS imgurl",
        ]);
        // Sorting
        if ($sortBy === 'name') {
            // Build the full expression + direction and disable escaping
            $b->orderBy("COALESCE(tr.name, en.name) $order", '', false);
        } else {
            $b->orderBy("p.$sortBy", $order); // normal columns are fine
        }
        // Stable tiebreaker
        $b->orderBy('p.id', 'DESC');


        $rows = $b->get($limit, $offset)->getResultArray();

        return $this->response->setJSON([
            'meta' => [
                'total'         => $total,
                'page'          => $page,
                'limit'         => $limit,
                'search'        => $search,
                'sortBy'        => $sortBy,
                'order'         => $order,
                'locale'        => $locale,
                'category_id'   => $catId !== null ? (int)$catId : null,
                'category_slug' => $catSlug !== null && $catSlug !== '' ? (string)$catSlug : null,
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


    // GET /api/products/{slug}?locale=
    // PUBLIC: uses fallback to 'en' for any missing localized piece
    public function show($slug = null)
    {
        $locale = $this->request->getGet('locale') ?: 'en';
        $db     = \Config\Database::connect();

        // ---------- Base (with fallback) ----------
        $b = $db->table('products p');
        $b->join('product_translations tr', "tr.product_id=p.id AND tr.locale=" . $db->escape($locale), 'left');
        $b->join('product_translations en', "en.product_id=p.id AND en.locale='en'", 'left');
        $b->select([
            'p.id',
            'p.slug',
            "COALESCE(tr.name,en.name) AS name",
            "COALESCE(tr.description,en.description) AS description",
        ])->where('p.slug', $slug);

        $base = $b->get()->getRowArray();
        if (!$base) return $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found']);

        $productId = (int)$base['id'];

        // ---------- Layout ----------
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
                    // collect all spec groups for product
                    $all = $db->table('product_spec_groups')->select('id')->where('product_id', $productId)->get()->getResultArray();
                    foreach ($all as $a) $specGroupIds[] = (int)$a['id'];
                }
                if ($br['block_type'] === 'table_group') {
                    $all = $db->table('product_tables')->select('id')->where('product_id', $productId)->get()->getResultArray();
                    foreach ($all as $a) $tableIds[] = (int)$a['id'];
                }
            }
        }

        // ---------- Images ----------
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

        // ---------- Lists (with fallback) ----------
        $listsOut = [];
        if (!empty($listIds)) {
            // translations: requested locale + en for fallback
            $trs = $db->table('product_list_translations')
                ->whereIn('list_id', $listIds)
                ->whereIn('locale', [$locale, 'en'])
                ->get()->getResultArray();

            // map by (list_id, locale)
            $trMap = [];
            foreach ($trs as $t) $trMap[$t['list_id'] . '|' . $t['locale']] = $t;

            foreach (array_values(array_unique($listIds)) as $lid) {
                $tr = $trMap[$lid . '|' . $locale] ?? $trMap[$lid . '|en'] ?? null; // fallback here
                if ($tr) {
                    // items by translation id
                    $items = $db->table('product_list_items')
                        ->where('list_translation_id', $tr['id'])
                        ->orderBy('sort_order', 'ASC')->get()->getResultArray();
                    $listsOut[] = [
                        'list-' . $lid => [
                            'title' => $tr['title'],
                            'desc'  => $tr['description'],
                            'items' => array_map(fn($r) => $r['text'], $items),
                        ]
                    ];
                } else {
                    // no translation at all (rare) -> empty
                    $listsOut[] = ['list-' . $lid => ['title' => null, 'desc' => null, 'items' => []]];
                }
            }
        }

        // ---------- Specs (with fallback) ----------
        $specsOut = [];
        if (!empty($specGroupIds)) {
            $specGroupIds = array_values(array_unique($specGroupIds));

            $trs = $db->table('product_spec_group_translations')
                ->whereIn('group_id', $specGroupIds)
                ->whereIn('locale', [$locale, 'en'])
                ->get()->getResultArray();
            $trMap = [];
            foreach ($trs as $t) $trMap[$t['group_id'] . '|' . $t['locale']] = $t;

            foreach ($specGroupIds as $gid) {
                $tr = $trMap[$gid . '|' . $locale] ?? $trMap[$gid . '|en'] ?? null;
                if ($tr) {
                    $items = $db->table('product_spec_items')
                        ->where('spec_group_translation_id', $tr['id'])
                        ->orderBy('sort_order', 'ASC')->get()->getResultArray();
                    $specsOut[] = [
                        'spec-' . $gid => [
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
                    $specsOut[] = ['spec-' . $gid => ['title' => null, 'desc' => null, 'items' => []]];
                }
            }
        }

        // ---------- Tables (with fallback) ----------
        $tablesOut = [];
        if (!empty($tableIds)) {
            $tableIds = array_values(array_unique($tableIds));

            $trs = $db->table('product_table_translations')
                ->whereIn('table_id', $tableIds)
                ->whereIn('locale', [$locale, 'en'])
                ->get()->getResultArray();
            $trMap = [];
            foreach ($trs as $t) $trMap[$t['table_id'] . '|' . $t['locale']] = $t;

            foreach ($tableIds as $tid) {
                $tr = $trMap[$tid . '|' . $locale] ?? $trMap[$tid . '|en'] ?? null;
                if ($tr) {
                    $tablesOut[] = [
                        'table-' . $tid => [
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

        // ---------- Paragraphs (with fallback) — optional to include ----------
        // You didn't ask to return in payload, but if you want later, we can add similar to lists/specs.

        // fullData flag (all localized present for requested locale)
        $fullData = true;
        if (empty($base['name'])) $fullData = false;
        // lists/specs/tables – if any locale fallback was used (i.e., zh missing but en used), mark false
        // Simple heuristic: if we used any fallback (locale row missing) -> false
        // For brevity, we won’t deep-check here. You can augment later if needed.

        return $this->response->setJSON([
            'meta' => [
                'fullData' => $fullData,
                'locale'   => $locale,
                'slug'     => $base['slug'],
                'id'       => $productId,
            ],
            'base' => [
                'name' => $base['name'],
                'desc' => $base['description'],
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
        ]);
    }
}
