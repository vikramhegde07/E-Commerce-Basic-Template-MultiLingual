<?php

namespace App\Controllers\Api\Admin;

use App\Controllers\BaseController;
use Config\Database;
use App\Services\ProductLayoutService;

class ProductImages extends BaseController
{
    /**
     * POST /api/admin/products/{productId}/images
     * Accepts multiple images and saves them to storage + DB
     */
    public function upload($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);

        $groupId = (int)($this->request->getPost('group_id') ?? 0);
        if ($groupId <= 0) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'group_id is required']);
        }

        $files = $this->request->getFiles();
        if (empty($files['images'])) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'No images uploaded']);
        }

        $uploadDir = FCPATH . 'uploads/products/' . $productId . '/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $db = Database::connect();
        $db->transStart();
        $now = date('Y-m-d H:i:s');
        $saved = [];

        try {
            foreach ($files['images'] as $file) {
                if (!$file->isValid()) continue;

                $newName = $file->getRandomName();
                $file->move($uploadDir, $newName);

                $path = '/uploads/products/' . $productId . '/' . $newName;
                $db->table('product_images')->insert([
                    'group_id' => $groupId,
                    'url' => $path,
                    'sort_order' => 0,
                    'created_at' => $now,
                ]);
                $saved[] = ['url' => $path];
            }

            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            return $this->response->setJSON(['uploaded' => $saved]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON([
                'error' => 'Upload failed',
                'detail' => $e->getMessage(),
            ]);
        }
    }

    /**
     * DELETE /api/admin/products/{productId}/images/{imageId}
     */
    public function deleteImage($productId = null, $imageId = null)
    {
        $productId = (int)$productId;
        $imageId   = (int)$imageId;
        $this->ensureProductExists($productId);

        $db = Database::connect();
        $image = $db->table('product_images')
            ->select('url')
            ->where('product_images.id', $imageId)
            ->join('product_image_groups', 'product_image_groups.id = product_images.group_id')
            ->where('product_image_groups.product_id', $productId)
            ->get()
            ->getFirstRow('array');

        if (!$image) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Image not found']);
        }

        $db->transStart();
        try {
            $db->table('product_images')->where('id', $imageId)->delete();
            $db->transComplete();

            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            // remove file
            $path = FCPATH . ltrim($image['url'], '/');
            if (is_file($path)) @unlink($path);

            return $this->response->setJSON(['deleted' => ['image_id' => $imageId]]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON([
                'error' => 'Delete failed',
                'detail' => $e->getMessage(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // IMAGE GROUP CRUD
    // -------------------------------------------------------------------------

    /**
     * POST /api/admin/products/{productId}/image-groups
     */
    public function createGroup($productId = null)
    {
        $productId = (int)$productId;
        $this->ensureProductExists($productId);

        $payload = $this->readPayload();
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'name is required']);

        $db = Database::connect();
        $now = date('Y-m-d H:i:s');

        $db->transStart();
        try {
            $db->table('product_image_groups')->insert([
                'product_id' => $productId,
                'name' => $name,
                'sort_order' => (int)($payload['sort_order'] ?? 0),
                'created_at' => $now,
            ]);
            $groupId = (int)$db->insertID();
            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            return $this->response->setJSON(['group_id' => $groupId, 'name' => $name]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON([
                'error' => 'Create failed',
                'detail' => $e->getMessage(),
            ]);
        }
    }

    /**
     * PUT /api/admin/products/{productId}/image-groups/{groupId}
     */
    public function updateGroup($productId = null, $groupId = null)
    {
        $productId = (int)$productId;
        $groupId   = (int)$groupId;
        $this->ensureProductExists($productId);

        $payload = $this->readPayload();
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') return $this->response->setStatusCode(422)->setJSON(['error' => 'name is required']);

        $db = Database::connect();
        $group = $db->table('product_image_groups')->where('id', $groupId)->where('product_id', $productId)->get()->getFirstRow('array');
        if (!$group) return $this->response->setStatusCode(404)->setJSON(['error' => 'Group not found']);

        $db->transStart();
        try {
            $db->table('product_image_groups')->where('id', $groupId)->update([
                'name' => $name,
                'sort_order' => (int)($payload['sort_order'] ?? $group['sort_order']),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            return $this->response->setJSON(['updated' => ['group_id' => $groupId, 'name' => $name]]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON([
                'error' => 'Update failed',
                'detail' => $e->getMessage(),
            ]);
        }
    }

    /**
     * DELETE /api/admin/products/{productId}/image-groups/{groupId}
     */
    public function deleteGroup($productId = null, $groupId = null)
    {
        $productId = (int)$productId;
        $groupId   = (int)$groupId;
        $this->ensureProductExists($productId);

        $db = Database::connect();
        $group = $db->table('product_image_groups')->where('id', $groupId)->where('product_id', $productId)->get()->getFirstRow('array');
        if (!$group) return $this->response->setStatusCode(404)->setJSON(['error' => 'Group not found']);

        $images = $db->table('product_images')->where('group_id', $groupId)->get()->getResultArray();

        $db->transStart();
        try {
            $db->table('product_image_groups')->where('id', $groupId)->delete();
            $db->transComplete();
            if (!$db->transStatus()) throw new \RuntimeException('tx failed');

            // Delete all images physically
            foreach ($images as $img) {
                $path = FCPATH . ltrim($img['url'], '/');
                if (is_file($path)) @unlink($path);
            }

            return $this->response->setJSON(['deleted' => ['group_id' => $groupId]]);
        } catch (\Throwable $e) {
            $db->transRollback();
            return $this->response->setStatusCode(422)->setJSON([
                'error' => 'Delete failed',
                'detail' => $e->getMessage(),
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------------------------

    private function ensureProductExists(int $id): void
    {
        $db = Database::connect();
        $exists = $db->table('products')->where('id', $id)->countAllResults();
        if ($exists === 0) {
            throw new \CodeIgniter\Exceptions\PageNotFoundException("Product not found: $id");
        }
    }

    private function readPayload(): array
    {
        return json_decode($this->request->getBody(), true) ?? [];
    }
}
