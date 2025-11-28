<?php

namespace App\Models;

use CodeIgniter\Model;

class BannersModel extends Model
{
    protected $table         = 'banners';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useSoftDeletes = false;

    protected $allowedFields = [
        'image_url',
        'is_permanent',
        'from_date',
        'to_date',
        'is_active',
        'sort_order',
        'created_at',
        'updated_at',
    ];

    protected $useTimestamps = false; // we set timestamps manually in controller
}
