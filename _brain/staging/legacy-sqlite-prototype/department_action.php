<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

$user = requireLogin('super');
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $code = strtoupper(trim($_POST['code'] ?? ''));

    if ($name !== '' && $code !== '') {
        $stmt = $pdo->prepare('INSERT INTO departments (name, code, next_number) VALUES (?, ?, 1)');
        $stmt->execute([$name, $code]);
        header('Location: dashboard.php?msg=' . urlencode("Department \"$name\" added.") . '&type=success');
        exit;
    }
}

header('Location: dashboard.php?msg=' . urlencode('Department name and code are required.') . '&type=error');
exit;
