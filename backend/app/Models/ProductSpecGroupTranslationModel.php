<?php

namespace App\Models;

class ProductSpecGroupTranslationModel extends BaseAppModel
{
    protected $table            = 'product_spec_group_translations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'group_id',
        'locale',
        'title',
        'description',
    ];

    protected $validationRules = [
        'group_id'    => 'required|is_natural_no_zero',
        'locale'      => 'required|max_length[10]',
        'title'       => 'required|max_length[200]',
    ];

    public function byGroupAndLocale(int $groupId, string $locale): ?array
    {
        return $this->where('group_id', $groupId)->where('locale', $locale)->first();
    }

    public function allLocalesForGroup(int $groupId): array
    {
        return $this->where('group_id', $groupId)->orderBy('locale', 'ASC')->findAll();
    }
}
