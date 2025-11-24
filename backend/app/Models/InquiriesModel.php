<?php
// app/Models/InquiriesModel.php
namespace App\Models;

class InquiriesModel extends BaseAppModel
{
    protected $table         = 'inquiries';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['name', 'email', 'phone', 'subject', 'message', 'created_at'];

    public function createInquiry(array $payload): int
    {
        $payload['created_at'] = $payload['created_at'] ?? date('Y-m-d H:i:s');
        return (int)$this->insert($payload, true);
    }

    public function recent(int $limit = 20): array
    {
        return $this->orderBy('created_at', 'DESC')->findAll($limit);
    }
}
