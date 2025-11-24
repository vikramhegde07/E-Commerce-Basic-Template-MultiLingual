<?php
// app/Models/ProductTableModel.php
namespace App\Models;

class ProductTableModel extends BaseAppModel
{
    protected $table            = 'product_tables';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = ['product_id', 'sort_order'];
    protected $useTimestamps    = false;

    protected $validationRules = [
        'product_id' => 'required|is_natural_no_zero'
    ];
}
