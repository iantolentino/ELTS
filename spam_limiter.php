<?php
declare(strict_types=1);

const BURST_LIMIT = 10;
const BURST_WINDOW_MINUTES = 5;
// Tiers map to escalating lockouts: 1st breach -> 30m, 2nd -> 1h, 3rd+ -> 24h (capped at tier 3).
const COOLDOWN_MINUTES_BY_TIER = [1 => 30, 2 => 60, 3 => 1440];

// Enforces the burst limit (10 submissions / 5 min) and the escalating cooldown that kicks in on
// breach. Returns null if the submission is allowed, or a user-facing message if it's blocked.
// All timing is done in SQL (NOW()/DATE_ADD/DATE_SUB), not PHP — see F002 in fixes/fix_log.md for
// why mixing PHP's clock with MySQL's comparisons is not safe on this box.
function checkSpamLimiter(string $email): ?string
{
    $tracker = dbFetchOne(
        "SELECT *,
                (next_allowed_at > NOW()) AS is_locked,
                (last_request_at > DATE_SUB(NOW(), INTERVAL " . BURST_WINDOW_MINUTES . " MINUTE)) AS in_window
         FROM spam_trackers WHERE requestor_email = :email",
        ['email' => $email]
    );

    if ($tracker === null) {
        dbInsert('spam_trackers', ['requestor_email' => $email, 'request_count_last_5m' => 1]);
        return null;
    }

    if ((int) $tracker['is_locked'] === 1) {
        return 'Too many ticket submissions from this email address. Please try again later.';
    }

    $newCount = ((int) $tracker['in_window'] === 1) ? (int) $tracker['request_count_last_5m'] + 1 : 1;

    if ($newCount > BURST_LIMIT) {
        $newTier = min(3, (int) $tracker['violation_tier'] + 1);
        $cooldownMinutes = COOLDOWN_MINUTES_BY_TIER[$newTier];
        dbQuery(
            'UPDATE spam_trackers
             SET violation_tier = :tier, next_allowed_at = DATE_ADD(NOW(), INTERVAL :mins MINUTE), request_count_last_5m = :count
             WHERE requestor_email = :email',
            ['tier' => $newTier, 'mins' => $cooldownMinutes, 'count' => $newCount, 'email' => $email]
        );
        return 'Too many ticket submissions. You can submit again in ' . $cooldownMinutes . ' minutes.';
    }

    dbUpdate('spam_trackers', ['request_count_last_5m' => $newCount], 'requestor_email = :email', ['email' => $email]);
    return null;
}
