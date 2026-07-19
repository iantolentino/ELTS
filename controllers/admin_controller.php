<?php
declare(strict_types=1);

const SERVICE_STATUS_STATES = ['operational', 'degraded', 'down'];

const ADMIN_SECTIONS = [
    'dashboard' => 'Dashboard',
    'departments' => 'Departments',
    'users' => 'Users',
    'status' => 'Service Status',
    'settings' => 'Settings',
];

function handleAdminRoute(array $segments): void
{
    if (count($segments) > 0) {
        send404();
        return;
    }

    $selfUrl = url('admin/');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin('Admin Login', $selfUrl);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireSuperadmin($user)) {
        return; // 403 already rendered
    }

    $section = (string) ($_GET['section'] ?? 'dashboard');
    if (!array_key_exists($section, ADMIN_SECTIONS)) {
        $section = 'dashboard';
    }

    $viewAsError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'start_view_as') {
        $viewAsError = applyStartViewAs($user);
        if ($viewAsError === null) {
            return; // applyStartViewAs already redirected
        }
    }

    $statusFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_status') {
        $statusFormError = applySaveServiceStatus();
        if ($statusFormError === null) {
            header('Location: ' . $selfUrl . '?section=status');
            exit;
        }
    }

    $settingsFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_setting') {
        $settingsFormError = applySaveSetting();
        if ($settingsFormError === null) {
            header('Location: ' . $selfUrl . '?section=settings');
            exit;
        }
    }

    $deptFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_department') {
        $deptFormError = applySaveDepartment();
        if ($deptFormError === null) {
            header('Location: ' . $selfUrl . '?section=departments');
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_department') {
        $handled = handleDeleteDepartment($selfUrl);
        if ($handled) {
            return; // confirmation screen rendered, or already redirected after real deletion
        }
    }

    $userFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_user') {
        $userFormError = applySaveUser();
        if ($userFormError === null) {
            header('Location: ' . $selfUrl . '?section=users');
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'deactivate_user') {
        $handled = handleDeactivateUser($selfUrl);
        if ($handled) {
            return; // confirmation screen rendered, or already redirected after real deactivation
        }
    }

    $sectionContent = match ($section) {
        'departments' => renderDepartmentsSection($selfUrl, $deptFormError),
        'users' => renderUsersSection($selfUrl, $userFormError),
        'status' => renderStatusSection($selfUrl, $statusFormError),
        'settings' => renderSettingsSection($selfUrl, $settingsFormError),
        default => renderDashboardSection($selfUrl, $viewAsError),
    };

    renderPage('Admin', renderAdminShell($section, $user, $selfUrl, $sectionContent));
}

function renderAdminShell(string $activeSection, array $user, string $selfUrl, string $sectionContent): string
{
    $nav = '';
    foreach (ADMIN_SECTIONS as $key => $label) {
        $isActive = $key === $activeSection;
        $href = $key === 'dashboard' ? $selfUrl : $selfUrl . '?section=' . $key;
        $nav .= '<a href="' . htmlspecialchars($href) . '" class="btn ' . ($isActive ? '' : 'btn-outline') . '" style="margin-right:.5rem;">' . htmlspecialchars($label) . '</a>';
    }

    return '
    <main class="container">
      <div class="card" style="margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h1>Super Admin</h1>
            <p class="muted">Logged in as ' . htmlspecialchars($user['name']) . '. <a href="' . htmlspecialchars($selfUrl . '?logout=1') . '">Log out</a></p>
          </div>
        </div>
        <div style="margin-top:1rem;">' . $nav . '</div>
      </div>
      ' . $sectionContent . '
    </main>';
}

// ── Dashboard (T024) + View As entry point (T025) ────────────────────────────────────────────

