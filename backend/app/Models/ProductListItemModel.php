<?php

namespace App\Models;

class ProductListItemModel extends BaseAppModel
{
    protected $table            = 'product_list_items';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'list_translation_id',
        'text',
        'sort_order',
    ];

    protected $validationRules = [
        'list_translation_id' => 'required|is_natural_no_zero',
        'text'                => 'required|max_length[500]',
        'sort_order'          => 'permit_empty|integer',
    ];

    public function forTranslation(int $translationId)
    {
        return $this->where('list_translation_id', $translationId)->orderBy('sort_order', 'ASC');
    }
}
