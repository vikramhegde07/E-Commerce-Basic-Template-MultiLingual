<?php

namespace App\Controllers\Api\Admin;

use App\Controllers\BaseController;
use App\Models\ProductModel;
use App\Services\ProductLayoutService;
use App\Models\ProductListTranslationModel;
use App\Models\ProductContentParagraphTranslationModel;
use App\Models\ProductSpecGroupTranslationModel;
use App\Models\ProductTableTranslationModel;

class ProductContents extends BaseController
{
    // ---------- Helpers ----------
    private function readPayload(): array
    {
        $payload = $this->request->getJSON(true);
        if (!is_array($payload)) {
            $post = $this->request->getPost() ?: [];
            if (isset($post['payload']) && is_string($post['payload'])) {
                $decoded = json_decode($post['payload'], true);
                if (json_last_error() === JSON_ERROR_NONE) $post = $decoded;
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

    private function ensureProductExists(int $productId): void
    {
        $prod = (new ProductModel())->find($productId);
        if (!$prod) {
            $this->response->setStatusCode(404)->setJSON(['error' => 'Product not found'])->send();
            exit;
        }
    }

    private function ensureListOwnership(\CodeIgniter\Database\BaseConnection $db, int $productId, int $listId): bool
    {
        $owned = $db->table('product_lists')->select('id')->where('id', $listId)->where('product_id', $productId)->get()->getFirstRow();
        return (bool)$owned;
    }
    private function ensureSpecGroupOwnership($db, int $productId, int $groupId): bool
    {
        $owned = $db->table('product_spec_groups')->select('id')->where('id', $groupId)->where('product_id', $productId)->get()->getFirstRow();
        return (bool)$owned;
    }
    private function ensureTableOwnership($db, int $productId, int $tableId): bool
    {
        $owned = $db->table('product_tables')->select('id')->where('id', $tableId)->where('product_id', $productId)->get()->getFirstRow();
        return (bool)$owned;
    }
    private function ensureParagraphOwnership($db, int $productId, int $paragraphId): bool
    {
        $owned = $db->table('product_content_paragraphs')->select('id')->where('id', $paragraphId)->where('product_id', $productId)->get()->getFirstRow();
        return (bool)$owned;
    }

    private function uniqueSlugPerProduct($db, string $table, int $productId, string $base): string
    {
        $slug = strtolower(trim(preg_replace('/[^a-z0-9]+/i', '-', $base)));
        $slug = trim($slug, '-') ?: 'item';
        $try  = $slug;
        $i    = 1;
        do {
            $q = $db->table($table)->select('id')->where('product_id', $productId)->where('slug', $try)->get()->getFirstRow();
            if ($q) $try = $slug . '-' . (++$i);
        } while ($q);
        return $try;
    }

    // =========================================================
    //                       LISTS
    // =========================================================

    // POST /api/admin/products/{productId}/contents/lists
    public function createList($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);
        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title = trim((string)($data['title'] ?? ''));
        if ($title === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'title is required']);

        $slug      = trim((string)($data['slug'] ?? ''));
        $desc      = isset($data['description']) ? (string)$data['description'] : null;
        $items     = is_array($data['items'] ?? null) ? $data['items'] : [];
        $sortOrder = (int)($data['sort_order'] ?? 0);

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            // base list
            if ($slug === '') $slug = $title;
            $slug = $this->uniqueSlugPerProduct($db, 'product_lists', $productId, $slug);

            $now = date('Y-m-d H:i:s');
            $db->table('product_lists')->insert([
                'product_id' => $productId,
                'slug'       => $slug,
                'sort_order' => $sortOrder,
                'created_at' => $now,
            ]);
            $listId = (int)$db->insertID();

            // translation
            $db->table('product_list_translations')->insert([
                'list_id'     => $listId,
                'locale'      => $locale,
                'title'       => $title,
                'description' => $desc,
                'created_at'  => $now,
            ]);
            $trId = (int)$db->insertID();

            // items
            $i = 0;
            foreach ($items as $txt) {
                $txt = trim((string)$txt);
                if ($txt === '') continue;
                $db->table('product_list_items')->insert([
                    'list_translation_id' => $trId,
                    'text'                => $txt,
                    'sort_order'          => $i++,
                    'created_at'          => $now,
                ]);
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            ProductLayoutService::addBlock($productId, 'list', $listId);

            return $this->response->setJSON([
                'list_id'          => $listId,
                'list_translation' => $trId,
                'locale'           => $locale,
                'slug'             => $slug,
                'items_count'      => $i,
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Create failed', 'detail' => $e->getMessage()]);
        }
    }

    // PUT /api/admin/products/{productId}/contents/lists/{listId}
    public function replaceList($productId = null, $listId = null)
    {
        $productId = (int)$productId;
        $listId    = (int)$listId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureListOwnership($db, $productId, $listId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'List not found']);
        }

        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title     = trim((string)($data['title'] ?? ''));
        if ($title === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'title is required']);
        $desc      = isset($data['description']) ? (string)$data['description'] : null;
        $items     = is_array($data['items'] ?? null) ? $data['items'] : [];
        $sortOrder = $data['sort_order'] ?? null;
        $slugIn    = isset($data['slug']) ? trim((string)$data['slug']) : null;

        $db->transStart();
        try {
            // update base (slug/sort)
            if ($slugIn !== null && $slugIn !== '') {
                $slugIn = $this->uniqueSlugPerProduct($db, 'product_lists', $productId, $slugIn);
                $db->table('product_lists')->where('id', $listId)->update(['slug' => $slugIn]);
            }
            if ($sortOrder !== null) {
                $db->table('product_lists')->where('id', $listId)->update(['sort_order' => (int)$sortOrder]);
            }

            // upsert translation
            $tr = $db->table('product_list_translations')->where('list_id', $listId)->where('locale', $locale)->get()->getFirstRow('array');
            if ($tr) {
                $db->table('product_list_translations')->where('id', $tr['id'])->update([
                    'title'       => $title,
                    'description' => $desc,
                ]);
                $trId = (int)$tr['id'];

                // replace items
                $db->table('product_list_items')->where('list_translation_id', $trId)->delete();
            } else {
                $db->table('product_list_translations')->insert([
                    'list_id'     => $listId,
                    'locale'      => $locale,
                    'title'       => $title,
                    'description' => $desc,
                    'created_at'  => date('Y-m-d H:i:s'),
                ]);
                $trId = (int)$db->insertID();
            }

            // insert items
            $i = 0;
            foreach ($items as $txt) {
                $txt = trim((string)$txt);
                if ($txt === '') continue;
                $db->table('product_list_items')->insert([
                    'list_translation_id' => $trId,
                    'text'                => $txt,
                    'sort_order'          => $i++,
                    'created_at'          => date('Y-m-d H:i:s'),
                ]);
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            return $this->response->setJSON([
                'list_id'          => $listId,
                'list_translation' => $trId,
                'locale'           => $locale,
                'items_count'      => $i,
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Replace failed', 'detail' => $e->getMessage()]);
        }
    }

    // DELETE /api/admin/products/{productId}/contents/lists/{listId}
    public function deleteList($productId = null, $listId = null)
    {
        $productId = (int)$productId;
        $listId    = (int)$listId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureListOwnership($db, $productId, $listId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'List not found']);
        }
        ProductLayoutService::removeBlockByRef($productId, 'list', $listId);
        $db->table('product_lists')->where('id', $listId)->delete(); // cascades to translations + items
        return $this->response->setJSON(['deleted' => ['list_id' => $listId]]);
    }

    // DELETE /api/admin/products/{productId}/contents/lists/{listId}/{locale}
    public function deleteListLocale($productId = null, $listId = null, $locale = null)
    {
        $productId = (int) $productId;
        $listId    = (int) $listId;
        $locale    = (string) $locale;

        // Basic guard
        if (empty($locale)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => 'Locale is required']);
        }

