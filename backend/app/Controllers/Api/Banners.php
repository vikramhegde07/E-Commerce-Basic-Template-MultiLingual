<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\BannersModel;

class Banners extends BaseController
{
    // GET /api/banners?q=&active=&permanent=&sortBy=&order=&page=&limit=
    public function index()
    {
        $q         = trim($this->request->getGet('q') ?? '');
        $active    = $this->request->getGet('active');      // '0' | '1' | null
        $permanent = $this->request->getGet('permanent');   // '0' | '1' | null

        $sortBy = $this->request->getGet('sortBy') ?? 'sort_order';
        $order  = strtoupper($this->request->getGet('order') ?? 'DESC');
        $page   = max(1, (int)($this->request->getGet('page') ?? 1));
        $limit  = (int)($this->request->getGet('limit') ?? 12);
        $limit  = max(1, min(100, $limit));
        $offset = ($page - 1) * $limit;

        $allowedSorts = ['id', 'created_at', 'updated_at', 'sort_order', 'is_active'];
        if (!in_array($sortBy, $allowedSorts, true)) $sortBy = 'sort_order';
        if (!in_array($order, ['ASC', 'DESC'], true)) $order = 'DESC';

        $model = new BannersModel();

        if ($q !== '') {
            $model->groupStart()
                ->like('image_url', $q)
                ->groupEnd();
        }

        if ($active !== null && in_array($active, ['0', '1'], true)) {
            $model->where('is_active', (int) $active);
        }

        if ($permanent !== null && in_array($permanent, ['0', '1'], true)) {
            $model->where('is_permanent', (int) $permanent);
        }

        $total = $model->countAllResults(false);
        $rows  = $model->orderBy($sortBy, $order)->findAll($limit, $offset);

        return $this->response->setJSON([
            'data' => $rows,
            'meta' => [
                'total'     => $total,
                'page'      => $page,
                'limit'     => $limit,
                'q'         => $q,
                'active'    => $active,
                'permanent' => $permanent,
                'sortBy'    => $sortBy,
                'order'     => $order,
            ],
        ]);
    }

    // GET /api/banners/{id}
    public function show($id = null)
    {
        $id = (int) $id;
        $row = (new BannersModel())->find($id);
        if (!$row) return $this->response->setStatusCode(404)->setJSON(['error' => 'Banner not found']);
        return $this->response->setJSON($row);
    }