function renderDashboardSection(string $selfUrl, ?string $viewAsError): string
{
    $globalStats = cacheRemember('admin_global_stats', 60, function () {
        $rows = dbFetchAll('SELECT status, COUNT(*) AS cnt FROM tickets GROUP BY status');
        $counts = array_fill_keys(VALID_TICKET_STATUSES, 0);
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['cnt'];
        }
        return $counts;
    });

    $statTiles = '';
    foreach (VALID_TICKET_STATUSES as $status) {
        $statTiles .= '<div class="card" style="padding:.9rem 1.1rem;">'
            . '<div class="muted" style="font-size:.75rem; text-transform:uppercase;">' . htmlspecialchars($status) . '</div>'
            . '<div style="font-size:1.4rem; font-weight:600;">' . (int) ($globalStats[$status] ?? 0) . '</div>'
            . '</div>';
    }

    $deptCount = (int) (dbFetchOne('SELECT COUNT(*) AS cnt FROM departments')['cnt'] ?? 0);
    $userCount = (int) (dbFetchOne('SELECT COUNT(*) AS cnt FROM users')['cnt'] ?? 0);

    $agents = dbFetchAll(
        "SELECT u.id, u.name, d.name AS dept_name
         FROM users u JOIN departments d ON d.id = u.department_id
         WHERE u.role = 'agent' ORDER BY d.name, u.name"
    );
    $agentOptions = '';
    foreach ($agents as $a) {
        $agentOptions .= '<option value="' . (int) $a['id'] . '">' . htmlspecialchars((string) $a['name']) . ' (' . htmlspecialchars((string) $a['dept_name']) . ')</option>';
    }
    $viewAsErrorHtml = $viewAsError !== null ? '<p class="text-destructive">' . htmlspecialchars($viewAsError) . '</p>' : '';
    $viewAsWidget = $agents === []
        ? '<p class="muted">No agents to view as yet — add one under Users.</p>'
        : '<form method="post" action="' . htmlspecialchars($selfUrl) . '">
             <input type="hidden" name="intent" value="start_view_as">
             <div class="field"><label>View as agent</label><select name="agent_id">' . $agentOptions . '</select></div>
             ' . $viewAsErrorHtml . '
             <button class="btn btn-outline" type="submit">View As</button>
           </form>';

    return '
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:.75rem; margin-bottom:1.5rem;">' . $statTiles . '</div>
    <div class="card" style="margin-bottom:1.5rem;">
      <h2>Overview (all departments)</h2>
      <p class="muted">' . $deptCount . ' department(s), ' . $userCount . ' user(s) total.</p>
    </div>
    <div class="card">
      <h2>View As</h2>
      <p class="muted">View an agent\'s department dashboard exactly as they see it (read-only — see the banner once active).</p>
      ' . $viewAsWidget . '
    </div>';
}

/**
 * @param array<string,mixed> $superadmin
 */
function applyStartViewAs(array $superadmin): ?string
{
    $agentId = isset($_POST['agent_id']) && ctype_digit((string) $_POST['agent_id']) ? (int) $_POST['agent_id'] : null;
    $agent = $agentId !== null
        ? dbFetchOne("SELECT * FROM users WHERE id = :id AND role = 'agent'", ['id' => $agentId])
        : null;
    if ($agent === null) {
        return 'Select a valid agent.';
    }

    $department = $agent['department_id'] !== null
        ? dbFetchOne('SELECT * FROM departments WHERE id = :id', ['id' => (int) $agent['department_id']])
        : null;
    if ($department === null) {
        return 'That agent has no department assigned.';
    }

    startViewAs($superadmin, $agent, $department);
    header('Location: ' . url($department['slug'] . '/'));
    exit;
}

// ── Placeholders filled in by later tasks in this same phase ─────────────────────────────────

// ── Department CRUD (T028) ────────────────────────────────────────────────────────────────────

function applySaveDepartment(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $name = trim((string) ($_POST['name'] ?? ''));
    $slug = strtolower(trim((string) ($_POST['slug'] ?? '')));

    if ($name === '') {
        return 'Name is required.';
    }
    if ($slug === '' || !preg_match('/^[a-z0-9-]+$/', $slug)) {
        return 'Slug must be lowercase letters, numbers, and hyphens only.';
    }
    if ($slug === 'admin') {
        return '"admin" is a reserved slug (it would collide with the admin route).';
    }

    $existing = dbFetchOne('SELECT id FROM departments WHERE slug = :slug', ['slug' => $slug]);
    if ($existing !== null && ($id === null || (int) $existing['id'] !== $id)) {
        return 'That slug is already in use by another department.';
    }

    if ($id !== null) {
        dbUpdate('departments', ['name' => $name, 'slug' => $slug], 'id = :id', ['id' => $id]);
    } else {
        dbInsert('departments', ['name' => $name, 'slug' => $slug]);
    }

    return null;
}

