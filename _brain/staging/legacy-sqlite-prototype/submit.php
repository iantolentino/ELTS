<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

$pdo = db();
$activeNav = 'submit';
$confirmation = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['requester_name'] ?? '');
    $email = trim($_POST['requester_email'] ?? '');
    $departmentId = (int) ($_POST['department_id'] ?? 0);
    $category = trim($_POST['category'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if ($name === '' || $email === '' || $departmentId === 0 || $subject === '' || $description === '') {
        $error = 'Please fill in all required fields.';
    } else {
        $ticketNumber = nextTicketNumber($pdo, $departmentId);
        $stmt = $pdo->prepare(
            'INSERT INTO tickets (ticket_number, department_id, requester_name, requester_email, subject,
                description, category, status, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $ticketNumber, $departmentId, $name, $email, $subject, $description, $category,
            'pending', date('Y-m-d H:i:s'),
        ]);

        notifyEmail($email, "Ticket received: $ticketNumber", "Hi $name, your ticket \"$subject\" was received. Track it anytime with ticket number $ticketNumber.");

        $confirmation = $ticketNumber;
    }
}

$departments = $pdo->query('SELECT id, name FROM departments ORDER BY name')->fetchAll(PDO::FETCH_ASSOC);

require __DIR__ . '/partials/header.php';
?>
<div class="page-header">
  <div>
    <p class="page-title">Submit a ticket</p>
    <p class="page-subtitle">No account needed — just an email to send you updates</p>
  </div>
</div>

<div class="card" style="max-width:640px;">
  <?php if ($error): ?><div class="flash error"><?= h($error) ?></div><?php endif; ?>

  <?php if ($confirmation): ?>
    <div class="flash success">
      Ticket submitted — <strong><?= h($confirmation) ?></strong>. A confirmation email was logged for the address you entered.
      <div style="margin-top:6px;"><a href="check.php">Check its status</a></div>
    </div>
  <?php else: ?>
    <form method="post">
      <div class="form-grid">
        <div class="field"><label>Full name</label><input type="text" name="requester_name" required></div>
        <div class="field"><label>Email address</label><input type="email" name="requester_email" required></div>
        <div class="field">
          <label>Department</label>
          <select name="department_id" required>
            <option value="">Select department</option>
            <?php foreach ($departments as $d): ?>
              <option value="<?= (int) $d['id'] ?>"><?= h($d['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label>Category</label>
          <select name="category" required>
            <option value="">Select category</option>
            <option>Account</option><option>Digital</option><option>Repair</option>
            <option>Leave</option><option>Reimbursement</option><option>Other</option>
          </select>
        </div>
        <div class="field full"><label>Subject</label><input type="text" name="subject" placeholder="Short summary of the issue" required></div>
        <div class="field full"><label>Description</label><textarea name="description" placeholder="Describe the issue in detail..." required></textarea></div>
      </div>
      <div class="btn-row"><button type="submit" class="btn btn-primary">Submit ticket</button></div>
    </form>
  <?php endif; ?>
</div>
<?php require __DIR__ . '/partials/footer.php'; ?>
