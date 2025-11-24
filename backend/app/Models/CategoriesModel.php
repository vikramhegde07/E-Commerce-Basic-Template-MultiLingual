<?php
// app/Models/CategoriesModel.php
namespace App\Models;

class CategoriesModel extends BaseAppModel
{
    protected $table         = 'categories';
    protected $primaryKey    = 'id';
    protected $allowedFields = [
        'slug',
        'parent_id',
        'path',
        'depth',
        'sort_order',
        'image_url',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function findBySlug(string $slug): ?array
    {
        return $this->where('slug', $slug)->first();
    }
}
