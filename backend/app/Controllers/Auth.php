<?php
// app/Controllers/Auth.php
namespace App\Controllers;

use App\Models\UsersModel;

class Auth extends BaseController
{
    public function login()
    {
        $body = $this->request->getJSON(true) ?? [];
        $email = $body['email'] ?? $this->request->getPost('email');
        $password = $body['password'] ?? $this->request->getPost('password');

        if (!$email || !$password) {
            return $this->response->setStatusCode(422)->setJSON(['error' => 'Email and password are required']);
        }

        $users = new UsersModel();
        $user  = $users->findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->response->setStatusCode(401)->setJSON(['error' => 'Invalid credentials']);
        }

        helper('jwt');
        $ttl   = (int)(getenv('JWT_TTL') ?: 21600);
        $token = jwt_issue([
            'id'    => $user['id'],
            'email' => $user['email'],
            'role'  => $user['role'],
        ], $ttl);

        return $this->response->setJSON([
            'token'      => $token,
            'expires_in' => $ttl,
            'user'       => [
                'id'    => (int)$user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
        ]);
    }
}