    // POST /api/banners
    // Accepts multipart (preferred) or JSON. Image field name: "image"
    public function create()
    {
        helper('file');

        // Prefer form-data
        $body = $this->request->getPost() ?: ($this->request->getJSON(true) ?? []);

        $isPermanent = (int)($body['is_permanent'] ?? 0);
        $fromDate    = $body['from_date'] ?? null;
        $toDate      = $body['to_date'] ?? null;
        $isActive    = isset($body['is_active']) ? (int)$body['is_active'] : 1;
        $sortOrder   = (int)($body['sort_order'] ?? 0);

        // Validate logic
        if ($isPermanent === 1) {
            $fromDate = null;
            $toDate   = null;
        } else {
            // allow empty strings to represent NULL in form-data
            $fromDate = ($fromDate === '' ? null : $fromDate);
            $toDate   = ($toDate === '' ? null : $toDate);

            if (empty($fromDate) || empty($toDate)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'from_date and to_date are required for scheduled banners']);
            }
            if (strtotime($fromDate) === false || strtotime($toDate) === false) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid date format']);
            }
            if (strtotime($fromDate) > strtotime($toDate)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'from_date must be before or equal to to_date']);
            }
        }

        // Image upload (required)
        $imageUrl = null;
        $file = $this->request->getFile('image');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $mime = $file->getMimeType();
            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid image mime type']);
            }
            $res = upload_file($file, 'banners'); // stores and returns ['path' => '/uploads/banners/xxx.webp']
            if (!empty($res['error'])) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Image upload failed', 'detail' => $res['error']]);
            }
            $imageUrl = $res['path'] ?? null;
        } else {
            // Optional: support direct URL if you want (frontend currently uploads file)
            $imageUrl = $body['image_url'] ?? null;
        }

        if (empty($imageUrl)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'image is required']);
        }

        $now   = date('Y-m-d H:i:s');
        $model = new BannersModel();

        $id = $model->insert([
            'image_url'    => $imageUrl,
            'is_permanent' => $isPermanent,
            'from_date'    => $fromDate ?: null,
            'to_date'      => $toDate   ?: null,
            'is_active'    => $isActive,
            'sort_order'   => $sortOrder,
            'created_at'   => $now,
            'updated_at'   => $now,
        ], true);

        $created = $model->find((int) $id);
        return $this->response->setStatusCode(201)->setJSON($created);
    }

    // PUT /api/banners/{id}
    // Edit schedule/permanence (and optionally active/sort, or even image if provided)
    public function update($id = null)
    {
        $id    = (int) $id;
        $model = new BannersModel();
        $row   = $model->find($id);
        if (!$row) return $this->response->setStatusCode(404)->setJSON(['error' => 'Banner not found']);

        helper('file');

        $body = $this->request->getJSON(true) ?? $this->request->getPost();

        $data = [];

        // is_permanent + dates
        if (isset($body['is_permanent'])) {
            $data['is_permanent'] = (int) $body['is_permanent'];
        } else {
            $data['is_permanent'] = (int) ($row['is_permanent'] ?? 0);
        }

        // Normalize dates (allow empty string -> NULL)
        $fromDate = array_key_exists('from_date', $body) ? ($body['from_date'] === '' ? null : $body['from_date']) : ($row['from_date'] ?? null);
        $toDate   = array_key_exists('to_date',   $body) ? ($body['to_date']   === '' ? null : $body['to_date'])   : ($row['to_date']   ?? null);

        if ($data['is_permanent'] === 1) {
            $fromDate = null;
            $toDate   = null;
        } else {
            if (empty($fromDate) || empty($toDate)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'from_date and to_date are required for scheduled banners']);
            }
            if (strtotime($fromDate) === false || strtotime($toDate) === false) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid date format']);
            }
            if (strtotime($fromDate) > strtotime($toDate)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'from_date must be before or equal to to_date']);
            }
        }
        $data['from_date'] = $fromDate;
        $data['to_date']   = $toDate;

        // Optional toggles (used by list filters/UI if you expose them)
        if (isset($body['is_active']))  $data['is_active']  = (int) $body['is_active'];
        if (isset($body['sort_order'])) $data['sort_order'] = (int) $body['sort_order'];

        // Optional: replace image if a new file provided (not used by your current Edit UI)
        $file = $this->request->getFile('image');
        if ($file && $file->isValid() && !$file->hasMoved()) {
            $mime = $file->getMimeType();
            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid image mime type']);
            }
            $res = upload_file($file, 'banners');
            if (!empty($res['error'])) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Image upload failed', 'detail' => $res['error']]);
            }
            $newPath = $res['path'] ?? null;

            // remove old image if exists
            if (!empty($row['image_url'])) {
                remove_file($row['image_url'], 'banners');
            }
            $data['image_url'] = $newPath;
        } elseif (array_key_exists('image_url', $body)) {
            // Allow clearing by sending empty string
            $val = trim((string)$body['image_url']);
            if ($val === '') {
                if (!empty($row['image_url'])) {
                    remove_file($row['image_url'], 'banners');
                }
                $data['image_url'] = null;
            } else {
                $data['image_url'] = $val; // allow direct URL if you ever need it
            }
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $model->update($id, $data);

        $fresh = $model->find($id);
        return $this->response->setJSON($fresh);
    }

    // DELETE /api/banners/{id}
    public function delete($id = null)
    {
        $id    = (int) $id;
        $model = new BannersModel();
        $row   = $model->find($id);
        if (!$row) return $this->response->setStatusCode(404)->setJSON(['error' => 'Banner not found']);

        helper('file');
        if (!empty($row['image_url'])) {
            remove_file($row['image_url'], 'banners');
        }

        $model->delete($id);
        return $this->response->setJSON(['id' => $id, 'message' => 'Deleted']);
    }
}
