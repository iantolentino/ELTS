<?php
declare(strict_types=1);

// Requester self-service session (T047) — deliberately a separate session namespace
// ($_SESSION['requester_*']) from the agent/superadmin session in auth.php ($_SESSION['user_*']),
// so nothing here can collide with or accidentally grant department/admin access, and the same
// browser could in principle hold both (unlikely, but the isolation costs nothing).

function requesterCurrentUser(): ?array
{
    // SSO hook (sso.php) checked first — inert while SSO_ENABLED is false (today's default), so
    // this adds zero behavior change until deployment wires up a real IdP. Once enabled, an
    // allow-listed SSO-verified email is a valid identity on every request with no session state
    // of its own, same as an anonymous ticket lookup — it doesn't need or use $_SESSION here.
    $ssoIdentity = ssoRequesterIdentity();
    if ($ssoIdentity !== null) {
        return $ssoIdentity;
    }

    if (!isset($_SESSION['requester_id'])) {
        return null;
    }
    return [
        'id' => $_SESSION['requester_id'],
        'email' => $_SESSION['requester_email'],
    ];
}

function requesterLogin(array $account): void
{
    session_regenerate_id(true);
    $_SESSION['requester_id'] = (int) $account['id'];
    $_SESSION['requester_email'] = (string) $account['email'];
}

function requesterLogout(): void
{
    unset($_SESSION['requester_id'], $_SESSION['requester_email']);
}

// A requester never provides a display name (T047's account is deliberately email+password
// only), so wherever one is needed — most concretely a comment's `author_name`, currently the raw
// email — this derives something more human from the address's local-part: dots/underscores/plus-
// tags stripped, words capitalized. "jane.doe+support@example.com" -> "Jane Doe". Falls back to
// the email itself if the local-part turns out to be empty or non-alphabetic (e.g. a numeric or
// symbol-only address) rather than showing a blank name.
function deriveNameFromEmail(string $email): string
{
    $localPart = explode('@', $email, 2)[0] ?? '';
    $localPart = explode('+', $localPart, 2)[0]; // strip a "+tag" suffix before it gets title-cased into one
    $words = array_filter(preg_split('/[.\-_]+/', $localPart) ?: []);
    if ($words === []) {
        return $email;
    }
    return implode(' ', array_map(static fn(string $w): string => mb_convert_case($w, MB_CASE_TITLE), $words));
}
