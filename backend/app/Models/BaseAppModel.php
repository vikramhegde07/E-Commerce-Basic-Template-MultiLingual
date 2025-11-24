<?php
// app/Models/BaseAppModel.php
namespace App\Models;

use CodeIgniter\Model;

abstract class BaseAppModel extends Model
{
    protected $returnType       = 'array';
    protected $useTimestamps    = false; // columns are nullable in schema
    protected $dateFormat       = 'datetime';
    protected $allowedFields    = [];

    protected function applyLike(array $columns, ?string $q)
    {
        if (!$q) return $this;
        $this->groupStart();
        foreach ($columns as $col) $this->orLike($col, $q);
        return $this->groupEnd();
    }

    protected function safeSlug(string $text): string
    {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($text)));
        return trim($slug, '-');
    }
}
