<?php
// app/Models/CategoryTranslationsModel.php
namespace App\Models;

class CategoryTranslationsModel extends BaseAppModel
{
    protected $table         = 'category_translations';
    protected $primaryKey    = 'id';
    protected $allowedFields = [
        'category_id',
        'locale',
        'name',
        'description',
        'meta',
        'created_at',
        'updated_at'
    ];

    public function upsert(array $row): int
    {
        $existing = $this->where('category_id', $row['category_id'])
            ->where('locale', $row['locale'])->first();
        return $existing
            ? (int)$this->update($existing['id'], $row)
            : (int)$this->insert($row, true);
    }
}
