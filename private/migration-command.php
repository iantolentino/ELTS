<?php
declare(strict_types=1);

require_once __DIR__ . '/../db.php';

// Reachable over HTTP by design (README Step 3) — protected by a shared token, not .htaccess.
$suppliedToken = $_GET['token'] ?? '';
if (!hash_equals(MIGRATION_CHECK_TOKEN, (string) $suppliedToken)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Forbidden. Pass ?token=<MIGRATION_CHECK_TOKEN from config.php>.";
    exit;
}

$expectedTables = [
    'departments', 'settings', 'users', 'tickets', 'spam_trackers',
    'service_status', 'audit_logs', 'status_history', 'internal_notes',
    'knowledge_base', 'attachments', 'system_cache',
];

$results = [];
$allOk = true;
$connectionError = null;

try {
    $pdo = getDb();
} catch (PDOException $e) {
    $connectionError = $e->getMessage();
    $allOk = false;
}

if ($connectionError === null) {
    foreach ($expectedTables as $table) {
        try {
            $pdo->query("SELECT 1 FROM `$table` LIMIT 1");
            $results[$table] = true;
        } catch (PDOException) {
            $results[$table] = false;
            $allOk = false;
        }
    }
}

http_response_code($allOk ? 200 : 500);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>MTS — Migration Check</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 3rem auto; line-height: 1.5;">
<h1>MTS — Migration / Connectivity Check</h1>
<?php if ($connectionError !== null): ?>
    <p style="color:#b00020; font-weight:bold;">DATABASE CONNECTION FAILED</p>
    <p>Check <code>config.php</code> credentials (DB_HOST, DB_NAME, DB_USER, DB_PASS).</p>
    <pre style="background:#f5f5f5; padding:1rem; overflow:auto;"><?= htmlspecialchars($connectionError) ?></pre>
<?php else: ?>
    <p>Database connection: <strong style="color:#0a7d28;">OK</strong></p>
    <table style="border-collapse: collapse; width:100%;">
        <thead>
        <tr>
            <th style="text-align:left; border-bottom:1px solid #ccc; padding:.4rem;">Table</th>
            <th style="text-align:left; border-bottom:1px solid #ccc; padding:.4rem;">Status</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($results as $table => $ok): ?>
            <tr>
                <td style="padding:.4rem; border-bottom:1px solid #eee;"><?= htmlspecialchars($table) ?></td>
                <td style="padding:.4rem; border-bottom:1px solid #eee; color: <?= $ok ? '#0a7d28' : '#b00020' ?>;">
                    <?= $ok ? 'OK' : 'MISSING / UNREADABLE' ?>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <p style="margin-top:1.5rem; font-weight:bold; color: <?= $allOk ? '#0a7d28' : '#b00020' ?>;">
        <?= $allOk ? 'All tables OK — environment is ready.' : 'One or more tables are missing — re-import database.sql.' ?>
    </p>
<?php endif; ?>
</body>
</html>
