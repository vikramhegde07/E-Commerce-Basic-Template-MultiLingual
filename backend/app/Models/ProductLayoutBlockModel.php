<?php
// app/Models/ProductLayoutBlockModel.php
namespace App\Models;

class ProductLayoutBlockModel extends BaseAppModel
{
    protected $table            = 'product_layout_blocks';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields    = [
        'layout_id',
        'block_type',
        'ref_id',
        'config_json',
        'sort_order'
    ];
    protected $useTimestamps    = true;

    protected $validationRules = [
        'layout_id'  => 'required|is_natural_no_zero',
        'block_type' => 'required|in_list[images,image_set,basic,specs_all,spec_group,table,table_group,list,custom_html,content_paragraph]'
    ];

    public function getConfigAsArray($id)
    {
        $block = $this->find($id);
        return $block && $block['config_json'] ? json_decode($block['config_json'], true) : [];
    }
}
