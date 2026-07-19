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

// --- Session bootstrap ---
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_strict_mode', '1');
    session_start();
}