// Two-step delete (T027 pattern): first POST (no confirm=yes) renders a confirmation screen that
// tells the admin exactly how many tickets will be unassigned (not deleted — FK is ON DELETE SET
// NULL) rather than silently orphaning them. Returns true if it handled the request (either
// rendered the confirmation or redirected after a real delete) — caller should stop either way.
function handleDeleteDepartment(string $selfUrl): bool
{
    $deptId = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($deptId === null) {
        return false;
    }

    $dept = dbFetchOne('SELECT * FROM departments WHERE id = :id', ['id' => $deptId]);
    if ($dept === null) {
        return false;
    }

    if (!isConfirmed()) {
        $ticketCount = (int) (dbFetchOne('SELECT COUNT(*) AS cnt FROM tickets WHERE department_id = :id', ['id' => $deptId])['cnt'] ?? 0);
        renderConfirmation(
            'Delete Department?',
            'This will permanently delete "' . $dept['name'] . '". ' . $ticketCount
                . ' existing ticket(s) in this department will become unassigned (department set to none), not deleted.',
            $selfUrl . '?section=departments',
            ['intent' => 'delete_department', 'id' => $deptId]
        );
        return true;
    }

    dbDelete('departments', 'id = :id', ['id' => $deptId]);
    header('Location: ' . $selfUrl . '?section=departments');
    exit;
}

function renderDepartmentsSection(string $selfUrl, ?string $deptFormError = null): string
{
    $departments = dbFetchAll(
        "SELECT d.id, d.name, d.slug, (SELECT COUNT(*) FROM tickets t WHERE t.department_id = d.id) AS ticket_count
         FROM departments d ORDER BY d.name"
    );

    $rows = $departments === []
        ? '<tr><td colspan="4" class="muted">No departments yet.</td></tr>'
        : '';
    foreach ($departments as $d) {
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $d['name']) . '</td>'
            . '<td><code>' . htmlspecialchars((string) $d['slug']) . '</code></td>'
            . '<td>' . (int) $d['ticket_count'] . '</td>'
            . '<td>'
            . '<button class="btn btn-outline" type="button" onclick="'
            . "document.getElementById('dp_id').value='" . (int) $d['id'] . "';"
            . "document.getElementById('dp_name').value=" . json_encode((string) $d['name']) . ";"
            . "document.getElementById('dp_slug').value=" . json_encode((string) $d['slug']) . ";"
            . '">Edit</button> '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . '<input type="hidden" name="intent" value="delete_department">'
            . '<input type="hidden" name="id" value="' . (int) $d['id'] . '">'
            . '<button class="btn btn-danger" type="submit">Delete</button>'
            . '</form>'
            . '</td>'
            . '</tr>';
    }

    return '
    <div class="card">
      <h2>Departments</h2>
      <table>
        <thead><tr><th>Name</th><th>Slug</th><th>Tickets</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit Department</h2>
      ' . ($deptFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($deptFormError) . '</p>' : '') . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=departments') . '">
        <input type="hidden" name="intent" value="save_department">
        <input type="hidden" name="id" id="dp_id" value="">
        <div class="field">
          <label>Name</label>
          <input type="text" name="name" id="dp_name" required>
        </div>
        <div class="field">
          <label>Slug (used in URLs, e.g. /it/)</label>
          <input type="text" name="slug" id="dp_slug" pattern="[a-z0-9-]+" required>
        </div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}

// ── User/agent CRUD (T029) ────────────────────────────────────────────────────────────────────

const DEACTIVATED_PASSWORD_PREFIX = 'DEACTIVATED:';

