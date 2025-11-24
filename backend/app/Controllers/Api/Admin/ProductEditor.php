<?php

namespace App\Controllers\Api\Admin;

use App\Controllers\BaseController;
use App\Models\ProductModel;
use App\Services\ProductLayoutService;


class ProductEditor extends BaseController
{
    // ---------------------- Helpers ----------------------

    private function readPayload(): array
    {
        $payload = $this->request->getJSON(true);
        if (!is_array($payload)) {
            $post = $this->request->getPost() ?: [];
            // allow "base" / "translation" to come as JSON strings in multipart
            foreach (['base', 'translation'] as $k) {
                if (isset($post[$k]) && is_string($post[$k])) {
                    $decoded = json_decode($post[$k], true);
                    if (json_last_error() === JSON_ERROR_NONE) $post[$k] = $decoded;
                }
            }
            $payload = $post;
        }
        return $payload;
    }

    private function getLocaleFromPayload(array $payload): string
    {
        $fromBody = isset($payload['locale']) ? trim((string)$payload['locale']) : '';
        $fromGet  = $this->request->getGet('locale') ?: '';
        return $fromBody !== '' ? $fromBody : ($fromGet !== '' ? $fromGet : 'en');
    }

    private function ensureUniqueSlug(ProductModel $model, string $base, ?int $ignoreId = null): string
    {
        $slug = $this->slugify($base);
        if ($slug === '') $slug = 'product';
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

    private function productOr404(int $id): array
    {
        $m = new ProductModel();
        $row = $m->find($id);
        if (!$row) {
            $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found'])->send();
            exit;
        }
        return $row;
    }

    private function categoryExists(int $categoryId): bool
    {
        $db = \Config\Database::connect();
        $row = $db->table('categories')->select('id')->where('id', $categoryId)->get()->getFirstRow();
        return (bool)$row;
    }

    // =====================================================
    // POST /api/admin/products
    // Body (JSON or multipart):
    // {
    //   "locale": "en",
    //   "base": {
    //       "type": "product|material|service",
    //       "status": "draft|published|archived",          // optional
    //       "slug": "optional-custom-slug",                // optional
    //       "code": "SKU-123",                             // optional (aka sku)
    //       "published_at": "YYYY-MM-DD HH:MM:SS",         // optional
    //       "category_id": 1                               // optional: link 1 category
    //   },
    //   "translation": {
    //       "name": "Required name for locale",
    //       "description": "Optional description"
    //   }
    // }
    public function create()
    {
        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);

        $base = $payload['base'] ?? [];
        $tr   = $payload['translation'] ?? [];

        // Validate translation
        $name = trim((string)($tr['name'] ?? ''));
        if ($name === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'name is required']);

        // Validate base
        $type = isset($base['type']) && in_array($base['type'], ['product', 'material', 'service'], true)
            ? $base['type'] : 'product';
        $status = isset($base['status']) && in_array($base['status'], ['draft', 'published', 'archived'], true)
            ? $base['status'] : 'draft';

        $code = isset($base['code']) && $base['code'] !== '' ? trim((string)$base['code']) : null; // sku
        $slugIn = isset($base['slug']) && $base['slug'] !== '' ? trim((string)$base['slug']) : null;
        $publishedAt = $base['published_at'] ?? null;
        $categoryId  = isset($base['category_id']) ? (int)$base['category_id'] : null;

