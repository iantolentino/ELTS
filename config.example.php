<?php
declare(strict_types=1);

/**
 * MTS configuration template.
 * Copy to config.php and fill in real values for the target environment.
 * config.php itself must never contain production credentials when committed —
 * see _brain/security/secrets_policy.md.
 */

// --- Database connection (MySQL 8.0+, accessed via PDO in db.php) ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_db_name');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// --- Feature flags ---
define('MAINTENANCE_MODE', false);

// --- Upload restrictions ---
define('ALLOWED_UPLOAD_EXTENSIONS', ['png', 'jpg', 'jpeg', 'pdf', 'xlsx']);
define('MAX_UPLOAD_SIZE_KB', 5120);

// --- Setup/migration check token ---
// /private/migration-command.php requires this as ?token=... — it is deliberately reachable over
// HTTP per README Step 3, so this token (not .htaccess) is what keeps it from being public.
// Change this to a long random value before deploying; do not reuse the local default.
define('MIGRATION_CHECK_TOKEN', 'change-me-before-deploy');

// --- Session hardening (T037) ---
// Idle timeout compared using PHP's own time() on both sides (login and every subsequent
// request) — unlike cache.php/T020's SLA math, this never crosses into a MySQL NOW() comparison,
// so the PHP/MySQL timezone drift documented in F002 doesn't apply here.
define('SESSION_IDLE_TIMEOUT_SECONDS', 1800); // 30 minutes

// --- SSO (deployment-only hook — see sso.php) ---
// Disabled by default; nothing below has any effect until a real SSO integration is wired up at
// deployment and this is flipped to true. When enabled, a requester whose SSO-verified email is on
// the allow-list (sso_allowed_emails table, empty until populated) is treated as logged in to
// "My Requests" WITHOUT registering/logging in via T047's email+password form — see sso.php's
// header comment for exactly what still needs to be implemented at deployment time (extracting the
// verified email from whatever IdP/reverse-proxy integration is chosen; no provider is assumed).
define('SSO_ENABLED', false);
// Name of the server variable (e.g. a header an SSO reverse-proxy injects, such as
// 'HTTP_X_SSO_EMAIL' behind mod_auth_openidc/mod_shib) that will hold the verified email once
// SSO_ENABLED is true. Read via sso.php's ssoAuthenticatedEmail() — not used while disabled.
define('SSO_EMAIL_SERVER_VAR', 'HTTP_X_SSO_EMAIL');

// --- Session bootstrap ---
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_samesite', 'Lax');
    // Secure flag only when actually served over HTTPS — forcing it on HTTP (e.g. local XAMPP
    // dev) would silently stop the cookie from ever being sent, breaking login entirely.
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', '1');
    }
    session_start();
}
