<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

$pdo = db();
$activeNav = 'check';
$ticket = null;
$notFound = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['requester_email'] ?? '');
    $ticketNumber = trim($_POST['ticket_number'] ?? '');
    $ticketNumber = ltrim($ticketNumber, '#');

    $stmt = $pdo->prepare(
        'SELECT t.*, d.name AS department_name FROM tickets t
         JOIN departments d ON d.id = t.department_id
         WHERE t.ticket_number = ? AND t.requester_email = ?'
    );
    $stmt->execute([$ticketNumber, $email]);
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
    $notFound = !$ticket;
}

require __DIR__ . '/partials/header.php';
?>
<div class="page-header">
  <div>
    <p class="page-title">Check ticket status</p>
    <p class="page-subtitle">Enter the email you used and your ticket number</p>
  </div>
</div>

<div class="card" style="max-width:560px;">
  <form method="post">
    <div class="form-grid">
      <div class="field"><label>Email address</label><input type="email" name="requester_email" required></div>
      <div class="field"><label>Ticket number</label><input type="text" name="ticket_number" placeholder="IT-0229" required></div>
    </div>
    <div class="btn-row"><button type="submit" class="btn btn-primary">Check status</button></div>
  </form>

  <?php if ($notFound): ?>
    <div class="flash error" style="margin-top:16px;">No ticket found with that number and email combination.</div>
  <?php elseif ($ticket): ?>
    <div style="margin-top:20px;">
      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:4px;"><?= h($ticket['subject']) ?> · <?= h($ticket['department_name']) ?></p>
      <?php if ($ticket['status'] === 'rejected'): ?>
        <div class="flash error">This ticket was rejected. Reason: <?= h($ticket['rejection_reason'] ?: 'Not specified') ?></div>
      <?php else: ?>
        <?php
          $submitted = true;
          $accepted = (bool) $ticket['accepted_at'];
          $finished = (bool) $ticket['finished_at'];
        ?>
        <div class="stepper">
          <div class="step done"><div class="step-dot">&#10003;</div><div class="step-label">Submitted<br><?= h(date('M j', strtotime((string) $ticket['submitted_at']))) ?></div></div>
          <div class="step-line"></div>
          <div class="step <?= $accepted ? 'done' : 'todo' ?>"><div class="step-dot"><?= $accepted ? '&#10003;' : '&ndash;' ?></div><div class="step-label">Accepted<br><?= $accepted ? h(date('M j', strtotime((string) $ticket['accepted_at']))) : 'Pending' ?></div></div>
          <div class="step-line"></div>
          <div class="step <?= $finished ? 'done' : ($accepted ? 'current' : 'todo') ?>"><div class="step-dot"><?= $finished ? '&#10003;' : '&bull;' ?></div><div class="step-label">Finished<br><?= $finished ? h(date('M j', strtotime((string) $ticket['finished_at']))) : ($accepted ? 'In progress' : 'Pending') ?></div></div>
        </div>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/partials/footer.php'; ?>
