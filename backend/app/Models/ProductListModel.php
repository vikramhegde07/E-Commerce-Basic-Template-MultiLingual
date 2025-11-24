<?php

namespace App\Models;

class ProductListModel extends BaseAppModel
{
    protected $table            = 'product_lists';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'product_id',
        'slug',
        'sort_order',
    ];

    // Validation (composite unique is enforced in DB; here we just basic-validate)
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
        return $this->select('product_lists.*, plt.id AS translation_id, plt.locale, plt.title, plt.description')
            ->join('product_list_translations plt', "plt.list_id = product_lists.id AND plt.locale = " . $this->db->escape($locale), 'left');
    }
}
