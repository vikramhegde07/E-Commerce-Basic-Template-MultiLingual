<?php

namespace App\Controllers\Public;

use App\Controllers\BaseController;
use App\Models\BannersModel;

class Banners extends BaseController
{
    // GET /api/public/banners/active
    // Returns only banners currently active (is_active=1) AND (permanent OR within [from,to])
    public function active()
    {
        $now = date('Y-m-d H:i:s');

        $rows = (new BannersModel())
            ->where('is_active', 1)
            ->groupStart()
            ->where('is_permanent', 1)
            ->orGroupStart()
            ->where('is_permanent', 0)
            ->where('from_date <=', $now)
            ->where('to_date >=', $now)
            ->groupEnd()
            ->groupEnd()
            ->orderBy('sort_order', 'DESC')
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->response->setJSON($rows);
    }
}
