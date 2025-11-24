<?php
// app/Models/ProductModel.php
namespace App\Models;

class ProductModel extends BaseAppModel
{
    protected $table            = 'products';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = true;
    protected $allowedFields    = [
        'slug',
        'code',
        'type',
        'status',
        'published_at',
        'deleted_at'
    ];
    protected $useTimestamps    = true;
    protected $createdField     = 'created_at';
    protected $updatedField     = 'updated_at';
    protected $deletedField     = 'deleted_at';

    // Validation
    protected $validationRules = [
        'slug' => 'required|max_length[220]|is_unique[products.slug,id,{id}]',
        'code' => 'permit_empty|max_length[100]|is_unique[products.code,id,{id}]',
        'type' => 'required|in_list[product,material,service]',
        'status' => 'required|in_list[draft,published,archived]'
    ];

    public function withTranslations($locale = 'en')
    {
        return $this->select('products.*, pt.name, pt.description, pt.meta')
            ->join('product_translations pt', "products.id = pt.product_id AND pt.locale = '$locale'", 'left');
    }

    public function withCategories()
    {
        return $this->select('products.*, GROUP_CONCAT(pc.category_id) as category_ids')
            ->join('product_categories pc', 'products.id = pc.product_id', 'left')
            ->groupBy('products.id');
    }
}
