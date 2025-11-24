<?php

namespace App\Controllers\Public;

use App\Controllers\BaseController;

class Products extends BaseController
{
    /**
     * GET /api/public/products/slug/{slug}/bundle3
     *
     * Returns:
     * {
     *   "en": { ...full bundle... },
     *   "ar": { ...full bundle with EN fallback... },
     *   "zh": { ...full bundle with EN fallback... },
     *   "meta": { "id": 123, "slug": "steel-door-42" }
     * }
     *
     * Sections included:
     * - base (id, slug, code, status, published_at)
     * - name/description/meta (per-locale; fallback to EN)
     * - categories (names per-locale; fallback to EN)
     * - images (ordered)
     * - spec groups (+ items) with translations per-locale
     * - lists (+ items) with translations per-locale
     * - tables (heading/intro/columns/rows/note) per-locale
     *
     * Table names used (adjust if yours differ):
     * products, product_translations
     * product_categories, categories, category_translations
     * product_images
     * product_spec_groups, product_spec_group_translations,
     * product_spec_items, product_spec_item_translations
     * product_lists, product_list_translations,
     * product_list_items, product_list_item_translations
     * product_tables, product_table_translations
     */
    public function bundle3($slug = null)
    {
        $slug = trim((string)$slug);
        if ($slug === '') {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid slug']);
        }

        $db = \Config\Database::connect();
        $fallback = 'en';
        $locales  = ['en', 'ar', 'zh'];

        // -------- 1) Base product --------
        $p = $db->table('products')->where('slug', $slug)->get()->getFirstRow('array');
        if (!$p) return $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found']);

        $productId = (int)$p['id'];

        // -------- 2) Translations (product) --------
        $ptr = $db->table('product_translations')->where('product_id', $productId)->get()->getResultArray();
        // map: locale => row
        $pTrByLocale = [];
        foreach ($ptr as $row) {
            $loc = strtolower($row['locale']);
            $pTrByLocale[$loc] = $row;
        }

        // -------- 3) Categories (names by locale) --------
        // ordered by mapping sort_order then cat sort_order
        $cats = $db->table('product_categories pc')
            ->select('c.id, c.slug, pc.sort_order AS map_sort')
            ->join('categories c', 'c.id = pc.category_id', 'left')
            ->where('pc.product_id', $productId)
            ->orderBy('pc.sort_order', 'ASC')->orderBy('c.sort_order', 'ASC')->get()->getResultArray();

        // category translations for all referenced categories and locales in one round-trip
        $catIds = array_map(fn($r) => (int)$r['id'], $cats);
        $catTrByLocaleId = []; // [locale][cat_id] => ['name'=>..., 'description'=>..., 'meta'=>...]
        if (!empty($catIds)) {
            $ctr = $db->table('category_translations')->whereIn('category_id', $catIds)->get()->getResultArray();
            foreach ($ctr as $r) {
                $loc = strtolower($r['locale']);
                $cid = (int)$r['category_id'];
                $catTrByLocaleId[$loc][$cid] = $r;
            }
        }

        // -------- 4) Images --------
        $images = $db->table('product_images')->where('product_id', $productId)
            ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')->get()->getResultArray();
        // Map as simple array: [{id,url,alt,sort_order}]
        $imagesArr = array_map(function ($r) {
            return [
                'id'         => (int)$r['id'],
                'url'        => $r['url'] ?? null,
                'alt'        => $r['alt'] ?? null,
                'sort_order' => (int)($r['sort_order'] ?? 0),
            ];
        }, $images);

        // -------- 5) Spec groups + items (+ translations) --------
        $groups = $db->table('product_spec_groups')->where('product_id', $productId)
            ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')->get()->getResultArray();
        $groupIds = array_map(fn($g) => (int)$g['id'], $groups);

        $gTrByLocale = [];     // [locale][group_id] => row
        $itemsByGroup = [];    // [group_id] => item[]
        $iTrByLocale = [];     // [locale][item_id] => row

        if (!empty($groupIds)) {
            // group translations
            $gtr = $db->table('product_spec_group_translations')->whereIn('group_id', $groupIds)->get()->getResultArray();
            foreach ($gtr as $r) {
                $loc = strtolower($r['locale']);
                $gid = (int)$r['group_id'];
                $gTrByLocale[$loc][$gid] = $r;
            }
            // items
            $items = $db->table('product_spec_items')->whereIn('group_id', $groupIds)
                ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')->get()->getResultArray();
            $itemIds = [];
            foreach ($items as $it) {
                $gid = (int)$it['group_id'];
                $itemsByGroup[$gid] = $itemsByGroup[$gid] ?? [];
                $itemsByGroup[$gid][] = $it;
                $itemIds[] = (int)$it['id'];
            }
            if (!empty($itemIds)) {
                $itr = $db->table('product_spec_item_translations')->whereIn('item_id', $itemIds)->get()->getResultArray();
                foreach ($itr as $r) {
                    $loc = strtolower($r['locale']);
                    $iid = (int)$r['item_id'];
                    $iTrByLocale[$loc][$iid] = $r;
                }
            }
        }

        // -------- 6) Lists + items (+ translations) --------
        $lists = $db->table('product_list_items')->where('product_id', $productId)
            ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')->get()->getResultArray();
        $listIds = array_map(fn($l) => (int)$l['id'], $lists);

        $lTrByLocale = [];  // [locale][list_id]
        $liByList = [];     // [list_id] => item[]
        $liTrByLocale = []; // [locale][item_id]

        if (!empty($listIds)) {
            $ltr = $db->table('product_list_translations')->whereIn('list_id', $listIds)->get()->getResultArray();
            foreach ($ltr as $r) {
                $loc = strtolower($r['locale']);
                $lid = (int)$r['list_id'];
                $lTrByLocale[$loc][$lid] = $r;
            }
            $items = $db->table('product_list_items')->whereIn('list_id', $listIds)
                ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')->get()->getResultArray();
            $liIds = [];
            foreach ($items as $it) {
                $lid = (int)$it['list_id'];
                $liByList[$lid] = $liByList[$lid] ?? [];
                $liByList[$lid][] = $it;
                $liIds[] = (int)$it['id'];
            }
            if (!empty($liIds)) {
                $litr = $db->table('product_list_item_translations')->whereIn('item_id', $liIds)->get()->getResultArray();
                foreach ($litr as $r) {
                    $loc = strtolower($r['locale']);
                    $iid = (int)$r['item_id'];
                    $liTrByLocale[$loc][$iid] = $r;
                }
            }
        }

        // -------- 7) Tables (+ translations) --------
        $tables = $db->table('product_tables')->where('product_id', $productId)
            ->orderBy('sort_order', 'ASC')->orderBy('id', 'ASC')->get()->getResultArray();
        $tableIds = array_map(fn($t) => (int)$t['id'], $tables);

        $tTrByLocale = []; // [locale][table_id]
        if (!empty($tableIds)) {
            $ttr = $db->table('product_table_translations')->whereIn('table_id', $tableIds)->get()->getResultArray();
            foreach ($ttr as $r) {
                $loc = strtolower($r['locale']);
                $tid = (int)$r['table_id'];
                $tTrByLocale[$loc][$tid] = $r;
            }
        }

        // ---------- helpers ----------
        $pick = function (array $perLocale, string $loc, $key, $default = null) use ($fallback) {
            $rowLoc = $perLocale[$loc] ?? null;
            if ($rowLoc && array_key_exists($key, $rowLoc) && $rowLoc[$key] !== null && $rowLoc[$key] !== '') {
                return $rowLoc[$key];
            }
            $rowEn = $perLocale[$fallback] ?? null;
            if ($rowEn && array_key_exists($key, $rowEn) && $rowEn[$key] !== null && $rowEn[$key] !== '') {
                return $rowEn[$key];
            }
            return $default;
        };
        $jsonMaybe = function ($v) {
            if ($v === null || $v === '') return null;
            $d = json_decode($v, true);
            return (json_last_error() === JSON_ERROR_NONE) ? $d : $v;
        };

        $buildBundleFor = function (string $loc) use (
            $p,
            $pTrByLocale,
            $cats,
            $catTrByLocaleId,
            $imagesArr,
            $groups,
            $gTrByLocale,
            $itemsByGroup,
            $iTrByLocale,
            $lists,
            $lTrByLocale,
            $liByList,
            $liTrByLocale,
            $tables,
            $tTrByLocale,
            $pick,
            $jsonMaybe
        ) {
            // base + translation
            $name        = $pick($pTrByLocale, $loc, 'name', null);
            $description = $pick($pTrByLocale, $loc, 'description', null);
            $pmeta       = $pick($pTrByLocale, $loc, 'meta', null);
            $pmeta       = is_array($pmeta) ? $pmeta : $jsonMaybe($pmeta);

            // categories (names in chosen locale with EN fallback)
            $catNames = [];
            foreach ($cats as $c) {
                $cid = (int)$c['id'];
                $nm = null;
                if (isset($catTrByLocaleId[$loc][$cid]['name']) && $catTrByLocaleId[$loc][$cid]['name'] !== '') {
                    $nm = $catTrByLocaleId[$loc][$cid]['name'];
                } elseif (isset($catTrByLocaleId['en'][$cid]['name']) && $catTrByLocaleId['en'][$cid]['name'] !== '') {
                    $nm = $catTrByLocaleId['en'][$cid]['name'];
                }
                if ($nm !== null) $catNames[] = $nm;
            }

            // spec groups
            $specs = [];
            foreach ($groups as $g) {
                $gid = (int)$g['id'];
                $title = $pick($gTrByLocale[$gid] ?? [], $loc, 'title', null);
                $desc  = $pick($gTrByLocale[$gid] ?? [], $loc, 'description', null);
                $gmeta = $pick($gTrByLocale[$gid] ?? [], $loc, 'meta', null);
                $gmeta = is_array($gmeta) ? $gmeta : $jsonMaybe($gmeta);

                $items = [];
                foreach ($itemsByGroup[$gid] ?? [] as $it) {
                    $iid   = (int)$it['id'];
                    $label = $pick($iTrByLocale[$iid] ?? [], $loc, 'label', null);
                    $value = $pick($iTrByLocale[$iid] ?? [], $loc, 'value', null);
                    $imeta = $pick($iTrByLocale[$iid] ?? [], $loc, 'meta', null);
                    $imeta = is_array($imeta) ? $imeta : $jsonMaybe($imeta);

                    $items[] = [
                        'id'         => $iid,
                        'code'       => $it['code'] ?? null,
                        'sort_order' => (int)($it['sort_order'] ?? 0),
                        'label'      => $label,
                        'value'      => $value,
                        'meta'       => $imeta,
                    ];
                }

                $specs[] = [
                    'id'         => $gid,
                    'code'       => $g['code'] ?? null,
                    'sort_order' => (int)($g['sort_order'] ?? 0),
                    'title'      => $title,
                    'description' => $desc,
                    'meta'       => $gmeta,
                    'items'      => $items,
                ];
            }

            // lists
            $listsOut = [];
            foreach ($lists as $l) {
                $lid = (int)$l['id'];
                $title = $pick($lTrByLocale[$lid] ?? [], $loc, 'title', null);
                $desc  = $pick($lTrByLocale[$lid] ?? [], $loc, 'description', null);
                $lmeta = $pick($lTrByLocale[$lid] ?? [], $loc, 'meta', null);
                $lmeta = is_array($lmeta) ? $lmeta : $jsonMaybe($lmeta);

                $items = [];
                foreach ($liByList[$lid] ?? [] as $it) {
                    $iid  = (int)$it['id'];
                    $text = $pick($liTrByLocale[$iid] ?? [], $loc, 'text', null);
                    $imeta = $pick($liTrByLocale[$iid] ?? [], $loc, 'meta', null);
                    $imeta = is_array($imeta) ? $imeta : $jsonMaybe($imeta);
                    $items[] = [
                        'id'         => $iid,
                        'code'       => $it['code'] ?? null,
                        'sort_order' => (int)($it['sort_order'] ?? 0),
                        'text'       => $text,
                        'meta'       => $imeta,
                    ];
                }

                $listsOut[] = [
                    'id'         => $lid,
                    'code'       => $l['code'] ?? null,
                    'icon'       => $l['icon'] ?? null,
                    'sort_order' => (int)($l['sort_order'] ?? 0),
                    'title'      => $title,
                    'description' => $desc,
                    'meta'       => $lmeta,
                    'items'      => $items,
                ];
            }

            // tables
            $tablesOut = [];
            foreach ($tables as $t) {
                $tid = (int)$t['id'];
                $head = $pick($tTrByLocale[$tid] ?? [], $loc, 'heading', null);
                $intro = $pick($tTrByLocale[$tid] ?? [], $loc, 'intro', null);
                $cols = $pick($tTrByLocale[$tid] ?? [], $loc, 'columns_json', null);
                $rows = $pick($tTrByLocale[$tid] ?? [], $loc, 'rows_json', null);
                $note = $pick($tTrByLocale[$tid] ?? [], $loc, 'note', null);
                $tmeta = $pick($tTrByLocale[$tid] ?? [], $loc, 'meta', null);

                $tablesOut[] = [
                    'id'         => $tid,
                    'code'       => $t['code'] ?? null,
                    'sort_order' => (int)($t['sort_order'] ?? 0),
                    'heading'    => $head,
                    'intro'      => $intro,
                    'columns'    => $jsonMaybe($cols) ?? [],
                    'rows'       => $jsonMaybe($rows) ?? [],
                    'note'       => $note,
                    'meta'       => is_array($tmeta) ? $tmeta : $jsonMaybe($tmeta),
                ];
            }

            return [
                'id'           => (int)$p['id'],
                'slug'         => $p['slug'],
                'code'         => $p['code'] ?? null,
                'status'       => $p['status'] ?? null,
                'published_at' => $p['published_at'] ?? null,
                'name'         => $name,
                'description'  => $description,
                'meta'         => $pmeta,
                'categories'   => $catNames,
                'images'       => $imagesArr,
                'spec_groups'  => $specs,
                'lists'        => $listsOut,
                'tables'       => $tablesOut,
            ];
        };

        // Build bundles for all three locales
        $resp = [
            'en'   => $buildBundleFor('en'),
            'ar'   => $buildBundleFor('ar'),
            'zh'   => $buildBundleFor('zh'),
            'meta' => ['id' => $productId, 'slug' => $p['slug']],
        ];

        return $this->response->setJSON($resp);
    }

