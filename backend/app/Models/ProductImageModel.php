<?php
// app/Models/ProductImageModel.php
namespace App\Models;

class ProductImageModel extends BaseAppModel
{
    protected $table            = 'product_images';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = ['group_id', 'url', 'alt', 'sort_order'];
    protected $useTimestamps    = false;

    protected $validationRules = [
        'group_id' => 'required|is_natural_no_zero',
        'url'      => 'required|max_length[500]'
    ];
}
