<?php
declare(strict_types=1);

// Per-session CSRF token (T035). Generated once on first use and reused for every form rendered
// during the session — including the login form itself, since the session (and therefore this
// token) exists before authentication.
function csrfToken(): string
{
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfField(): string
{
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrfToken()) . '">';
}

// hash_equals() for constant-time comparison, not ===  — a naive string comparison leaks timing
// information an attacker could use to guess the token byte-by-byte.
function verifyCsrfToken(): bool
{
    $submitted = (string) ($_POST['csrf_token'] ?? '');
    return $submitted !== '' && hash_equals(csrfToken(), $submitted);
}

// Single enforcement point for every state-changing POST, called once in index.php before any
// routing/dispatch — so no individual form handler can be added later and forget this check.
// A missing/mismatched token is rejected (403), never silently ignored or passed through.
function enforceCsrfOnPost(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        return;
    }
    if (!verifyCsrfToken()) {
        send403();
        exit;
    }
}
