<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';
$activeNav = 'home';
require __DIR__ . '/partials/header.php';
?>
<div class="page-header">
  <div>
    <p class="page-title">Welcome</p>
    <p class="page-subtitle">Pick where you'd like to go from the left</p>
  </div>
</div>
<div class="card" style="max-width:560px;">
  <p style="margin-top:0;">This is a working local test build — it uses a real SQLite database, so tickets you submit and edits you make actually persist between page loads.</p>
  <p style="margin:0; font-size:13px; color:var(--text-secondary);">Demo staff logins are on the <a href="login.php">admin login</a> page.</p>
</div>
<?php require __DIR__ . '/partials/footer.php'; ?>
