<?php
// app/Controllers/Api/Me.php
namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\UsersModel;

class Me extends BaseController
{
    private function authUser(): ?array
    {
        return $this->request->user ?? null; // set by JwtAuth filter
    }

    public function show()
    {
        $payload = $this->authUser();
        if (!$payload) {
            return $this->response->setStatusCode(401)->setJSON(['error' => 'Unauthorized']);
        }

        $user = (new UsersModel())->find((int)$payload['sub']);
        if (!$user) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'User not found']);
        }

        unset($user['password_hash']);
        return $this->response->setJSON($user);
    }

    public function update()
    {
        $payload = $this->authUser();
        if (!$payload) {
            return $this->response->setStatusCode(401)->setJSON(['error' => 'Unauthorized']);
        }

        $id   = (int)$payload['sub'];
        $body = $this->request->getJSON(true) ?? [];
        $data = array_intersect_key($body, array_flip(['name', 'email']));

        if (empty($data)) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Nothing to update']);
        }

        if (!empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                return $this->response->setStatusCode(422)->setJSON(['error' => 'Invalid email']);
            }
            $exists = (new UsersModel())
                ->where('email', $data['email'])
                ->where('id !=', $id)
                ->first();
            if ($exists) {
                return $this->response->setStatusCode(409)->setJSON(['error' => 'Email already in use']);
            }
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        (new UsersModel())->update($id, $data);

        $user = (new UsersModel())->find($id);
        unset($user['password_hash']);
        return $this->response->setJSON($user);
    }

    public function changePassword()
    {
        $payload = $this->authUser();
        if (!$payload) {
            return $this->response->setStatusCode(401)->setJSON(['error' => 'Unauthorized']);
        }

        $id   = (int)$payload['sub'];
        $body = $this->request->getJSON(true) ?? [];

        $current = $body['current_password'] ?? null;
        $new     = $body['new_password'] ?? null;

        if (!$current || !$new) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'current_password and new_password are required']);
        }
        if (strlen($new) < 6) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'New password must be at least 6 characters']);
        }

        $users = new UsersModel();
        $user  = $users->find($id);
        if (!$user || !password_verify($current, $user['password_hash'])) {
            return $this->response->setStatusCode(401)->setJSON(['error' => 'Current password is incorrect']);
        }

        $users->update($id, [
            'password_hash' => password_hash($new, PASSWORD_BCRYPT),
            'updated_at'    => date('Y-m-d H:i:s'),
        ]);

        return $this->response->setJSON(['message' => 'Password updated']);
    }
}
