<?php
/** @var string $activeNav */
$user = currentUser();
$activeNav = $activeNav ?? '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unified Ticketing System</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app-shell">
  <aside class="sidebar no-print">
    <div class="brand">
      <div class="brand-mark">UT</div>
      <div><div class="brand-name">Unified Ticketing</div><div class="brand-sub">Company-wide system</div></div>
    </div>

    <div class="nav-group-label">Requesters (no login)</div>
    <a class="nav-item <?= $activeNav === 'submit' ? 'active' : '' ?>" href="submit.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Submit a ticket
    </a>
    <a class="nav-item <?= $activeNav === 'check' ? 'active' : '' ?>" href="check.php">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>Check ticket status
    </a>

    <div class="nav-group-label">Staff</div>
    <?php if ($user): ?>
      <a class="nav-item <?= $activeNav === 'dashboard' ? 'active' : '' ?>" href="dashboard.php">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg><?= $user['role'] === 'super' ? 'Super admin dashboard' : 'Department dashboard' ?>
      </a>
      <a class="nav-item" href="logout.php">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Log out (<?= h($user['name']) ?>)
      </a>
    <?php else: ?>
      <a class="nav-item <?= $activeNav === 'login' ? 'active' : '' ?>" href="login.php">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>Admin login
      </a>
    <?php endif; ?>
  </aside>

  <main class="main">
