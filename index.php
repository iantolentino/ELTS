<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache.php';
require_once __DIR__ . '/spam_limiter.php';
require_once __DIR__ . '/settings_helper.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/views/layout.php';
require_once __DIR__ . '/controllers/public_controller.php';
require_once __DIR__ . '/controllers/admin_controller.php';
require_once __DIR__ . '/controllers/department_controller.php';

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
} else {
    handleDepartmentRoute($segments[0], array_slice($segments, 1));
}
