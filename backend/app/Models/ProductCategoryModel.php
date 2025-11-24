<?php
// app/Models/ProductCategoryModel.php
namespace App\Models;

class ProductCategoryModel extends BaseAppModel
{
    protected $table            = 'product_categories';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = ['product_id', 'category_id', 'sort_order'];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'product_id'  => 'required|is_natural_no_zero',
        'category_id' => 'required|is_natural_no_zero'
    ];
}
