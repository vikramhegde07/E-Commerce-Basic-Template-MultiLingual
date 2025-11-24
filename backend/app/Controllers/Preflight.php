<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use Config\Services;

class Preflight extends Controller
{
    public function handle($any = null)
    {
        // You can read config if you want dynamic origins, but simplest:
        $response = Services::response();

        // You can set the allowed origin dynamically from Cors config if needed
        // For dev: echo back the Origin header (safer than '*') 
        $origin = $this->request->getHeaderLine('Origin') ?: '*';

        $response = $response->setStatusCode(204)
            ->setHeader('Access-Control-Allow-Origin', $origin)
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Accept, Authorization, Origin')
            ->setHeader('Access-Control-Max-Age', '7200');

        return $response;
    }
}