    // GET /api/public/products?q=&page=&limit=&locale=
    public function index()
    {
        $q      = trim($this->request->getGet('q') ?? '');
        $page   = max(1, (int)($this->request->getGet('page') ?? 1));
        $limit  = max(1, min(100, (int)($this->request->getGet('limit') ?? 24)));
        $offset = ($page - 1) * $limit;
        $locale = $this->request->getGet('locale') ?: 'en';

        $db = \Config\Database::connect();
        $b  = $db->table('products p');

        // Translations (requested + en fallback)
        $b->join('product_translations tr', "tr.product_id = p.id AND tr.locale = " . $db->escape($locale), 'left');
        $b->join('product_translations en', "en.product_id = p.id AND en.locale = 'en'", 'left');

        // --- Primary category (first by sort_order) via subquery join ---
        $primaryCatSql = "(SELECT product_id, MIN(sort_order) AS min_sort
                           FROM product_categories
                           GROUP BY product_id) pc1";
        $b->join($primaryCatSql, 'pc1.product_id = p.id', 'left', false); // $escape=false

        $b->join('product_categories pc', 'pc.product_id = p.id AND pc.sort_order = pc1.min_sort', 'left');
        $b->join('categories c', 'c.id = pc.category_id', 'left');
        $b->join('category_translations ctr', "ctr.category_id = c.id AND ctr.locale = " . $db->escape($locale), 'left');
        $b->join('category_translations cen', "cen.category_id = c.id AND cen.locale = 'en'", 'left');

