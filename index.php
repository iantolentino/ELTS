<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/audit.php';
require_once __DIR__ . '/csrf.php';
require_once __DIR__ . '/comments.php';
require_once __DIR__ . '/cache.php';
require_once __DIR__ . '/spam_limiter.php';
require_once __DIR__ . '/settings_helper.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/sso.php';
require_once __DIR__ . '/requester_auth.php';
require_once __DIR__ . '/views/layout.php';
require_once __DIR__ . '/controllers/public_controller.php';
require_once __DIR__ . '/controllers/admin_controller.php';
require_once __DIR__ . '/controllers/department_controller.php';
require_once __DIR__ . '/controllers/requester_controller.php';
require_once __DIR__ . '/analytics.php';

// Directory index.php lives in, as seen by the URL — works whether deployed at the domain
// root (production) or a subfolder (e.g. XAMPP's /ticketing-app).
define('BASE_URL', rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/'));

function url(string $path = ''): string
{
    return BASE_URL . '/' . ltrim($path, '/');
}

// Handled before routing so "Exit View As" works identically from any page it's clicked on.
if (isset($_GET['exit_view_as'])) {
    exitViewAs();
    header('Location: ' . url('admin/'));
    exit;
}

// Theme toggle (T043) — flips a persistent cookie and redirects back to the same page with the
// toggle param stripped, rather than trusting the (unreliable, referrer-policy-dependent)
// Referer header. Default is always light for a first-time visitor with no cookie yet.
if (isset($_GET['toggle_theme'])) {
    $nextTheme = (($_COOKIE['mts_theme'] ?? 'light') === 'dark') ? 'light' : 'dark';
    setcookie('mts_theme', $nextTheme, [
        'expires' => time() + 60 * 60 * 24 * 365,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    $redirectPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    parse_str((string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_QUERY) ?? ''), $query);
    unset($query['toggle_theme']);
    header('Location: ' . $redirectPath . ($query !== [] ? '?' . http_build_query($query) : ''));
    exit;
}

// Single app-wide CSRF gate (T035) — every POST, on every route, is checked here before any
// handler runs. A handler-by-handler sweep risks missing one; this can't be forgotten per-route.
enforceCsrfOnPost();

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
if (BASE_URL !== '' && str_starts_with($requestPath, BASE_URL)) {
    $requestPath = substr($requestPath, strlen(BASE_URL));
}
$requestPath = trim($requestPath, '/');
$segments = $requestPath === '' ? [] : explode('/', $requestPath);

if (count($segments) === 0) {
    handlePublicHome();
} elseif ($segments[0] === 'admin') {
    handleAdminRoute(array_slice($segments, 1));
} elseif ($segments[0] === 'account') {
    handleRequesterAccountRoute(array_slice($segments, 1));
} else {
    handleDepartmentRoute($segments[0], array_slice($segments, 1));
}
