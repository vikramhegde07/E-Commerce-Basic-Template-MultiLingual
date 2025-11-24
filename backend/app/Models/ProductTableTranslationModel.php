<?php
// app/Models/ProductTableTranslationModel.php
namespace App\Models;

class ProductTableTranslationModel extends BaseAppModel
{
    protected $table            = 'product_table_translations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'table_id',
        'locale',
        'title',
        'columns_json',
        'rows_json',
        'notes'
    ];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'table_id' => 'required|is_natural_no_zero',
        'locale'   => 'required|max_length[10]',
        'title'    => 'required|max_length[200]'
    ];
}
