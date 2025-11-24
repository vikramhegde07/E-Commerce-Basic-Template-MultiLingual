<?php

namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Config\Services;

class JwtAuth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Allow preflight
        if ($request->getMethod(true) === 'OPTIONS') {
            return;
        }

        $header = $request->getHeaderLine('Authorization');
        if (!$header || !preg_match('/Bearer\s(\S+)/', $header, $m)) {
            return Services::response()
                ->setStatusCode(401)
                ->setJSON(['error' => 'Missing or malformed Authorization header']);
        }

        $token = $m[1];
        try {
            helper('jwt');
            $payload = jwt_decode_token($token);
            // attach user info to the request for controllers (simple)
            // Note: CI Request objects are immutable-ish; but you can store on global service
            $request->user = $payload; // controllers can read $this->request->user
            return;
        } catch (\Exception $e) {
            return Services::response()->setStatusCode(401)->setJSON(['error' => 'Invalid token', 'msg' => $e->getMessage()]);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // no-op
    }
}