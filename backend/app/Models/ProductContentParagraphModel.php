<?php
// app/Models/ProductContentParagraphModel.php
namespace App\Models;

class ProductContentParagraphModel extends BaseAppModel
{
    protected $table            = 'product_content_paragraphs';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = ['product_id', 'sort_order'];
    protected $useTimestamps    = false;

    protected $validationRules = [
        'product_id' => 'required|is_natural_no_zero'
    ];
}