function applySaveUser(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $name = trim((string) ($_POST['name'] ?? ''));
    $email = trim((string) ($_POST['email'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $role = (string) ($_POST['role'] ?? 'agent');
    $departmentId = isset($_POST['department_id']) && ctype_digit((string) $_POST['department_id']) ? (int) $_POST['department_id'] : null;
    $canAcceptTickets = isset($_POST['can_accept_tickets']) ? 1 : 0;

    if ($name === '') {
        return 'Name is required.';
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'A valid email is required.';
    }
    if (!in_array($role, ['agent', 'superadmin'], true)) {
        return 'Invalid role.';
    }
    if ($role === 'agent') {
        if ($departmentId === null || dbFetchOne('SELECT id FROM departments WHERE id = :id', ['id' => $departmentId]) === null) {
            return 'Agents must have a valid department.';
        }
    } else {
        $departmentId = null; // superadmins aren't department-scoped
    }
    if ($id === null && $password === '') {
        return 'Password is required for a new user.';
    }
    if ($password !== '' && strlen($password) < 8) {
        return 'Password must be at least 8 characters.';
    }

    $existingEmail = dbFetchOne('SELECT id FROM users WHERE email = :email', ['email' => $email]);
    if ($existingEmail !== null && ($id === null || (int) $existingEmail['id'] !== $id)) {
        return 'That email is already in use by another user.';
    }

    $data = [
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'department_id' => $departmentId,
        'can_accept_tickets' => $canAcceptTickets,
    ];
    if ($password !== '') {
        $data['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }

    if ($id !== null) {
        dbUpdate('users', $data, 'id = :id', ['id' => $id]);
    } else {
        $data['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        dbInsert('users', $data);
    }

    return null;
}

// Two-step (T027 pattern): revokes login by overwriting password_hash with a sentinel that can
// never match password_verify() — see decisions/decision_log.md [ARCH] for why not a real delete
// or a status column (neither exists safely/at all given the fixed schema).
function handleDeactivateUser(string $selfUrl): bool
{
    $userId = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($userId === null) {
        return false;
    }

    $target = dbFetchOne('SELECT * FROM users WHERE id = :id', ['id' => $userId]);
    if ($target === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Deactivate User?',
            'This revokes login access for "' . $target['name'] . '" by invalidating their password. '
                . 'Their ticket and audit history is preserved. Reactivate later by setting a new password.',
            $selfUrl . '?section=users',
            ['intent' => 'deactivate_user', 'id' => $userId]
        );
        return true;
    }

    dbUpdate('users', ['password_hash' => DEACTIVATED_PASSWORD_PREFIX . bin2hex(random_bytes(32))], 'id = :id', ['id' => $userId]);
    header('Location: ' . $selfUrl . '?section=users');
    exit;
}

function renderUsersSection(string $selfUrl, ?string $userFormError = null): string
{
    $users = dbFetchAll(
        'SELECT u.*, d.name AS dept_name
         FROM users u LEFT JOIN departments d ON d.id = u.department_id
         ORDER BY u.role, dept_name, u.name'
    );
    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');

    $rows = $users === [] ? '<tr><td colspan="7" class="muted">No users yet.</td></tr>' : '';
    foreach ($users as $u) {
        $deactivated = str_starts_with((string) $u['password_hash'], DEACTIVATED_PASSWORD_PREFIX);
        $viewAsBtn = ($u['role'] === 'agent' && !$deactivated)
            ? '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
                . '<input type="hidden" name="intent" value="start_view_as">'
                . '<input type="hidden" name="agent_id" value="' . (int) $u['id'] . '">'
                . '<button class="btn btn-outline" type="submit">View As</button></form>'
            : '';
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $u['name']) . ($deactivated ? ' <span class="badge badge-cancelled">deactivated</span>' : '') . '</td>'
            . '<td>' . htmlspecialchars((string) $u['email']) . '</td>'
            . '<td>' . htmlspecialchars((string) $u['role']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($u['dept_name'] ?? '—')) . '</td>'
            . '<td>' . ((int) $u['can_accept_tickets'] === 1 ? 'Yes' : 'No') . '</td>'
            . '<td>' . ((int) $u['is_online'] === 1 ? 'Online' : 'Offline') . ($u['last_seen_at'] !== null ? ' (' . htmlspecialchars((string) $u['last_seen_at']) . ')' : '') . '</td>'
            . '<td>'
            . '<button class="btn btn-outline" type="button" onclick="'
            . "document.getElementById('us_id').value='" . (int) $u['id'] . "';"
            . "document.getElementById('us_name').value=" . json_encode((string) $u['name']) . ";"
            . "document.getElementById('us_email').value=" . json_encode((string) $u['email']) . ";"
            . "document.getElementById('us_role').value=" . json_encode((string) $u['role']) . ";"
            . "document.getElementById('us_dept').value=" . json_encode($u['department_id'] !== null ? (string) (int) $u['department_id'] : '') . ";"
            . "document.getElementById('us_can_accept').checked=" . ((int) $u['can_accept_tickets'] === 1 ? 'true' : 'false') . ";"
            . '">Edit</button> '
            . $viewAsBtn . ' '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . '<input type="hidden" name="intent" value="deactivate_user">'
            . '<input type="hidden" name="id" value="' . (int) $u['id'] . '">'
            . '<button class="btn btn-danger" type="submit">Deactivate</button></form>'
            . '</td>'
            . '</tr>';
    }

    $deptOptions = '<option value="">— (superadmin)</option>';
    foreach ($departments as $d) {
        $deptOptions .= '<option value="' . (int) $d['id'] . '">' . htmlspecialchars((string) $d['name']) . '</option>';
    }

    $errorHtml = $userFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($userFormError) . '</p>' : '';

    return '
    <div class="card">
      <h2>Users</h2>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Can Accept</th><th>Presence</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit User</h2>
      ' . $errorHtml . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=users') . '">
        <input type="hidden" name="intent" value="save_user">
        <input type="hidden" name="id" id="us_id" value="">
        <div class="field"><label>Name</label><input type="text" name="name" id="us_name" required></div>
        <div class="field"><label>Email</label><input type="email" name="email" id="us_email" required></div>
        <div class="field"><label>Password (leave blank to keep current when editing)</label><input type="password" name="password" minlength="8"></div>
        <div class="field"><label>Role</label>
          <select name="role" id="us_role">
            <option value="agent">agent</option>
            <option value="superadmin">superadmin</option>
          </select>
        </div>
        <div class="field"><label>Department (agents only)</label>
          <select name="department_id" id="us_dept">' . $deptOptions . '</select>
        </div>
        <div class="field"><label><input type="checkbox" name="can_accept_tickets" id="us_can_accept" checked style="width:auto;"> Can accept tickets</label></div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}

// ── Feature-flag command center (T026) ────────────────────────────────────────────────────────
// Backed by the `settings` table, not config.php — the point is toggling without a code deploy.
// is_enabled = whether this flag/override is active; config_value = the value it carries (e.g. a
// custom maintenance message), optional for a pure on/off flag.

function applySaveSetting(): ?string
{
    $key = trim((string) ($_POST['config_key'] ?? ''));
    $value = trim((string) ($_POST['config_value'] ?? ''));
    $isEnabled = isset($_POST['is_enabled']) ? 1 : 0;

    if ($key === '' || !preg_match('/^[a-z0-9_]+$/', $key)) {
        return 'Key must be lowercase letters, numbers, and underscores only.';
    }

    dbQuery(
        'INSERT INTO settings (config_key, config_value, is_enabled) VALUES (:key, :value, :enabled)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), is_enabled = VALUES(is_enabled)',
        ['key' => $key, 'value' => $value !== '' ? $value : null, 'enabled' => $isEnabled]
    );

    return null;
}

function renderSettingsSection(string $selfUrl, ?string $settingsFormError): string
{
    $settings = dbFetchAll('SELECT * FROM settings ORDER BY config_key');

    $rows = $settings === []
        ? '<tr><td colspan="4" class="muted">No settings yet — maintenance_mode is OFF by default until a row exists.</td></tr>'
        : '';
    foreach ($settings as $s) {
        $rows .= '<tr>'
            . '<td><code>' . htmlspecialchars((string) $s['config_key']) . '</code></td>'
            . '<td>' . htmlspecialchars((string) ($s['config_value'] ?? '')) . '</td>'
            . '<td>' . ((int) $s['is_enabled'] === 1 ? 'ON' : 'off') . '</td>'
            . '<td><button class="btn btn-outline" type="button" onclick="'
            . "document.getElementById('sg_key').value=" . json_encode((string) $s['config_key']) . ";"
            . "document.getElementById('sg_value').value=" . json_encode((string) ($s['config_value'] ?? '')) . ";"
            . "document.getElementById('sg_enabled').checked=" . ((int) $s['is_enabled'] === 1 ? 'true' : 'false') . ";"
            . '">Edit</button></td>'
            . '</tr>';
    }

    $errorHtml = $settingsFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($settingsFormError) . '</p>' : '';

    return '
    <div class="card">
      <h2>Feature Flags</h2>
      <p class="muted">Toggling a flag here takes effect on the very next request — no deploy.
      Try <code>maintenance_mode</code>: enable it and reload the public home page.</p>
      <table>
        <thead><tr><th>Key</th><th>Value</th><th>Enabled</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit Flag</h2>
      ' . $errorHtml . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=settings') . '">
        <input type="hidden" name="intent" value="save_setting">
        <div class="field">
          <label>Key (lowercase_with_underscores)</label>
          <input type="text" name="config_key" id="sg_key" pattern="[a-z0-9_]+" required>
        </div>
        <div class="field">
          <label>Value (optional)</label>
          <input type="text" name="config_value" id="sg_value">
        </div>
        <div class="field">
          <label><input type="checkbox" name="is_enabled" id="sg_enabled" style="width:auto;"> Enabled</label>
        </div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}

// ── Service Status Hub (T023, moved under the "status" tab) ──────────────────────────────────

// Create (no id) or update (id present) a service_status row. "Hide" from the public banner is
// just is_visible_to_public=0 via the same form, not a separate action — matches the README's
// "create/update/hide" framing without inventing a fourth CRUD action it didn't ask for.
function applySaveServiceStatus(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $systemName = trim((string) ($_POST['system_name'] ?? ''));
    $statusState = (string) ($_POST['status_state'] ?? 'operational');
    $alertMessage = trim((string) ($_POST['alert_message'] ?? ''));
    $isVisible = isset($_POST['is_visible_to_public']) ? 1 : 0;

    if ($systemName === '') {
        return 'System name is required.';
    }
    if (!in_array($statusState, SERVICE_STATUS_STATES, true)) {
        return 'Invalid status value.';
    }

    $data = [
        'system_name' => $systemName,
        'status_state' => $statusState,
        'alert_message' => $alertMessage !== '' ? $alertMessage : null,
        'is_visible_to_public' => $isVisible,
    ];

    if ($id !== null) {
        dbUpdate('service_status', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('service_status', $data);
    }

    return null;
}

function renderStatusSection(string $selfUrl, ?string $statusFormError): string
{
    $statusEntries = dbFetchAll('SELECT * FROM service_status ORDER BY updated_at DESC');

    $rows = $statusEntries === []
        ? '<tr><td colspan="5" class="muted">No service status entries yet.</td></tr>'
        : '';
    foreach ($statusEntries as $s) {
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $s['system_name']) . '</td>'
            . '<td><span class="badge badge-' . htmlspecialchars((string) $s['status_state']) . '">' . htmlspecialchars((string) $s['status_state']) . '</span></td>'
            . '<td>' . htmlspecialchars((string) ($s['alert_message'] ?? '')) . '</td>'
            . '<td>' . ((int) $s['is_visible_to_public'] === 1 ? 'Visible' : 'Hidden') . '</td>'
            . '<td><button class="btn btn-outline" type="button" onclick="'
            . "document.getElementById('sf_id').value='" . (int) $s['id'] . "';"
            . "document.getElementById('sf_name').value=" . json_encode((string) $s['system_name']) . ";"
            . "document.getElementById('sf_state').value=" . json_encode((string) $s['status_state']) . ";"
            . "document.getElementById('sf_msg').value=" . json_encode((string) ($s['alert_message'] ?? '')) . ";"
            . "document.getElementById('sf_visible').checked=" . ((int) $s['is_visible_to_public'] === 1 ? 'true' : 'false') . ";"
            . '">Edit</button></td>'
            . '</tr>';
    }

    $stateOptions = '';
    foreach (SERVICE_STATUS_STATES as $state) {
        $stateOptions .= '<option value="' . htmlspecialchars($state) . '">' . htmlspecialchars($state) . '</option>';
    }

    $errorHtml = $statusFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($statusFormError) . '</p>' : '';

    return '
    <div class="card">
      <h2>Service Status Hub</h2>
      <table>
        <thead><tr><th>System</th><th>Status</th><th>Message</th><th>Public?</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit Entry</h2>
      ' . $errorHtml . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=status') . '">
        <input type="hidden" name="intent" value="save_status">
        <input type="hidden" name="id" id="sf_id" value="">
        <div class="field">
          <label>System name</label>
          <input type="text" name="system_name" id="sf_name" required>
        </div>
        <div class="field">
          <label>Status</label>
          <select name="status_state" id="sf_state">' . $stateOptions . '</select>
        </div>
        <div class="field">
          <label>Alert message (optional)</label>
          <input type="text" name="alert_message" id="sf_msg" maxlength="255">
        </div>
        <div class="field">
          <label><input type="checkbox" name="is_visible_to_public" id="sf_visible" checked style="width:auto;"> Visible on public status banner</label>
        </div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}
