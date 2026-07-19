<?php
declare(strict_types=1);

// Reads a feature flag from the DB-backed `settings` table (T026) — no caching, since these are
// checked at most once or twice per request and a stale flag would defeat "takes effect on the
// next request without a code deploy".
function isSettingEnabled(string $key, bool $default = false): bool
{
    $row = dbFetchOne('SELECT is_enabled FROM settings WHERE config_key = :key', ['key' => $key]);
    if ($row === null) {
        return $default;
    }
    return (int) $row['is_enabled'] === 1;
}

function getSettingValue(string $key, string $default = ''): string
{
    $row = dbFetchOne('SELECT config_value FROM settings WHERE config_key = :key', ['key' => $key]);
    if ($row === null || $row['config_value'] === null) {
        return $default;
    }
    return (string) $row['config_value'];
}
