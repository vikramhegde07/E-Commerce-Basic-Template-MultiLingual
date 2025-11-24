<?php
// app/Models/ProductContentParagraphTranslationModel.php
namespace App\Models;

class ProductContentParagraphTranslationModel extends BaseAppModel
{
    protected $table            = 'product_content_paragraph_translations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'paragraph_id',
        'locale',
        'title',
        'subtitle',
        'full_text'
    ];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'paragraph_id' => 'required|is_natural_no_zero',
        'locale'       => 'required|max_length[10]',
        'full_text'    => 'required'
    ];
}
