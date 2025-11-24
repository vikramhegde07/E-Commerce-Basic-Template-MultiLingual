<?php

/**
 * Upload a file (single) safely and return relative URL (or false)
 * Usage: upload_file($_FILES['image'], 'products')
 *
 * @param array $fileArray  the $_FILES['...'] array or CI UploadedFile
 * @param string $subdir    subdirectory under writable/uploads or public/uploads
 * @param array $options    ['max_size'=> (int bytes), 'allowed'=>['image/jpeg',...]]
 * @return array|false ['path'=>'/uploads/..','filename'=>'..','error'=>null]
 */
function upload_file($fileArray, string $subdir = 'products', array $options = [])
{
    // prefer CodeIgniter UploadedFile when used from controllers:
    if (is_object($fileArray) && method_exists($fileArray, 'isValid')) {
        $file = $fileArray;
        if (!$file->isValid()) {
            return ['error' => $file->getErrorString()];
        }
        $ext = $file->getExtension();
        $filename = uniqid('f_') . '.' . $ext;
        $uploadPath = FCPATH . "uploads/{$subdir}/";
        if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
        $moved = $file->move($uploadPath, $filename);
        if ($moved) {
            return ['path' => "/uploads/{$subdir}/{$filename}", 'filename' => $filename];
        }
        return ['error' => 'move_failed'];
    }

    // fallback for raw $_FILES
    if (!isset($fileArray['tmp_name']) || !is_uploaded_file($fileArray['tmp_name'])) {
        return ['error' => 'no_file'];
    }

    $allowed = $options['allowed'] ?? ['image/jpeg', 'image/png', 'image/webp'];
    $max = $options['max_size'] ?? 5 * 1024 * 1024; // 5MB

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $fileArray['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowed)) {
        return ['error' => 'invalid_mime'];
    }
    if ($fileArray['size'] > $max) {
        return ['error' => 'file_too_large'];
    }

    $ext = pathinfo($fileArray['name'], PATHINFO_EXTENSION);
    $filename = uniqid('f_') . '.' . $ext;
    $uploadPath = FCPATH . "uploads/{$subdir}/";
    if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
    $dest = $uploadPath . $filename;
    if (!move_uploaded_file($fileArray['tmp_name'], $dest)) {
        return ['error' => 'move_failed'];
    }
    return ['path' => "/writable/uploads/{$subdir}/{$filename}", 'filename' => $filename];
}

/**
 * Remove a file by relative path or filename under WRITE uploads
 * @param string $relativePath  e.g. '/writable/uploads/products/f_123.jpg' or 'f_123.jpg' with subdir
 * @param string $subdir
 * @return bool
 */
function remove_file(string $relativePath, string $subdir = 'products'): bool
{
    // sanitize path: only allow removal from FCPATH/uploads
    $base = realpath(FCPATH . "uploads/{$subdir}/");
    if (!$base) return false;
    $candidate = $relativePath;
    // if only filename provided, join
    if (basename($relativePath) === $relativePath) {
        $candidate = $base . DIRECTORY_SEPARATOR . $relativePath;
    } else {
        // if passed a path starting with /writable or similar, map to realpath
        $candidate = realpath(FCPATH . ltrim(str_replace('/writable/', '', $relativePath), '/'));
    }
    if (!$candidate) return false;
    // ensure candidate is inside base
    if (strpos($candidate, $base) !== 0) return false;
    if (file_exists($candidate)) {
        return unlink($candidate);
    }
    return false;
}