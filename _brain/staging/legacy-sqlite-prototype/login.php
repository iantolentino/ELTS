<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

$pdo = db();
$activeNav = 'login';
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    $stmt = $pdo->prepare('SELECT * FROM admins WHERE email = ?');
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin && password_verify($password, $admin['password_hash'])) {
        $_SESSION['admin'] = [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
            'department_id' => $admin['department_id'],
        ];
        header('Location: dashboard.php');
        exit;
    }
    $error = 'Incorrect email or password.';
}

require __DIR__ . '/partials/header.php';
?>
<div class="page-header">
  <div>
    <p class="page-title">Staff sign in</p>
    <p class="page-subtitle">For department admins and the super admin</p>
  </div>
</div>

<div class="login-wrap card">
  <?php if ($error): ?><div class="flash error"><?= h($error) ?></div><?php endif; ?>
  <form method="post">
    <div class="field" style="margin-bottom:12px;"><label>Email address</label><input type="email" name="email" required></div>
    <div class="field"><label>Password</label><input type="password" name="password" required></div>
    <div class="btn-row"><button type="submit" class="btn btn-primary" style="width:100%;">Sign in</button></div>
  </form>
  <p class="helper">
    Demo accounts — Super admin: superadmin@company.com / super123 &middot;
    IT admin: itadmin@company.com / itadmin123 &middot;
    HR admin: hradmin@company.com / hradmin123
  </p>
</div>
<?php require __DIR__ . '/partials/footer.php'; ?>
