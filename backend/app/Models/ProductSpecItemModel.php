<?php

namespace App\Models;

class ProductSpecItemModel extends BaseAppModel
{
    protected $table            = 'product_spec_items';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'spec_group_translation_id',
        'spec_key',
        'spec_value',
        'unit',
        'sort_order',
    ];

    protected $validationRules = [
        'spec_group_translation_id' => 'required|is_natural_no_zero',
        'spec_key'                  => 'required|max_length[200]',
        'spec_value'                => 'required',
        'unit'                      => 'permit_empty|max_length[50]',
        'sort_order'                => 'permit_empty|integer',
    ];

    public function forTranslation(int $translationId)
    {
        return $this->where('spec_group_translation_id', $translationId)->orderBy('sort_order', 'ASC');
    }
}