        // --- First image (first by sort_order) via subquery join ---
        $firstImgSql = "(SELECT product_id, MIN(sort_order) AS min_sort
                         FROM product_images
                         GROUP BY product_id) pi1";
        $b->join($firstImgSql, 'pi1.product_id = p.id', 'left', false); // $escape=false
        $b->join('product_images pi', 'pi.product_id = p.id AND pi.sort_order = pi1.min_sort', 'left');

        // Search
        if ($q !== '') {
            $b->groupStart()
                ->like('p.slug', $q)
                ->orLike('p.code', $q)
                ->orLike('tr.name', $q)
                ->orLike('en.name', $q)
                ->groupEnd();
        }

        // Count (before limit)
        $bCount = clone $b;
        $bCount->select('COUNT(DISTINCT p.id) AS c', false);
        $total = (int)($bCount->get()->getRow('c') ?? 0);

        // Select fields
        $b->select([
            'p.id',
            'p.slug',
            "COALESCE(tr.name, en.name) AS name",
            "COALESCE(tr.description, en.description) AS description",
            "(tr.name IS NULL AND en.name IS NOT NULL) AS fallbackLocale",
            "COALESCE(ctr.name, cen.name) AS category",
            'pi.url AS image',
        ], false)
            ->orderBy('p.created_at', 'DESC')
            ->orderBy('p.id', 'DESC')
            ->groupBy('p.id');

        $rowsRaw = $b->get($limit, $offset)->getResultArray();

        // Map to UI shape
        $rows = array_map(static function ($r) {
            return [
                'id'            => (int)$r['id'],
                'name'          => $r['name'],
                'slug'          => $r['slug'],
                'description'   => $r['description'],
                'brand'         => null,
                'category'      => $r['category'] ?? null,
                'image'         => $r['image'] ?? null,
                'price'         => ['mrp' => 0, 'final' => 0],
                'best_discount' => null,
            ];
        }, $rowsRaw);

        return $this->response->setJSON([
            'data' => $rows,
            'meta' => [
                'total'  => $total,
                'page'   => $page,
                'limit'  => $limit,
                'q'      => $q,
                'locale' => $locale,
            ],
        ]);
    }
}
