<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\InquiriesModel;

class Inquiries extends BaseController
{
    // GET /api/inquiries?q=&sortBy=&order=&page=&perPage=
    public function index()
    {
        $q       = trim($this->request->getGet('q') ?? '');
        $sortBy  = $this->request->getGet('sortBy') ?? 'created_at';
        $order   = strtoupper($this->request->getGet('order') ?? 'DESC');
        $page    = max(1, (int)($this->request->getGet('page') ?? 1));
        $perPage = (int)($this->request->getGet('perPage') ?? 20);
        $perPage = max(1, min(100, $perPage));
        $offset  = ($page - 1) * $perPage;

        $allowedSorts = ['id', 'name', 'email', 'phone', 'subject', 'created_at'];
        if (!in_array($sortBy, $allowedSorts, true)) $sortBy = 'created_at';
        if (!in_array($order, ['ASC', 'DESC'], true)) $order = 'DESC';

        $model = new InquiriesModel();

        if ($q !== '') {
            $model->groupStart()
                ->like('name', $q)
                ->orLike('email', $q)
                ->orLike('phone', $q)
                ->orLike('subject', $q)
                ->orLike('message', $q)
                ->groupEnd();
        }

        $total = $model->countAllResults(false);
        $rows  = $model->orderBy($sortBy, $order)->findAll($perPage, $offset);

        return $this->response->setJSON([
            'data'  => $rows,
            'meta'  => [
                'total'   => $total,
                'page'    => $page,
                'perPage' => $perPage,
                'sortBy'  => $sortBy,
                'order'   => $order,
                'q'       => $q,
            ],
        ]);
    }

    // GET /api/inquiries/{id}
    public function show($id = null)
    {
        $id = (int)$id;
        if ($id <= 0) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid id']);
        }

        $row = (new InquiriesModel())->find($id);
        if (!$row) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Inquiry not found']);
        }

        return $this->response->setJSON($row);
    }

    // DELETE /api/inquiries/{id}  (adminOnly filter on route)
    public function delete($id = null)
    {
        $id = (int)$id;
        $model = new InquiriesModel();

        if (!$model->find($id)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Inquiry not found']);
        }

        $model->delete($id);
        return $this->response->setJSON(['id' => $id, 'message' => 'Deleted']);
    }
}
