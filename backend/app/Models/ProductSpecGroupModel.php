<?php

namespace App\Models;

class ProductSpecGroupModel extends BaseAppModel
{
    protected $table            = 'product_spec_groups';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'product_id',
        'slug',
        'sort_order',
    ];

    protected $validationRules = [
        'product_id' => 'required|is_natural_no_zero',
        'slug'       => 'required|max_length[220]',
        'sort_order' => 'permit_empty|integer',
    ];

    public function byProduct(int $productId)
    {
        return $this->where('product_id', $productId)->orderBy('sort_order', 'ASC');
    }

    public function findByProductAndSlug(int $productId, string $slug): ?array
    {
        return $this->where('product_id', $productId)->where('slug', $slug)->first();
    }

    public function withTranslation(string $locale)
    {
        return $this->select('product_spec_groups.*, psgt.id AS translation_id, psgt.locale, psgt.title, psgt.description')
            ->join('product_spec_group_translations psgt', "psgt.group_id = product_spec_groups.id AND psgt.locale = " . $this->db->escape($locale), 'left');
    }
}
