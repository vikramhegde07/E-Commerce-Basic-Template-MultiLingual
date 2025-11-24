<?php
// app/Controllers/Public/Categories.php
namespace App\Controllers\Public;

use App\Controllers\BaseController;

class Categories extends BaseController
{
    // GET /api/public/categories?flat=0|1&q=&locale=
    public function index()
    {
        $flat   = (int)($this->request->getGet('flat') ?? 0) === 1;
        $q      = trim($this->request->getGet('q') ?? '');
        $locale = $this->request->getGet('locale') ?: 'en';

        $db = \Config\Database::connect();
        $b  = $db->table('categories base');
        $b->join('category_translations tr', "tr.category_id = base.id AND tr.locale = " . $db->escape($locale), 'left');
        $b->join('category_translations en', "en.category_id = base.id AND en.locale = 'en'", 'left');

        if ($q !== '') {
            $b->groupStart()
                ->like('base.slug', $q)
                ->orLike('tr.name', $q)
                ->orLike('en.name', $q)
                ->groupEnd();
        }

        $b->select([
            'base.id',
            'base.slug',
            'base.parent_id',
            'base.path',
            'base.depth',
            'base.sort_order',
            'base.image_url',
            'base.created_at',
            'base.updated_at',
            "COALESCE(tr.name, en.name) AS name",
            "COALESCE(tr.description, en.description) AS description",
            "(tr.name IS NULL AND en.name IS NOT NULL) AS fallbackLocale"
        ])->orderBy('base.parent_id', 'ASC')
            ->orderBy('base.sort_order', 'ASC')
            ->orderBy('base.id', 'ASC');

        $rows = $b->get()->getResultArray();

        if ($flat) {
            return $this->response->setJSON(['data' => $rows, 'meta' => ['locale' => $locale]]);
        }

        // tree build (same algorithm, translated names already resolved)
        return $this->response->setJSON(['data' => $this->buildTree($rows), 'meta' => ['locale' => $locale]]);
    }

    // GET /api/public/categories/slug/{slug}?locale=
    public function showBySlug($slug = null)
    {
        $slug   = trim((string)$slug);
        $locale = $this->request->getGet('locale') ?: 'en';
        if ($slug === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid slug']);

        $db = \Config\Database::connect();
        $b  = $db->table('categories base');
        $b->join('category_translations tr', "tr.category_id = base.id AND tr.locale = " . $db->escape($locale), 'left');
        $b->join('category_translations en', "en.category_id = base.id AND en.locale = 'en'", 'left');

        $b->select([
            'base.id',
            'base.slug',
            'base.parent_id',
            'base.path',
            'base.depth',
            'base.sort_order',
            'base.image_url',
            'base.created_at',
            'base.updated_at',
            "COALESCE(tr.name, en.name) AS name",
            "COALESCE(tr.description, en.description) AS description",
            "(tr.name IS NULL AND en.name IS NOT NULL) AS fallbackLocale"
        ])->where('base.slug', $slug);

        $row = $b->get()->getRowArray();
        if (!$row) return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);
        return $this->response->setJSON($row);
    }

    private function buildTree(array $rows): array
    {
        $byId = [];
        foreach ($rows as $r) {
            $r['children'] = [];
            $byId[$r['id']] = $r;
        }
        $root = [];
        foreach ($byId as $id => &$node) {
            if ($node['parent_id']) {
                if (isset($byId[$node['parent_id']])) {
                    $byId[$node['parent_id']]['children'][] = &$node;
                } else {
                    $root[] = &$node;
                }
            } else {
                $root[] = &$node;
            }
        }
        return $root;
    }
}
