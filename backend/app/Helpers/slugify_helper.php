<?php

use Config\Database;

/**
 * Generate a URL-friendly slug (English-friendly) and ensure uniqueness
 * by checking the given table + field. If collision occurs it appends -2, -3...
 *
 * @param string $name   The source name (any language). We will transliterate & slugify to ASCII-ish.
 * @param string $table  DB table to check for collisions (e.g. 'categories' or 'products').
 * @param string $field  DB field/column name to check (default 'slug').
 * @param int    $maxLen Maximum length of slug (default 200).
 * @return string        Unique slug
 *
 * Usage:
 *   helper('slugify');
 *   $slug = generate_unique_slug('My Category Name', 'categories');
 */
if (! function_exists('generate_unique_slug')) {
    function generate_unique_slug(string $name, string $table = 'categories', string $field = 'slug', int $maxLen = 200): string
    {
        // make sure we have a DB connection
        $db = Database::connect();

        // 1) Normalize / transliterate to ASCII where possible
        // Attempt iconv transliteration. If iconv not available, keep original.
        $s = (string) $name;
        // Collapse whitespace, trim
        $s = trim(preg_replace('/\s+/', ' ', $s));

        // transliterate to ASCII (if available)
        if (function_exists('iconv')) {
            // Convert UTF-8 to ASCII approximations
            $tmp = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
            if ($tmp !== false) {
                $s = $tmp;
            }
        }

        // 2) Lowercase and remove unwanted characters
        $s = mb_strtolower($s, 'UTF-8');

        // Replace non-alphanumeric characters with hyphen
        // Keep letters & numbers; remove other punctuation
        $s = preg_replace('/[^a-z0-9]+/i', '-', $s);

        // Trim hyphens from ends
        $s = trim($s, '-');

        // Collapse multiple hyphens
        $s = preg_replace('/-+/', '-', $s);

        // Fallback if empty after cleanup
        if ($s === '') {
            $s = 'item';
        }

        // Truncate to maxLen (preserve possibility for suffix)
        if ($maxLen > 8 && strlen($s) > $maxLen) {
            $s = substr($s, 0, $maxLen);
            $s = rtrim($s, '-');
        }

        // 3) Ensure uniqueness by checking DB and appending suffixes
        $base = $s;
        $candidate = $base;
        $i = 2;

        // Use query builder for safe queries
        $builder = $db->table($table);

        // Prepare a function to check existence
        $exists = function (string $slugCandidate) use ($builder, $field): bool {
            $row = $builder->where($field, $slugCandidate)->get(1)->getRowArray();
            return !empty($row);
        };

        // If base exists, loop and append a numeric suffix
        while ($exists($candidate)) {
            // compute suffix (e.g. base-2, base-3)
            $suffix = '-' . $i;
            // ensure truncated length for candidate including suffix <= maxLen
            $avail = $maxLen - strlen($suffix);
            $truncatedBase = (strlen($base) > $avail) ? substr($base, 0, $avail) : $base;
            $truncatedBase = rtrim($truncatedBase, '-'); // avoid ending dash before suffix
            $candidate = $truncatedBase . $suffix;
            $i++;

            // safety: break if insanely many iterations (unlikely)
            if ($i > 10000) {
                // extremely unlikely, but give a fallback unique id
                $candidate = $truncatedBase . '-' . bin2hex(random_bytes(4));
                break;
            }
        }

        return $candidate;
    }
}
