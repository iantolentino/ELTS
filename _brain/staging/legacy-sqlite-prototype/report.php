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

$counts = ['pending' => 0, 'ongoing' => 0, 'done' => 0, 'rejected' => 0];
foreach ($tickets as $t) {
    $counts[$t['status']] = ($counts[$t['status']] ?? 0) + 1;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ticket report <?= h($from) ?> to <?= h($to) ?></title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<style>
  body{ padding:32px; max-width:900px; margin:0 auto; }
  h1{ font-size:19px; margin:0 0 4px; }
  .sub{ color:var(--text-secondary); font-size:13px; margin:0 0 20px; }
  table{ font-size:12px; }
  .no-print{ margin-bottom:20px; }
</style>
</head>
<body>
  <div class="no-print"><button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button></div>
  <h1>Ticket summary report</h1>
  <p class="sub"><?= h($from) ?> to <?= h($to) ?> &middot; <?= count($tickets) ?> tickets &middot;
    Pending: <?= $counts['pending'] ?>, Ongoing: <?= $counts['ongoing'] ?>, Done: <?= $counts['done'] ?>, Rejected: <?= $counts['rejected'] ?></p>

  <table>
    <thead><tr><th>Ticket ID</th><th>Dept</th><th>Requester</th><th>Subject</th><th>Category</th><th>Status</th><th>Submitted</th><th>Finished</th></tr></thead>
    <tbody>
      <?php foreach ($tickets as $t): ?>
        <tr>
          <td><?= h($t['ticket_number']) ?></td>
          <td><?= h($t['department_name']) ?></td>
          <td><?= h($t['requester_name']) ?></td>
          <td><?= h($t['subject']) ?></td>
          <td><?= h($t['category']) ?></td>
          <td><?= ucfirst($t['status']) ?></td>
          <td><?= h(date('M j, Y', strtotime((string) $t['submitted_at']))) ?></td>
          <td><?= $t['finished_at'] ? h(date('M j, Y', strtotime((string) $t['finished_at']))) : '—' ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</body>
</html>
