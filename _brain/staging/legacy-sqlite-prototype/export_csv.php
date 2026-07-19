<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

requireLogin('super');
$pdo = db();

$from = $_GET['from'] ?? date('Y-m-01');
$to = $_GET['to'] ?? date('Y-m-d');

$stmt = $pdo->prepare(
    "SELECT t.*, d.name AS department_name FROM tickets t
     JOIN departments d ON d.id = t.department_id
     WHERE date(t.submitted_at) BETWEEN date(?) AND date(?)
     ORDER BY t.submitted_at"
);
$stmt->execute([$from, $to]);
$tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="tickets_' . $from . '_to_' . $to . '.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['Ticket ID', 'Department', 'Requester', 'Email', 'Subject', 'Description', 'Category', 'Status', 'Submitted', 'Accepted', 'Finished', 'Rejection reason']);
foreach ($tickets as $t) {
    fputcsv($out, [
        $t['ticket_number'], $t['department_name'], $t['requester_name'], $t['requester_email'],
        $t['subject'], $t['description'], $t['category'], $t['status'],
        $t['submitted_at'], $t['accepted_at'], $t['finished_at'], $t['rejection_reason'],
    ]);
}
fclose($out);
exit;
