<?php

namespace App\Models;

class ProductListTranslationModel extends BaseAppModel
{
    protected $table            = 'product_list_translations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'list_id',
        'locale',
        'title',
        'description',
    ];

    protected $validationRules = [
        'list_id' => 'required|is_natural_no_zero',
        'locale'  => 'required|max_length[10]',
        'title'   => 'required|max_length[200]',
    ];

    public function byListAndLocale(int $listId, string $locale): ?array
    {
        return $this->where('list_id', $listId)->where('locale', $locale)->first();
    }

    public function allLocalesForList(int $listId): array
    {
        return $this->where('list_id', $listId)->orderBy('locale', 'ASC')->findAll();
    }
}
