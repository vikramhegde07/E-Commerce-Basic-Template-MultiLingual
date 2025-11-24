<?php
// app/Models/ProductLayoutModel.php
namespace App\Models;

class ProductLayoutModel extends BaseAppModel
{
    protected $table            = 'product_layouts';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = ['product_id', 'name', 'is_default'];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'product_id' => 'required|is_natural_no_zero',
        'name'       => 'required|max_length[120]'
    ];
}
