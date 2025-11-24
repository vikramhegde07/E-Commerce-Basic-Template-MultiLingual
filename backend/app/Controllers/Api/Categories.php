<?php
// app/Controllers/Api/Categories.php
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\CategoriesModel;
use App\Models\CategoryTranslationsModel;

class Categories extends BaseController
{
    // GET /api/categories?q=&parent_id=&page=&limit=&sortBy=&order=&locale=
    public function index()
    {
        $q        = trim($this->request->getGet('q') ?? '');
        $parentId = $this->request->getGet('parent_id');
        $page     = max(1, (int)($this->request->getGet('page') ?? 1));
        $limit    = max(1, min(100, (int)($this->request->getGet('limit') ?? 50)));
        $offset   = ($page - 1) * $limit;
        $sortBy   = $this->request->getGet('sortBy') ?? 'sort_order';
        $order    = strtoupper($this->request->getGet('order') ?? 'ASC');
        $locale   = $this->request->getGet('locale') ?: 'en';

        $allowedSorts = ['sort_order', 'name', 'slug', 'created_at', 'id', 'depth'];
        if (!in_array($sortBy, $allowedSorts, true)) $sortBy = 'sort_order';
        if (!in_array($order, ['ASC', 'DESC'], true)) $order = 'ASC';

        $db = \Config\Database::connect();
        $b  = $db->table('categories base');

        // join translations: requested locale + en fallback
        $b->join('category_translations tr', "tr.category_id = base.id AND tr.locale = " . $db->escape($locale), 'left');
        $b->join('category_translations en', "en.category_id = base.id AND en.locale = 'en'", 'left');

        // filters
        if ($q !== '') {
            $b->groupStart()
                ->like('base.slug', $q)
                ->orLike('tr.name', $q)
                ->orLike('en.name', $q)
                ->groupEnd();
        }
        if ($parentId !== null && $parentId !== '') {
            $b->where('base.parent_id', (int)$parentId);
        }

        // total (before limit)
        $bCount = clone $b;
        $bCount->select('COUNT(*) AS c');
        $total = (int)($bCount->get()->getRow('c') ?? 0);

        // select
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
            "COALESCE(tr.meta, en.meta) AS meta",
            "(tr.name IS NULL AND en.name IS NOT NULL) AS fallbackLocale"
        ]);

        // sort
        if ($sortBy === 'name') {
            $b->orderBy('COALESCE(tr.name, en.name)', $order);
        } else {
            $b->orderBy('base.' . $sortBy, $order);
        }
        $b->orderBy('base.id', 'ASC');

        $rows = $b->get($limit, $offset)->getResultArray();

        return $this->response->setJSON([
            'data' => $rows,
            'meta' => [
                'total'      => $total,
                'page'       => $page,
                'limit'      => $limit,
                'q'          => $q,
                'parent_id'  => $parentId,
                'sortBy'     => $sortBy,
                'order'      => $order,
                'locale'     => $locale,
            ],
        ]);
    }

    // GET /api/categories/{id}?locale=
    // GET /api/categories/{id}?locale=&include=translations
    public function show($id = null)
    {
        $id     = (int)$id;
        $locale = $this->request->getGet('locale') ?: 'en';
        $include = $this->request->getGet('include') ?? '';

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
            "COALESCE(tr.meta, en.meta) AS meta",
            "(tr.name IS NULL AND en.name IS NOT NULL) AS fallbackLocale"
        ])->where('base.id', $id);

        $row = $b->get()->getRowArray();
        if (!$row) return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);

        // Optional: include all translations
        if ($include === 'translations') {
            $trModel = new CategoryTranslationsModel();
            $trRows  = $trModel->where('category_id', $id)->orderBy('locale', 'ASC')->findAll();
            $row['translations'] = $trRows; // [{id, category_id, locale, name, description, meta, ...}]
        }

        return $this->response->setJSON($row);
    }


    // POST /api/categories?locale=
    // Accepts JSON or multipart/form-data; base fields + translated fields for ?locale (default en)
    public function create()
    {
        $locale = $this->request->getGet('locale') ?: 'en';

        // read inputs (JSON or form)
        $body = $this->request->getPost();
        if ($this->request->getHeaderLine("Content-Type") === 'application/json') {
            $bodyData = $this->request->getJSON(true) ?? "";
            if ($bodyData !== "" && $bodyData) $body = $bodyData;
        }

        $name        = trim((string)($body['name'] ?? ''));
        $slug        = trim((string)($body['slug'] ?? ''));
        $parentId    = isset($body['parent_id']) && $body['parent_id'] !== '' ? (int)$body['parent_id'] : null;
        $description = $body['description'] ?? null;
        $sortOrder   = isset($body['sort_order']) ? (int)$body['sort_order'] : 0;
        $meta        = $body['meta'] ?? null;

        if ($name === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'name is required']);

        $catModel = new CategoriesModel();

        // parent check
        $parent = null;
        if ($parentId) {
            $parent = $catModel->find($parentId);
            if (!$parent) return $this->response->setStatusCode(422)->setJSON(['error' => 'parent_id not found']);
        }

        // unique slug (EN-only base)
        $slug = $this->ensureUniqueSlug($catModel, $slug !== '' ? $slug : $name);

        // image upload (optional)
        helper('file');
        $imageUrl = null;

        $file = $this->request->getFile('image');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $mime = $file->getMimeType();
            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid image mime type']);
            }
            $res = upload_file($file, 'categories');
            if (!empty($res['error'])) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Image upload failed', 'detail' => $res['error']]);
            }
            $imageUrl = $res['path'] ?? null;
        } elseif (!empty($body['image_url'])) {
            $imageUrl = trim((string)$body['image_url']);
        }

        $now = date('Y-m-d H:i:s');
        $id = (int)$catModel->insert([
            'slug'       => $slug,
            'image_url'  => $imageUrl,
            'parent_id'  => $parentId,
            'sort_order' => $sortOrder,
            'created_at' => $now,
            'updated_at' => $now,
        ], true);

        // compute path/depth
        $this->updatePathDepth($id, $parent);

        // translation row (for requested locale)
        $trModel = new CategoryTranslationsModel();
        $trModel->insert([
            'category_id' => $id,
            'locale'      => $locale,
            'name'        => $name,
            'description' => $description,
            'meta'        => $meta,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // return with resolved translation
        return $this->show($id);
    }

    // PUT /api/categories/{id}
    // Accepts JSON OR multipart/form-data:
    // JSON shape:
    // { "base": {slug?, parent_id?, sort_order?, image_url?}, "translations":[{locale, name?, description?, meta?}, ...] }
    // Multipart:
    //   fields: base=<json>, translations=<json>, image=<file> (optional)
    public function update($id = null)
    {
        $id = (int)$id;

        $catModel = new CategoriesModel();
        $cat      = $catModel->find($id);
        if (!$cat) return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);

        // Read payload
        $payload = [];
        if ($this->request->getHeaderLine("Content-Type") === 'application/json') {
            $payload = $this->request->getJSON(true);
        }
        if (!is_array($payload)) {
            // Try form/multipart
            $payload = $this->request->getPost() ?: [];
            // decode JSON strings if provided
            if (isset($payload['base']) && is_string($payload['base'])) {
                $decoded = json_decode($payload['base'], true);
                if (json_last_error() === JSON_ERROR_NONE) $payload['base'] = $decoded;
            }
            if (isset($payload['translations']) && is_string($payload['translations'])) {
                $decoded = json_decode($payload['translations'], true);
                if (json_last_error() === JSON_ERROR_NONE) $payload['translations'] = $decoded;
            }
        }

        $base = $payload['base'] ?? [];
        $translations = $payload['translations'] ?? [];

        // ---------- Base updates ----------
        $data = [];
        // slug (EN-only)
        if (array_key_exists('slug', $base)) {
            $slug = trim((string)$base['slug']);
            $data['slug'] = $this->ensureUniqueSlug($catModel, $slug !== '' ? $slug : ($base['slug'] ?? $cat['slug']), $id);
        }
        // parent
        if (array_key_exists('parent_id', $base)) {
            $newParentId = ($base['parent_id'] === '' || $base['parent_id'] === null) ? null : (int)$base['parent_id'];
            if ($newParentId === $id) return $this->response->setStatusCode(422)->setJSON(['error' => 'Cannot set parent to self']);
            if ($newParentId !== ($cat['parent_id'] ?? null)) {
                // prevent moving under own descendant
                if ($newParentId) {
                    $parent = $catModel->find($newParentId);
                    if (!$parent) return $this->response->setStatusCode(422)->setJSON(['error' => 'parent_id not found']);
                    if (!empty($cat['path'])) {
                        $descPrefix = $cat['path'] . '/';
                        if (!empty($parent['path']) && strpos($parent['path'], $descPrefix) === 0) {
                            return $this->response->setStatusCode(422)->setJSON(['error' => 'Cannot move a node under its descendant']);
                        }
                    }
                }
                $data['parent_id'] = $newParentId;
            }
        }
        // sort order
        if (array_key_exists('sort_order', $base)) {
            $data['sort_order'] = (int)$base['sort_order'];
        }

        // Image handling:
        helper('file');
        $file = $this->request->getFile('image');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $mime = $file->getMimeType();
            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid image mime type']);
            }
            $res = upload_file($file, 'categories');
            if (!empty($res['error'])) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Image upload failed', 'detail' => $res['error']]);
            }
            $newPath = $res['path'] ?? null;
            if (!empty($cat['image_url'])) remove_file($cat['image_url'], 'categories');
            $data['image_url'] = $newPath;
        } else {
            if (array_key_exists('image_url', $base)) {
                $img = trim((string)$base['image_url']);
                if ($img === '') {
                    if (!empty($cat['image_url'])) remove_file($cat['image_url'], 'categories');
                    $data['image_url'] = null;
                } else {
                    $data['image_url'] = $img;
                }
            }
        }

        $parentChanged = array_key_exists('parent_id', $data);
        if (!empty($data)) {
            $data['updated_at'] = date('Y-m-d H:i:s');
            $catModel->update($id, $data);
        }
        if ($parentChanged || array_key_exists('slug', $data)) {
            $parent = isset($data['parent_id']) && $data['parent_id'] ? $catModel->find($data['parent_id']) : null;
            $this->updatePathDepth($id, $parent, true);
        }

        // ---------- Translations upsert ----------
        if (!empty($translations) && is_array($translations)) {
            $trModel = new CategoryTranslationsModel();
            foreach ($translations as $row) {
                if (!is_array($row) || empty($row['locale'])) continue;
                $locale = trim((string)$row['locale']);
                $tr = $trModel->where('category_id', $id)->where('locale', $locale)->first();

                $payload = [];
                if (array_key_exists('name', $row))        $payload['name']        = $row['name'];
                if (array_key_exists('description', $row)) $payload['description'] = $row['description'];
                if (array_key_exists('meta', $row))        $payload['meta']        = $row['meta'];

                if (!empty($payload)) {
                    $payload['updated_at'] = date('Y-m-d H:i:s');
                    if ($tr) {
                        $trModel->update($tr['id'], $payload);
                    } else {
                        // if inserting a brand new translation, name is required
                        if (!isset($payload['name']) || trim((string)$payload['name']) === '') {
                            return $this->response->setStatusCode(422)->setJSON(['error' => "name is required for new translation ($locale)"]);
                        }
                        $payload['category_id'] = $id;
                        $payload['locale']      = $locale;
                        $payload['created_at']  = date('Y-m-d H:i:s');
                        $trModel->insert($payload);
                    }
                }
            }
        }

        // return the fresh row + translations for convenience
        $this->request->setGlobal('get', array_merge($this->request->getGet(), ['include' => 'translations']));
        return $this->show($id);
    }

    // POST /api/categories/{id}/reorder
    public function reorder($id = null)
    {
        $id = (int)$id;
        $sort = (int)($this->request->getJSON(true)['sort_order'] ?? $this->request->getPost('sort_order'));
        $model = new CategoriesModel();
        if (!$model->find($id)) return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);
        $model->update($id, ['sort_order' => $sort, 'updated_at' => date('Y-m-d H:i:s')]);
        return $this->response->setJSON(['id' => $id, 'sort_order' => $sort]);
    }

    // DELETE /api/categories/{id}
    public function delete($id = null)
    {
        $id = (int)$id;
        $model = new CategoriesModel();
        $cat   = $model->find($id);
        if (!$cat) return $this->response->setStatusCode(404)->setJSON(['error' => 'Category not found']);

        helper('file');
        if (!empty($cat['image_url'])) remove_file($cat['image_url'], 'categories');

        $model->delete($id); // children parent_id becomes NULL via FK rule
        return $this->response->setJSON(['id' => $id, 'message' => 'Deleted']);
    }

    // ---------- helpers ----------

    private function ensureUniqueSlug(CategoriesModel $model, string $base, ?int $ignoreId = null): string
    {
        $slug = $this->slugify($base);
        if ($slug === '') $slug = 'category';
        $i = 1;
        do {
            $qb = $model->builder()->select('id')->where('slug', $slug);
            if ($ignoreId) $qb->where('id !=', $ignoreId);
            $exists = $qb->get()->getFirstRow();
            if ($exists) $slug = $this->slugify($base) . '-' . (++$i);
        } while ($exists);
        return $slug;
    }

    private function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/i', '-', $text);
        return trim($text, '-');
    }

    private function updatePathDepth(int $id, ?array $parent, bool $cascade = false): void
    {
        $db = \Config\Database::connect();

        $parentPath  = $parent['path']  ?? null;
        $parentDepth = (int)($parent['depth'] ?? 0);

        $path  = $parentPath ? ($parentPath . '/' . $id) : (string)$id;
        $depth = $parent ? $parentDepth + 1 : 0;

        $db->table('categories')->where('id', $id)->update([
            'path'       => $path,
            'depth'      => $depth,
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        if (!$cascade) return;

        // rebuild subtree (BFS)
        $children = $db->table('categories')->where('parent_id', $id)->get()->getResultArray();
        $queue = $children;
        while (!empty($queue)) {
            $node = array_shift($queue);
            $p = $db->table('categories')->where('id', $node['parent_id'])->get()->getFirstRow('array');
            $nPath  = ($p && !empty($p['path'])) ? ($p['path'] . '/' . $node['id']) : (string)$node['id'];
            $nDepth = ($p && isset($p['depth'])) ? ((int)$p['depth'] + 1) : 0;

            $db->table('categories')->where('id', $node['id'])->update([
                'path'       => $nPath,
                'depth'      => $nDepth,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            $grand = $db->table('categories')->where('parent_id', $node['id'])->get()->getResultArray();
            foreach ($grand as $g) $queue[] = $g;
        }
    }
}
