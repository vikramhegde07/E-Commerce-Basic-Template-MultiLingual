<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Config\Services;

class AdminOnly implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // JwtAuth should run before this; check attached user
        $payload = $request->user ?? null;
        if (!$payload || empty($payload['role']) || $payload['role'] !== 'admin') {
            return Services::response()->setStatusCode(403)->setJSON(['error' => 'Admin role required']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // no-op
    }
}