        if ($categoryId && !$this->categoryExists($categoryId)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'category_id not found']);
        }

        $prodModel = new ProductModel();

        // Unique code?
        if ($code) {
            $exists = $prodModel->builder()->select('id')->where('code', $code)->get()->getFirstRow();
            if ($exists) return $this->response->setStatusCode(422)->setJSON(['error' => 'code already exists']);
        }

        // Compute slug (unique)
        $slug = $this->ensureUniqueSlug($prodModel, $slugIn ?: $name);

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            $now = date('Y-m-d H:i:s');

            // Insert product base
            $id = (int)$prodModel->insert([
                'slug'         => $slug,
                'code'         => $code,
                'type'         => $type,
                'status'       => $status,
                'published_at' => $publishedAt,
                'created_at'   => $now,
                'updated_at'   => $now,
            ], true);

            // Optional category link (single)
            if ($categoryId) {
                $db->table('product_categories')->insert([
                    'product_id' => $id,
                    'category_id' => $categoryId,
                    'sort_order' => 0,
                    'created_at' => $now,
                ]);
            }

            // Default layout shell (as you preferred earlier)
            $db->table('product_layouts')->insert([
                'product_id' => $id,
                'name'       => 'Default',
                'is_default' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Insert translation for locale
            $db->table('product_translations')->insert([
                'product_id'  => $id,
                'locale'      => $locale,
                'name'        => $name,
                'description' => $tr['description'] ?? null,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
            $translationId = (int)$db->insertID();

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('Transaction failed');

            // After creating a product (id in $productId)
            ProductLayoutService::addBlock($id, 'images'); // top image gallery shell
            ProductLayoutService::addBlock($id, 'basic');  // base info block

            return $this->response->setJSON([
                'id'              => $id,
                'slug'            => $slug,
                'code'            => $code,
                'type'            => $type,
                'status'          => $status,
                'published_at'    => $publishedAt,
                'category_id'     => $categoryId,
                'translation'     => [
                    'id'          => $translationId,
                    'locale'      => $locale,
                    'name'        => $name,
                    'description' => $tr['description'] ?? null,
                ],
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Create failed', 'detail' => $e->getMessage()]);
        }
    }

    // =====================================================
    // PUT /api/admin/products/{id}
    // Body (optional fields only):
    // {
    //   "base": {
    //     "type"?: "product|material|service",
    //     "status"?: "draft|published|archived",
    //     "slug"?: "new-slug",
    //     "code"?: "NEW-SKU",
    //     "published_at"?: "YYYY-MM-DD HH:MM:SS",
    //     "category_id"?: 2   // (re)link single category (replaces existing single link if any)
    //   }
    // }
    public function update($id = null)
    {
        $id = (int)$id;
        $this->productOr404($id);
        $payload = $this->readPayload();
        $base    = $payload['base'] ?? [];

        if (!is_array($base) || empty($base)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'No base fields provided']);
        }

        $prodModel = new ProductModel();
        $data = [];

        // Type / Status
        if (array_key_exists('type', $base)) {
            $t = (string)$base['type'];
            if (!in_array($t, ['product', 'material', 'service'], true))
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid type']);
            $data['type'] = $t;
        }
        if (array_key_exists('status', $base)) {
            $s = (string)$base['status'];
            if (!in_array($s, ['draft', 'published', 'archived'], true))
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid status']);
            $data['status'] = $s;
        }

        // Slug
        if (array_key_exists('slug', $base)) {
            $slugIn = trim((string)$base['slug']);
            $data['slug'] = $this->ensureUniqueSlug($prodModel, $slugIn !== '' ? $slugIn : 'product', $id);
        }

        // Code (SKU)
        if (array_key_exists('code', $base)) {
            $code = trim((string)$base['code']);
            if ($code !== '') {
                $exists = $prodModel->builder()->select('id')->where('code', $code)->where('id !=', $id)->get()->getFirstRow();
                if ($exists) return $this->response->setStatusCode(422)->setJSON(['error' => 'code already exists']);
                $data['code'] = $code;
            } else {
                $data['code'] = null;
            }
        }

        // published_at
        if (array_key_exists('published_at', $base)) {
            $data['published_at'] = $base['published_at'] ?: null;
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            if (!empty($data)) {
                $data['updated_at'] = date('Y-m-d H:i:s');
                $prodModel->update($id, $data);
            }

            // Category link (single)
            if (array_key_exists('category_id', $base)) {
                $catId = ($base['category_id'] === '' || $base['category_id'] === null) ? null : (int)$base['category_id'];
                // remove all existing links and set one if provided
                $db->table('product_categories')->where('product_id', $id)->delete();
                if ($catId) {
                    if (!$this->categoryExists($catId)) {
                        throw new \InvalidArgumentException('category_id not found');
                    }
                    $db->table('product_categories')->insert([
                        'product_id' => $id,
                        'category_id' => $catId,
                        'sort_order' => 0,
                        'created_at' => date('Y-m-d H:i:s'),
                    ]);
                }
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('Transaction failed');

            return $this->response->setJSON(['id' => $id, 'updated' => true]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Update failed', 'detail' => $e->getMessage()]);
        }
    }

    // =====================================================
    // PUT /api/admin/products/{id}/translation
    // Body:
    // {
    //   "locale": "zh",
    //   "translation": {
    //       "id": 123,                 // optional existing translation id (for safety/optimistic UI)
    //       "name": "Door zh",         // required
    //       "description": "..."       // optional
    //   }
    // }
    public function upsertTranslation($id = null)
    {
        $id = (int)$id;
        $this->productOr404($id);

        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $tr      = $payload['translation'] ?? [];

        $name = trim((string)($tr['name'] ?? ''));
        if ($name === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'name is required']);
        $desc = $tr['description'] ?? null;
        $hintId = isset($tr['id']) ? (int)$tr['id'] : null;

        $db = \Config\Database::connect();

        // Find existing translation by (product_id, locale)
        $existing = $db->table('product_translations')->where('product_id', $id)->where('locale', $locale)->get()->getFirstRow('array');

        // Safety: if client sent an id that doesn't match this tuple, ignore it (server is source of truth)
        $now = date('Y-m-d H:i:s');

        if ($existing) {
            $db->table('product_translations')->where('id', $existing['id'])->update([
                'name'        => $name,
                'description' => $desc,
                'updated_at'  => $now,
            ]);
            $trId = (int)$existing['id'];
        } else {
            $db->table('product_translations')->insert([
                'product_id'  => $id,
                'locale'      => $locale,
                'name'        => $name,
                'description' => $desc,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
            $trId = (int)$db->insertID();
        }

        return $this->response->setJSON([
            'product_id' => $id,
            'translation' => [
                'id'          => $trId,
                'locale'      => $locale,
                'name'        => $name,
                'description' => $desc,
            ]
        ]);
    }
}
