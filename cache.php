<?php
declare(strict_types=1);

// Read-through cache backed by the system_cache table (60s TTL is the caller's convention, not
// enforced here — pass whatever TTL the call site needs). $compute runs only on a cache miss or
// expiry; its result is JSON-encoded and stored with an absolute expires_at.
//
// Expiry is computed via MySQL's own NOW()/DATE_ADD, not PHP's date() — PHP's default timezone
// and the MySQL server's timezone are two independent, uncoordinated settings (this box has them
// several hours apart), so comparing a PHP-computed timestamp against MySQL's NOW() silently
// broke every cache hit. Keeping both the write and the read on the DB's own clock avoids that
// entirely, regardless of how either side's timezone is configured.
function cacheRemember(string $key, int $ttlSeconds, callable $compute): mixed
{
    $row = dbFetchOne(
        'SELECT cache_value FROM system_cache WHERE cache_key = :key AND expires_at > NOW()',
        ['key' => $key]
    );
    if ($row !== null) {
        return json_decode((string) $row['cache_value'], true);
    }

    $value = $compute();

    dbQuery(
        'INSERT INTO system_cache (cache_key, cache_value, expires_at)
         VALUES (:key, :value, DATE_ADD(NOW(), INTERVAL :ttl SECOND))
         ON DUPLICATE KEY UPDATE cache_value = VALUES(cache_value), expires_at = VALUES(expires_at)',
        ['key' => $key, 'value' => json_encode($value), 'ttl' => $ttlSeconds]
    );

    return $value;
}

// Explicit invalidation — not used by any TTL-only caller yet, available for a future active-
// invalidation need (see decisions/decision_log.md S003 in governance/scope.md's deferred list).
function cacheForget(string $key): void
{
    dbDelete('system_cache', 'cache_key = :key', ['key' => $key]);
}
