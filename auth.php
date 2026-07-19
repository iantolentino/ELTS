<?php
declare(strict_types=1);

function attemptLogin(string $email, string $password): ?array
{
    $user = dbFetchOne('SELECT * FROM users WHERE email = :email', ['email' => $email]);
    if ($user === null || !password_verify($password, $user['password_hash'])) {
        return null;
    }
    return $user;
}

function loginUser(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['department_id'] = $user['department_id'] !== null ? (int) $user['department_id'] : null;
    $_SESSION['name'] = $user['name'];
}

function logoutUser(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

function currentUser(): ?array
{
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    return [
        'id' => $_SESSION['user_id'],
        'role' => $_SESSION['role'],
        'department_id' => $_SESSION['department_id'],
        'name' => $_SESSION['name'],
    ];
}

// Destroys the session and redirects when the request carries ?logout — call before requireLogin.
function handleLogoutIfRequested(string $redirectUrl): void
{
    if (isset($_GET['logout'])) {
        logoutUser();
        header('Location: ' . $redirectUrl);
        exit;
    }
}

// Returns the current user if already authenticated. Otherwise handles a POST login attempt
// (redirecting + exiting on success) or renders the login form (returning null) on GET/failure.
// Callers must treat a null return as "response already sent — stop processing this request."
function requireLogin(string $formTitle, string $actionUrl): ?array
{
    $user = currentUser();
    if ($user !== null) {
        return $user;
    }

    $error = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $found = attemptLogin((string) ($_POST['email'] ?? ''), (string) ($_POST['password'] ?? ''));
        if ($found !== null) {
            loginUser($found);
            header('Location: ' . $actionUrl);
            exit;
        }
        $error = 'Invalid email or password.';
    }

    renderLoginForm($formTitle, $actionUrl, $error);
    return null;
}

// Department isolation guard: superadmin always passes; an agent passes only for their own
// department_id. Renders a 403 and returns false otherwise — caller must stop on false.
//
// While "View As" is active, even a superadmin is restricted to ONLY the department being viewed
// as — not the normal cross-department bypass. That's what makes View-As scope match the target
// agent rather than granting broader access (T025 acceptance criteria).
function requireDepartmentAccess(array $user, int $departmentId): bool
{
    $viewAs = getViewAsContext();
    if ($viewAs !== null) {
        if ($viewAs['department_id'] === $departmentId) {
            return true;
        }
        send403();
        return false;
    }

    if ($user['role'] === 'superadmin') {
        return true;
    }
    if ($user['role'] === 'agent' && $user['department_id'] === $departmentId) {
        return true;
    }
    send403();
    return false;
}

// ── View As (T025) ──────────────────────────────────────────────────────────────────────────
// Superadmin observes an agent's department dashboard exactly as that agent sees it, without
// their password. Session-only state layered on top of the real superadmin session — it does not
// change who is logged in, only what requireDepartmentAccess() currently permits and how mutating
// POSTs are gated (see blockIfViewAsReadOnly() in department_controller.php).

function getViewAsContext(): ?array
{
    if (!isset($_SESSION['view_as_agent_id'])) {
        return null;
    }
    return [
        'agent_id' => (int) $_SESSION['view_as_agent_id'],
        'agent_name' => (string) $_SESSION['view_as_agent_name'],
        'department_id' => (int) $_SESSION['view_as_department_id'],
        'department_slug' => (string) $_SESSION['view_as_department_slug'],
    ];
}

/**
 * @param array<string,mixed> $superadmin
 * @param array<string,mixed> $agent
 * @param array<string,mixed> $department
 */
function startViewAs(array $superadmin, array $agent, array $department): void
{
    $_SESSION['view_as_agent_id'] = (int) $agent['id'];
    $_SESSION['view_as_agent_name'] = (string) $agent['name'];
    $_SESSION['view_as_department_id'] = (int) $department['id'];
    $_SESSION['view_as_department_slug'] = (string) $department['slug'];

    // audit_logs.ticket_id is NOT NULL — this event isn't tied to any ticket, so it has no honest
    // home there (see decisions/decision_log.md [ARCH]). Logged to a file instead, same access
    // model as uploads/: directory fully blocked from direct HTTP access.
    logSystemEvent(sprintf(
        'VIEW_AS_START superadmin_id=%d superadmin_name=%s -> agent_id=%d agent_name=%s department_id=%d',
        (int) $superadmin['id'],
        (string) $superadmin['name'],
        (int) $agent['id'],
        (string) $agent['name'],
        (int) $department['id']
    ));
}

function exitViewAs(): void
{
    unset(
        $_SESSION['view_as_agent_id'],
        $_SESSION['view_as_agent_name'],
        $_SESSION['view_as_department_id'],
        $_SESSION['view_as_department_slug']
    );
}

function logSystemEvent(string $line): void
{
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $entry = '[' . date('Y-m-d H:i:s') . '] ' . $line . PHP_EOL;
    file_put_contents($dir . '/audit-system.log', $entry, FILE_APPEND | LOCK_EX);
}

// Restricts a route to superadmin only. Renders a 403 and returns false otherwise.
function requireSuperadmin(array $user): bool
{
    if ($user['role'] === 'superadmin') {
        return true;
    }
    send403();
    return false;
}

function renderLoginForm(string $title, string $actionUrl, ?string $error = null): void
{
    $errorHtml = $error !== null
        ? '<p class="text-destructive" style="margin-top:0;">' . htmlspecialchars($error) . '</p>'
        : '';
    $content = '
    <main class="container">
      <div class="card" style="max-width:360px; margin:0 auto;">
        <h1>' . htmlspecialchars($title) . '</h1>
        ' . $errorHtml . '
        <form method="post" action="' . htmlspecialchars($actionUrl) . '">
          <div class="field"><label>Email</label><input type="email" name="email" required autofocus></div>
          <div class="field"><label>Password</label><input type="password" name="password" required></div>
          <button class="btn" type="submit">Log in</button>
        </form>
      </div>
    </main>';
    renderPage($title, $content);
}
