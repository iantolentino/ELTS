<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

$user = requireLogin();
$pdo = db();
$activeNav = 'dashboard';

$statusFilter = trim($_GET['status'] ?? '');
$search = trim($_GET['q'] ?? '');

$departments = $pdo->query('SELECT id, name, code FROM departments ORDER BY name')->fetchAll(PDO::FETCH_ASSOC);

function buildTicketQuery(?int $departmentId, string $statusFilter, string $search): array
{
    $sql = 'SELECT t.*, d.name AS department_name FROM tickets t JOIN departments d ON d.id = t.department_id WHERE 1=1';
    $params = [];

    if ($departmentId !== null) {
        $sql .= ' AND t.department_id = ?';
        $params[] = $departmentId;
    }
    if ($statusFilter !== '') {
        $sql .= ' AND t.status = ?';
        $params[] = $statusFilter;
    }
    if ($search !== '') {
        $sql .= ' AND (t.ticket_number LIKE ? OR t.requester_name LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    $sql .= ' ORDER BY t.submitted_at DESC';

    return [$sql, $params];
}

if ($user['role'] === 'dept_admin') {
    [$sql, $params] = buildTicketQuery((int) $user['department_id'], $statusFilter, $search);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $counts = ['pending' => 0, 'ongoing' => 0, 'done' => 0, 'rejected' => 0];
    $countStmt = $pdo->prepare('SELECT status, COUNT(*) c FROM tickets WHERE department_id = ? GROUP BY status');
    $countStmt->execute([$user['department_id']]);
    foreach ($countStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $counts[$row['status']] = (int) $row['c'];
    }
} else {
    [$sql, $params] = buildTicketQuery(null, $statusFilter, $search);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $deptCounts = [];
    foreach ($departments as $d) {
        $c = $pdo->prepare("SELECT COUNT(*) FROM tickets WHERE department_id = ? AND status != 'done' AND status != 'rejected'");
        $c->execute([$d['id']]);
        $deptCounts[$d['id']] = (int) $c->fetchColumn();
    }
}

$flashMsg = $_GET['msg'] ?? null;
$flashType = $_GET['type'] ?? 'success';

require __DIR__ . '/partials/header.php';
?>

<?php if ($flashMsg): ?>
  <div class="flash <?= h($flashType) ?>"><?= h($flashMsg) ?></div>
<?php endif; ?>

<?php if ($user['role'] === 'dept_admin'):
  $deptName = '';
  foreach ($departments as $d) { if ((int) $d['id'] === (int) $user['department_id']) { $deptName = $d['name']; } }
?>
  <div class="page-header">
    <div><p class="page-title"><?= h($deptName) ?> department</p><p class="page-subtitle">Your department's tickets only</p></div>
    <span class="badge account">Department admin</span>
  </div>

  <div class="stat-row">
    <div class="stat-card"><p class="stat-label">Pending</p><p class="stat-value"><?= $counts['pending'] ?></p></div>
    <div class="stat-card"><p class="stat-label">Ongoing</p><p class="stat-value"><?= $counts['ongoing'] ?></p></div>
    <div class="stat-card"><p class="stat-label">Done</p><p class="stat-value"><?= $counts['done'] ?></p></div>
    <div class="stat-card"><p class="stat-label">Rejected</p><p class="stat-value"><?= $counts['rejected'] ?></p></div>
  </div>

  <form class="toolbar" method="get">
    <input type="text" name="q" placeholder="Search ticket ID or requester" value="<?= h($search) ?>">
    <select name="status" onchange="this.form.submit()">
      <option value="">All statuses</option>
      <?php foreach (['pending','ongoing','done','rejected'] as $s): ?>
        <option value="<?= $s ?>" <?= $statusFilter === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
      <?php endforeach; ?>
    </select>
    <button class="btn" type="submit">Filter</button>
  </form>

  <div class="table-wrap">
    <table>
      <thead><tr><th>Ticket ID</th><th>Requester</th><th>Issue &amp; description</th><th>Submitted</th><th>Accepted</th><th>Finished</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        <?php foreach ($tickets as $t): ?>
        <tr>
          <td class="ticket-id">#<?= h($t['ticket_number']) ?></td>
          <td><div style="font-weight:500;"><?= h($t['requester_name']) ?></div><div style="font-size:12px; color:var(--text-muted);"><?= h($t['requester_email']) ?></div></td>
          <td>
            <div style="font-weight:500; margin-bottom:3px;"><?= h($t['subject']) ?></div>
            <div style="color:var(--text-secondary); margin-bottom:6px;"><?= h($t['description']) ?></div>
            <span class="badge account"><?= h($t['category']) ?></span>
          </td>
          <td><?= h(date('M j', strtotime((string) $t['submitted_at']))) ?></td>
          <td><?= $t['accepted_at'] ? h(date('M j', strtotime((string) $t['accepted_at']))) : '<span style="color:var(--text-muted)">—</span>' ?></td>
          <td><?= $t['finished_at'] ? h(date('M j', strtotime((string) $t['finished_at']))) : '<span style="color:var(--text-muted)">—</span>' ?></td>
          <td><span class="<?= statusBadgeClass($t['status']) ?>"><?= ucfirst($t['status']) ?></span></td>
          <td>
            <?php if ($t['status'] === 'pending'): ?>
              <div class="actions">
                <form method="post" action="ticket_action.php" style="display:inline;">
                  <input type="hidden" name="ticket_id" value="<?= (int) $t['id'] ?>">
                  <input type="hidden" name="action" value="accept">
                  <button class="accept" aria-label="Accept"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></button>
                </form>
                <form method="post" action="ticket_action.php" style="display:inline;" onsubmit="return fillReason(this);">
                  <input type="hidden" name="ticket_id" value="<?= (int) $t['id'] ?>">
                  <input type="hidden" name="action" value="reject">
                  <input type="hidden" name="rejection_reason" value="">
                  <button type="submit" class="reject" aria-label="Reject"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </form>
              </div>
            <?php elseif ($t['status'] === 'ongoing'): ?>
              <form method="post" action="ticket_action.php">
                <input type="hidden" name="ticket_id" value="<?= (int) $t['id'] ?>">
                <input type="hidden" name="action" value="finish">
                <button class="finish" aria-label="Mark finished"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0z"/></svg></button>
              </form>
            <?php else: ?>
              <span style="color:var(--text-muted);">—</span>
            <?php endif; ?>
          </td>
        </tr>
        <?php endforeach; ?>
        <?php if (!$tickets): ?>
          <tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:24px;">No tickets match this filter.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <script>
    function fillReason(form){
      const reason = prompt('Reason for rejecting this ticket:');
      if (!reason) return false;
      form.rejection_reason.value = reason;
      return true;
    }
  </script>

<?php else: ?>

  <div class="page-header">
    <div><p class="page-title">All departments</p><p class="page-subtitle">Full visibility — every field below is directly editable</p></div>
    <span class="badge digital">Super admin</span>
  </div>

  <div class="stat-row">
    <?php foreach ($departments as $d): ?>
      <div class="stat-card"><p class="stat-label"><?= h($d['name']) ?></p><p class="stat-value"><?= $deptCounts[$d['id']] ?> open</p></div>
    <?php endforeach; ?>
  </div>

  <div class="dept-chips">
    <?php foreach ($departments as $d): ?><span class="chip"><?= h($d['name']) ?></span><?php endforeach; ?>
    <form method="post" action="department_action.php" style="display:flex; gap:6px;" onsubmit="return fillDept(this);">
      <input type="hidden" name="name" value=""><input type="hidden" name="code" value="">
      <button type="submit" class="btn btn-sm">+ Add department</button>
    </form>
  </div>
  <script>
    function fillDept(form){
      const name = prompt('New department name:');
      if (!name) return false;
      const code = prompt('Short code for ticket numbers (e.g. OPS):', name.substring(0,3).toUpperCase());
      if (!code) return false;
      form.name.value = name;
      form.code.value = code.toUpperCase();
      return true;
    }
  </script>

  <div class="export-bar">
    <form method="get" action="export_csv.php" style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; width:100%;">
      <div class="field"><label>From</label><input type="date" name="from" value="<?= date('Y-m-01') ?>"></div>
      <div class="field"><label>To</label><input type="date" name="to" value="<?= date('Y-m-d') ?>"></div>
      <div class="spacer"></div>
      <button type="submit" class="btn">Export CSV</button>
      <button type="submit" formaction="report.php" formtarget="_blank" class="btn btn-primary">Export PDF (print view)</button>
    </form>
  </div>

  <form class="toolbar" method="get">
    <input type="text" name="q" placeholder="Search ticket ID or requester" value="<?= h($search) ?>">
    <select name="status" onchange="this.form.submit()">
      <option value="">All statuses</option>
      <?php foreach (['pending','ongoing','done','rejected'] as $s): ?>
        <option value="<?= $s ?>" <?= $statusFilter === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
      <?php endforeach; ?>
    </select>
    <button class="btn" type="submit">Filter</button>
  </form>

  <?php foreach ($tickets as $t): ?>
    <form id="row-<?= (int) $t['id'] ?>" method="post" action="ticket_action.php">
      <input type="hidden" name="ticket_id" value="<?= (int) $t['id'] ?>">
      <input type="hidden" name="action" value="update_full">
    </form>
  <?php endforeach; ?>

  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>Ticket ID</th><th>Dept</th><th>Requester</th><th>Issue</th><th>Description</th>
        <th>Category</th><th>Submitted</th><th>Accepted</th><th>Finished</th><th>Status</th><th></th>
      </tr></thead>
      <tbody>
        <?php foreach ($tickets as $t): $fid = 'row-' . (int) $t['id']; ?>
        <tr>
          <td class="ticket-id">#<?= h($t['ticket_number']) ?></td>
          <td>
            <select class="cell-input" name="department_id" form="<?= $fid ?>">
              <?php foreach ($departments as $d): ?>
                <option value="<?= (int) $d['id'] ?>" <?= (int) $d['id'] === (int) $t['department_id'] ? 'selected' : '' ?>><?= h($d['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </td>
          <td>
            <input class="cell-input" name="requester_name" value="<?= h($t['requester_name']) ?>" form="<?= $fid ?>">
            <input class="cell-input" name="requester_email" value="<?= h($t['requester_email']) ?>" form="<?= $fid ?>">
          </td>
          <td><input class="cell-input" name="subject" value="<?= h($t['subject']) ?>" style="min-width:150px;" form="<?= $fid ?>"></td>
          <td><textarea class="cell-input" name="description" style="min-width:200px;" form="<?= $fid ?>"><?= h($t['description']) ?></textarea></td>
          <td>
            <select class="cell-input" name="category" form="<?= $fid ?>">
              <?php foreach (['Account','Digital','Repair','Leave','Reimbursement','Other'] as $c): ?>
                <option <?= $t['category'] === $c ? 'selected' : '' ?>><?= $c ?></option>
              <?php endforeach; ?>
            </select>
          </td>
          <td><input type="date" class="cell-input" name="submitted_at" value="<?= h(date('Y-m-d', strtotime((string) $t['submitted_at']))) ?>" form="<?= $fid ?>"></td>
          <td><input type="date" class="cell-input" name="accepted_at" value="<?= $t['accepted_at'] ? h(date('Y-m-d', strtotime((string) $t['accepted_at']))) : '' ?>" form="<?= $fid ?>"></td>
          <td><input type="date" class="cell-input" name="finished_at" value="<?= $t['finished_at'] ? h(date('Y-m-d', strtotime((string) $t['finished_at']))) : '' ?>" form="<?= $fid ?>"></td>
          <td>
            <select class="cell-input" name="status" form="<?= $fid ?>">
              <?php foreach (['pending','ongoing','done','rejected'] as $s): ?>
                <option value="<?= $s ?>" <?= $t['status'] === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
              <?php endforeach; ?>
            </select>
          </td>
          <td><button type="submit" class="btn btn-sm" form="<?= $fid ?>">Save</button></td>
        </tr>
        <?php endforeach; ?>
        <?php if (!$tickets): ?>
          <tr><td colspan="11" style="text-align:center; color:var(--text-muted); padding:24px;">No tickets match this filter.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
  <p class="helper">Every field here — including Accepted date — is directly editable and saved to the database, so fixes don't need a database console.</p>

<?php endif; ?>

<?php require __DIR__ . '/partials/footer.php'; ?>
