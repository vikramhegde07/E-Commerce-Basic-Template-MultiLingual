<?php
// app/Helpers/jwt_helper.php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Issue a JWT for a user
 * @param array $user Minimal user payload: ['id' => ..., 'email' => ..., 'role' => ...]
 * @param int $ttl seconds (default 6 hours)
 * @return string token
 */
function jwt_issue(array $user, int $ttl = 21600): string
{
    $secret = getenv('JWT_SECRET') ?: 'change_this_secret';
    $now = time();
    $payload = [
        'iat' => $now,
        'exp' => $now + $ttl,
        'sub' => $user['id'],
        'email' => $user['email'] ?? null,
        'role' => $user['role'] ?? null,
    ];
    return JWT::encode($payload, $secret, 'HS256');
}

/**
 * Verify a token and return decoded payload as array or throw exception
 * @param string $token
 * @return array
 * @throws Exception
 */
function jwt_decode_token(string $token): array
{
    $secret = getenv('JWT_SECRET') ?: 'change_this_secret';
    $decoded = JWT::decode($token, new Key($secret, 'HS256'));
    return (array) $decoded;
}
