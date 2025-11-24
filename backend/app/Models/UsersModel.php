<?php
// app/Models/UsersModel.php
namespace App\Models;

class UsersModel extends BaseAppModel
{
    protected $table            = 'users';
    protected $primaryKey       = 'id';
    protected $allowedFields    = ['name', 'email', 'password_hash', 'role', 'created_at', 'updated_at'];

    public function findByEmail(string $email): ?array
    {
        return $this->where('email', $email)->first();
    }

    public function createAdmin(string $name, string $email, string $password): int
    {
        $id = $this->insert([
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'role' => 'admin',
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        return (int)$id;
    }
}
