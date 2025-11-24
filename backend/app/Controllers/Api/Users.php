<?php
// app/Controllers/Api/Users.php
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\UsersModel;

class Users extends BaseController
{
    public function index()
    {
        $q     = $this->request->getGet('q');
        $limit = (int)($this->request->getGet('limit') ?? 50);
        $page  = max(1, (int)($this->request->getGet('page') ?? 1));
        $offset = ($page - 1) * $limit;

        $model = new UsersModel();

        if ($q) {
            $model->groupStart()
                ->like('name', $q)
                ->orLike('email', $q)
                ->groupEnd();
        }

        $total = $model->countAllResults(false);
        $rows  = $model->orderBy('id', 'DESC')->findAll($limit, $offset);
        foreach ($rows as &$r) unset($r['password_hash']);

        return $this->response->setJSON([
            'data'  => $rows,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }

    public function show($id = null)
    {
        $user = (new UsersModel())->find((int)$id);
        if (!$user) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'User not found']);
        }
        unset($user['password_hash']);
        return $this->response->setJSON($user);
    }

    public function create()
    {
        $body = $this->request->getJSON(true) ?? [];
        $name = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');
        $role = $body['role'] ?? 'editor';
        $pass = $body['password'] ?? null;

        if (!$name || !$email || !$pass) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'name, email, password are required']);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid email']);
        }
        if (!in_array($role, ['admin', 'editor'], true)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid role']);
        }

        $users = new UsersModel();
        if ($users->where('email', $email)->first()) {
            return $this->response->setStatusCode(409)->setJSON(['error' => 'Email already exists']);
        }

        $id = $users->insert([
            'name'          => $name,
            'email'         => $email,
            'role'          => $role,
            'password_hash' => password_hash($pass, PASSWORD_BCRYPT),
            'created_at'    => date('Y-m-d H:i:s'),
        ], true);

        $created = $users->find((int)$id);
        unset($created['password_hash']);
        return $this->response->setStatusCode(201)->setJSON($created);
    }

    public function update($id = null)
    {
        $id   = (int)$id;
        $body = $this->request->getJSON(true) ?? [];

        $fields = array_intersect_key($body, array_flip(['name', 'email', 'role', 'password']));
        if (empty($fields)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Nothing to update']);
        }

        $users = new UsersModel();
        $user  = $users->find($id);
        if (!$user) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'User not found']);
        }

        $data = [];
        if (isset($fields['name']))  $data['name']  = trim($fields['name']);
        if (isset($fields['email'])) {
            $email = trim($fields['email']);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid email']);
            }
            $exists = $users->where('email', $email)->where('id !=', $id)->first();
            if ($exists) {
                return $this->response->setStatusCode(409)->setJSON(['error' => 'Email already in use']);
            }
            $data['email'] = $email;
        }
        if (isset($fields['role'])) {
            if (!in_array($fields['role'], ['admin', 'editor'], true)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid role']);
            }
            $data['role'] = $fields['role'];
        }
        if (!empty($fields['password'])) {
            if (strlen($fields['password']) < 6) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Password must be at least 6 characters']);
            }
            $data['password_hash'] = password_hash($fields['password'], PASSWORD_BCRYPT);
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $users->update($id, $data);

        $fresh = $users->find($id);
        unset($fresh['password_hash']);
        return $this->response->setJSON($fresh);
    }

    public function delete($id = null)
    {
        $id = (int)$id;
        $users = new UsersModel();
        if (!$users->find($id)) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'User not found']);
        }

        $users->delete($id);
        return $this->response->setStatusCode(200)->setJSON(['id' => $id, 'message' => 'Deleted']);
    }
}