        // Ensure product exists
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();

        // Ensure that this list actually belongs to this product
        if (!$this->ensureListOwnership($db, $productId, $listId)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'List not found']);
        }

        $translationModel = new ProductListTranslationModel();

        // Find translation for this list + locale
        $translation = $translationModel->byListAndLocale($listId, $locale);

        if (!$translation) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'Translation not found for this locale']);
        }

        // Deleting this translation will cascade to product_list_items
        // through your DB FK constraints.
        $translationModel->delete($translation['id']);

        return $this->response->setJSON([
            'deleted' => [
                'list_id' => $listId,
                'locale'  => $locale,
                'translation_id' => $translation['id'],
            ],
        ]);
    }

    // =========================================================
    //                       SPEC GROUPS
    // =========================================================

    // POST /api/admin/products/{productId}/contents/spec-groups
    public function createSpecGroup($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);
        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title = trim((string)($data['title'] ?? ''));
        if ($title === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'title is required']);

        $slug      = trim((string)($data['slug'] ?? ''));
        $desc      = isset($data['description']) ? (string)$data['description'] : null;
        $items     = is_array($data['items'] ?? null) ? $data['items'] : [];
        $sortOrder = (int)($data['sort_order'] ?? 0);

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            if ($slug === '') $slug = $title;
            $slug = $this->uniqueSlugPerProduct($db, 'product_spec_groups', $productId, $slug);

            $now = date('Y-m-d H:i:s');
            $db->table('product_spec_groups')->insert([
                'product_id' => $productId,
                'slug'       => $slug,
                'sort_order' => $sortOrder,
                'created_at' => $now,
            ]);
            $groupId = (int)$db->insertID();

            $db->table('product_spec_group_translations')->insert([
                'group_id'   => $groupId,
                'locale'     => $locale,
                'title'      => $title,
                'description' => $desc,
                'created_at' => $now,
            ]);
            $trId = (int)$db->insertID();

            $i = 0;
            foreach ($items as $row) {
                if (!is_array($row)) continue;
                $key  = trim((string)($row['key'] ?? ''));
                $val  = trim((string)($row['value'] ?? ''));
                $unit = isset($row['unit']) ? (string)$row['unit'] : null;
                if ($key === '' && $val === '') continue;
                $db->table('product_spec_items')->insert([
                    'spec_group_translation_id' => $trId,
                    'spec_key'   => $key !== '' ? $key : '—',
                    'spec_value' => $val,
                    'unit'       => $unit,
                    'sort_order' => $i++,
                    'created_at' => $now,
                ]);
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            ProductLayoutService::addBlock($productId, 'spec_group', $groupId);

            return $this->response->setJSON([
                'group_id'           => $groupId,
                'group_translation'  => $trId,
                'locale'             => $locale,
                'slug'               => $slug,
                'items_count'        => $i,
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Create failed', 'detail' => $e->getMessage()]);
        }
    }

    // PUT /api/admin/products/{productId}/contents/spec-groups/{groupId}
    public function replaceSpecGroup($productId = null, $groupId = null)
    {
        $productId = (int)$productId;
        $groupId   = (int)$groupId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureSpecGroupOwnership($db, $productId, $groupId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Spec group not found']);
        }

        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title     = trim((string)($data['title'] ?? ''));
        if ($title === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'title is required']);
        $desc      = isset($data['description']) ? (string)$data['description'] : null;
        $items     = is_array($data['items'] ?? null) ? $data['items'] : [];
        $sortOrder = $data['sort_order'] ?? null;
        $slugIn    = isset($data['slug']) ? trim((string)$data['slug']) : null;

        $db->transStart();
        try {
            if ($slugIn !== null && $slugIn !== '') {
                $slugIn = $this->uniqueSlugPerProduct($db, 'product_spec_groups', $productId, $slugIn);
                $db->table('product_spec_groups')->where('id', $groupId)->update(['slug' => $slugIn]);
            }
            if ($sortOrder !== null) {
                $db->table('product_spec_groups')->where('id', $groupId)->update(['sort_order' => (int)$sortOrder]);
            }

            $tr = $db->table('product_spec_group_translations')->where('group_id', $groupId)->where('locale', $locale)->get()->getFirstRow('array');
            if ($tr) {
                $db->table('product_spec_group_translations')->where('id', $tr['id'])->update([
                    'title'       => $title,
                    'description' => $desc,
                ]);
                $trId = (int)$tr['id'];
                $db->table('product_spec_items')->where('spec_group_translation_id', $trId)->delete();
            } else {
                $db->table('product_spec_group_translations')->insert([
                    'group_id'   => $groupId,
                    'locale'     => $locale,
                    'title'      => $title,
                    'description' => $desc,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
                $trId = (int)$db->insertID();
            }

            $i = 0;
            foreach ($items as $row) {
                if (!is_array($row)) continue;
                $key  = trim((string)($row['key'] ?? ''));
                $val  = trim((string)($row['value'] ?? ''));
                $unit = isset($row['unit']) ? (string)$row['unit'] : null;
                if ($key === '' && $val === '') continue;
                $db->table('product_spec_items')->insert([
                    'spec_group_translation_id' => $trId,
                    'spec_key'   => $key !== '' ? $key : '—',
                    'spec_value' => $val,
                    'unit'       => $unit,
                    'sort_order' => $i++,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            return $this->response->setJSON([
                'group_id'          => $groupId,
                'group_translation' => $trId,
                'locale'            => $locale,
                'items_count'       => $i,
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Replace failed', 'detail' => $e->getMessage()]);
        }
    }

    // DELETE /api/admin/products/{productId}/contents/spec-groups/{groupId}
    public function deleteSpecGroup($productId = null, $groupId = null)
    {
        $productId = (int)$productId;
        $groupId   = (int)$groupId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureSpecGroupOwnership($db, $productId, $groupId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Spec group not found']);
        }
        ProductLayoutService::removeBlockByRef($productId, 'spec_group', $groupId);
        $db->table('product_spec_groups')->where('id', $groupId)->delete(); // cascades everything under it
        return $this->response->setJSON(['deleted' => ['group_id' => $groupId]]);
    }

    // DELETE /api/admin/products/{productId}/contents/spec-groups/{groupId}/{locale}
    public function deleteSpecGroupLocale($productId = null, $groupId = null, $locale = null)
    {
        $productId = (int) $productId;
        $groupId    = (int) $groupId;
        $locale    = (string) $locale;

        // Basic guard
        if (empty($locale)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => 'Locale is required']);
        }

        // Ensure product exists
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();

        // Ensure that this list actually belongs to this product
        if (!$this->ensureSpecGroupOwnership($db, $productId, $groupId)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'Specs Group not found']);
        }

        $translationModel = new ProductSpecGroupTranslationModel();

        // Find translation for this Spec Group + locale
        $translation = $translationModel->byGroupAndLocale($groupId, $locale);

        if (!$translation) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'Translation not found for this locale']);
        }

        $translationModel->delete($translation['id']);

        return $this->response->setJSON([
            'deleted' => [
                'list_id' => $groupId,
                'locale'  => $locale,
                'translation_id' => $translation['id'],
            ],
        ]);
    }

    // =========================================================
    //                       TABLES
    // =========================================================

    // POST /api/admin/products/{productId}/contents/tables
    public function createTable($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);
        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title    = trim((string)($data['title'] ?? ''));
        if ($title === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'title is required']);
        $subtitle = isset($data['subtitle']) ? (string)$data['subtitle'] : null;
        $columns  = is_array($data['columns'] ?? null) ? array_values($data['columns']) : [];
        $rows     = is_array($data['rows'] ?? null) ? array_values($data['rows']) : [];
        $notes    = isset($data['notes']) ? (string)$data['notes'] : null;
        $sort     = (int)($data['sort_order'] ?? 0);

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            $now = date('Y-m-d H:i:s');
            $db->table('product_tables')->insert([
                'product_id' => $productId,
                'sort_order' => $sort,
                'created_at' => $now,
            ]);
            $tableId = (int)$db->insertID();

            $db->table('product_table_translations')->insert([
                'table_id'     => $tableId,
                'locale'       => $locale,
                'title'        => $title,
                'subtitle'     => $subtitle,
                'columns_json' => json_encode($columns, JSON_UNESCAPED_UNICODE),
                'rows_json'    => json_encode($rows, JSON_UNESCAPED_UNICODE),
                'notes'        => $notes,
                'created_at'   => $now,
            ]);

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            ProductLayoutService::addBlock($productId, 'table', $tableId);

            return $this->response->setJSON([
                'table_id' => $tableId,
                'locale'   => $locale,
            ]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Create failed', 'detail' => $e->getMessage()]);
        }
    }

    // PUT /api/admin/products/{productId}/contents/tables/{tableId}
    public function replaceTable($productId = null, $tableId = null)
    {
        $productId = (int)$productId;
        $tableId   = (int)$tableId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureTableOwnership($db, $productId, $tableId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Table not found']);
        }

        $payload  = $this->readPayload();
        $locale   = $this->getLocaleFromPayload($payload);
        $data     = $payload['data'] ?? [];

        $title    = trim((string)($data['title'] ?? ''));
        if ($title === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'title is required']);
        $subtitle = isset($data['subtitle']) ? (string)$data['subtitle'] : null;
        $columns  = is_array($data['columns'] ?? null) ? array_values($data['columns']) : [];
        $rows     = is_array($data['rows'] ?? null) ? array_values($data['rows']) : [];
        $notes    = isset($data['notes']) ? (string)$data['notes'] : null;
        $sort     = $data['sort_order'] ?? null;

        $db->transStart();
        try {
            if ($sort !== null) {
                $db->table('product_tables')->where('id', $tableId)->update(['sort_order' => (int)$sort]);
            }

            $tr = $db->table('product_table_translations')->where('table_id', $tableId)->where('locale', $locale)->get()->getFirstRow('array');
            $row = [
                'title'        => $title,
                'subtitle'     => $subtitle,
                'columns_json' => json_encode($columns, JSON_UNESCAPED_UNICODE),
                'rows_json'    => json_encode($rows, JSON_UNESCAPED_UNICODE),
                'notes'        => $notes,
            ];
            if ($tr) {
                $db->table('product_table_translations')->where('id', $tr['id'])->update($row);
            } else {
                $row += ['table_id' => $tableId, 'locale' => $locale, 'created_at' => date('Y-m-d H:i:s')];
                $db->table('product_table_translations')->insert($row);
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');


            return $this->response->setJSON(['table_id' => $tableId, 'locale' => $locale]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Replace failed', 'detail' => $e->getMessage()]);
        }
    }

    // DELETE /api/admin/products/{productId}/contents/tables/{tableId}
    public function deleteTable($productId = null, $tableId = null)
    {
        $productId = (int)$productId;
        $tableId   = (int)$tableId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureTableOwnership($db, $productId, $tableId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Table not found']);
        }
        ProductLayoutService::removeBlockByRef($productId, 'table', $tableId);
        $db->table('product_tables')->where('id', $tableId)->delete(); // cascades translations
        return $this->response->setJSON(['deleted' => ['table_id' => $tableId]]);
    }

    // DELETE /api/admin/products/{productId}/contents/tables/{tableId}/{locale}
    public function deleteTableLocale($productId = null, $tableId = null, $locale = null)
    {
        $productId = (int) $productId;
        $tableId    = (int) $tableId;
        $locale    = (string) $locale;

        // Basic guard
        if (empty($locale)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => 'Locale is required']);
        }

        // Ensure product exists
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();

        // Ensure that this list actually belongs to this product
        if (!$this->ensureTableOwnership($db, $productId, $tableId)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'Table not found', "table id" => $tableId]);
        }

        $translationModel = new ProductTableTranslationModel();

        // Find translation for this list + locale
        $translation = $translationModel->byTableAndLocale($tableId, $locale);

        if (!$translation) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'Translation not found for this locale', "table id" => $tableId]);
        }

        $translationModel->delete($translation['id']);

        return $this->response->setJSON([
            'deleted' => [
                'list_id' => $tableId,
                'locale'  => $locale,
                'translation_id' => $translation['id'],
            ],
        ]);
    }

    // =========================================================
    //                       PARAGRAPHS
    // =========================================================

    // POST /api/admin/products/{productId}/contents/paragraphs
    public function createParagraph($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);
        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title    = isset($data['title']) ? trim((string)$data['title']) : null;
        $subtitle = isset($data['subtitle']) ? (string)$data['subtitle'] : null;
        $full     = isset($data['full_text']) ? trim((string)$data['full_text']) : null;
        $sort     = (int)($data['sort_order'] ?? 0);

        if (($title ?? '') === '' && ($full ?? '') === '') {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'At least title or full_text is required']);
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            $now = date('Y-m-d H:i:s');
            $db->table('product_content_paragraphs')->insert([
                'product_id' => $productId,
                'sort_order' => $sort,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $pid = (int)$db->insertID();

            $db->table('product_content_paragraph_translations')->insert([
                'paragraph_id' => $pid,
                'locale'       => $locale,
                'title'        => $title,
                'subtitle'     => $subtitle,
                'full_text'    => $full,
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            ProductLayoutService::addBlock($productId, 'content_paragraph', $pid);

            return $this->response->setJSON(['paragraph_id' => $pid, 'locale' => $locale]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Create failed', 'detail' => $e->getMessage()]);
        }
    }

    // PUT /api/admin/products/{productId}/contents/paragraphs/{paragraphId}
    public function replaceParagraph($productId = null, $paragraphId = null)
    {
        $productId   = (int)$productId;
        $paragraphId = (int)$paragraphId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureParagraphOwnership($db, $productId, $paragraphId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Paragraph not found']);
        }

        $payload = $this->readPayload();
        $locale  = $this->getLocaleFromPayload($payload);
        $data    = $payload['data'] ?? [];

        $title    = array_key_exists('title', $data) ? trim((string)$data['title']) : null;
        $subtitle = array_key_exists('subtitle', $data) ? (string)$data['subtitle'] : null;
        $full     = array_key_exists('full_text', $data) ? trim((string)$data['full_text']) : null;
        $sort     = $data['sort_order'] ?? null;

        if ($title === null && $subtitle === null && $full === null && $sort === null) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Nothing to update']);
        }

        $db->transStart();
        try {
            if ($sort !== null) {
                $db->table('product_content_paragraphs')->where('id', $paragraphId)->update(['sort_order' => (int)$sort, 'updated_at' => date('Y-m-d H:i:s')]);
            }

            $tr = $db->table('product_content_paragraph_translations')->where('paragraph_id', $paragraphId)->where('locale', $locale)->get()->getFirstRow('array');
            $row = ['updated_at' => date('Y-m-d H:i:s')];
            if ($title !== null)    $row['title']     = $title !== '' ? $title : null;
            if ($subtitle !== null) $row['subtitle']  = $subtitle;
            if ($full !== null)     $row['full_text'] = $full !== '' ? $full : null;

            if ($tr) {
                $db->table('product_content_paragraph_translations')->where('id', $tr['id'])->update($row);
            } else {
                // require at least one non-null field when creating translation
                if (!isset($row['title']) && !isset($row['full_text'])) {
                    return $this->response->setStatusCode(422)->setJSON(['error' => 'Need title or full_text to create translation']);
                }
                $row += [
                    'paragraph_id' => $paragraphId,
                    'locale'      => $locale,
                    'created_at'  => date('Y-m-d H:i:s'),
                ];
                $db->table('product_content_paragraph_translations')->insert($row);
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            return $this->response->setJSON(['paragraph_id' => $paragraphId, 'locale' => $locale]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Replace failed', 'detail' => $e->getMessage()]);
        }
    }

    // DELETE /api/admin/products/{productId}/contents/paragraphs/{paragraphId}
    public function deleteParagraph($productId = null, $paragraphId = null)
    {
        $productId   = (int)$productId;
        $paragraphId = (int)$paragraphId;
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();
        if (!$this->ensureParagraphOwnership($db, $productId, $paragraphId)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Paragraph not found']);
        }
        ProductLayoutService::removeBlockByRef($productId, 'content_paragraph', $paragraphId);
        $db->table('product_content_paragraphs')->where('id', $paragraphId)->delete(); // cascades translations
        return $this->response->setJSON(['deleted' => ['paragraph_id' => $paragraphId]]);
    }

    // DELETE /api/admin/products/{productId}/contents/tables/{paragraphId}/{locale}
    public function deleteParagraphLocale($productId = null, $paragraphId = null, $locale = null)
    {
        $productId = (int) $productId;
        $paragraphId    = (int) $paragraphId;
        $locale    = (string) $locale;

        // Basic guard
        if (empty($locale)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => 'Locale is required']);
        }

        // Ensure product exists
        $this->ensureProductExists($productId);

        $db = \Config\Database::connect();

        // Ensure that this list actually belongs to this product
        if (!$this->ensureParagraphOwnership($db, $productId, $paragraphId)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'List not found']);
        }

        $translationModel = new ProductContentParagraphTranslationModel();

        // Find translation for this list + locale
        $translation = $translationModel->byParaAndLocale($paragraphId, $locale);

        if (!$translation) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => 'Translation not found for this locale']);
        }

        $translationModel->delete($translation['id']);

        return $this->response->setJSON([
            'deleted' => [
                'list_id' => $paragraphId,
                'locale'  => $locale,
                'translation_id' => $translation['id'],
            ],
        ]);
    }
}