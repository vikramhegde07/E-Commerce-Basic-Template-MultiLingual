<?php
// app/Models/ProductImageGroupModel.php
namespace App\Models;

class ProductImageGroupModel extends BaseAppModel
{
    protected $table            = 'product_image_groups';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = ['product_id', 'name', 'sort_order'];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'product_id' => 'required|is_natural_no_zero',
        'name'       => 'required|max_length[200]'
    ];
}
