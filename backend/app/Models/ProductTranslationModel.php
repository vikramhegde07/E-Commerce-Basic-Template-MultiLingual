<?php
// app/Models/ProductTranslationModel.php
namespace App\Models;

class ProductTranslationModel extends BaseAppModel
{
    protected $table            = 'product_translations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'product_id',
        'locale',
        'name',
        'description',
        'meta'
    ];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'product_id' => 'required|is_natural_no_zero',
        'locale'     => 'required|max_length[10]',
        'name'       => 'required|max_length[200]'
    ];
}
