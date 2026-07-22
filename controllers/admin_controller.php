<?php
declare(strict_types=1);

const SERVICE_STATUS_STATES = ['operational', 'degraded', 'down'];

const ADMIN_SECTIONS = [
    'dashboard' => 'Dashboard',
    'tickets' => 'All Tickets',
    'departments' => 'Departments',
    'users' => 'Users',
    'team' => 'Team KPIs',
    'status' => 'Service Status',
    'reports' => 'Reports',
    'kb' => 'Knowledge Base',
    'faq' => 'FAQ',
    'types' => 'Request Types',
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

    $kbFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_kb_article') {
        $kbFormError = applySaveKbArticleAdmin();
        if ($kbFormError === null) {
            header('Location: ' . $selfUrl . '?section=kb');
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_kb_article') {
        $handled = handleDeleteKbArticleAdmin($selfUrl);
        if ($handled) {
            return; // confirmation screen rendered, or already redirected after real deletion
        }
    }

    $faqFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_faq_item') {
        $faqFormError = applySaveFaqItemAdmin();
        if ($faqFormError === null) {
            header('Location: ' . $selfUrl . '?section=faq');
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_faq_item') {
        $handled = handleDeleteFaqItemAdmin($selfUrl);
        if ($handled) {
            return;
        }
    }

    $typeFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_request_type') {
        $typeFormError = applySaveRequestTypeAdmin();
        if ($typeFormError === null) {
            header('Location: ' . $selfUrl . '?section=types');
            exit;
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_request_type') {
        if (handleDeleteRequestTypeAdmin($selfUrl)) {
            return;
        }
    }

    $typeFieldFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_request_type_field') {
        $typeFieldFormError = applySaveRequestTypeFieldAdmin();
        if ($typeFieldFormError === null) {
            header('Location: ' . $selfUrl . '?section=types');
            exit;
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_request_type_field') {
        if (handleDeleteRequestTypeFieldAdmin($selfUrl)) {
            return;
        }
    }

    // Export/print formats bypass the admin shell entirely (T032 CSV, T033 print) — a report
    // export is a file download or a standalone printable page, not a section inside the nav.
    if ($section === 'reports') {
        $reportFilters = getReportFilters();
        $format = (string) ($_GET['format'] ?? '');
        if ($format === 'csv') {
            exportTicketsReportCsv($reportFilters);
            return;
        }
        if ($format === 'print') {
            renderPage('Ticket Report', renderTicketsReportPrintView($reportFilters));
            return;
        }

        // T062 — the same 6 stat cards as the dashboard, scoped to this report's own filters
        // (date range + optional department/status), not the whole system.
        $reportWhere = 'created_at >= :from AND created_at < DATE_ADD(:to, INTERVAL 1 DAY)';
        $reportParams = ['from' => $reportFilters['from'], 'to' => $reportFilters['to']];
        if ($reportFilters['department_id'] !== null) {
            $reportWhere .= ' AND department_id = :dept_id';
            $reportParams['dept_id'] = $reportFilters['department_id'];
        }
        if ($reportFilters['status'] !== '') {
            $reportWhere .= ' AND status = :status';
            $reportParams['status'] = $reportFilters['status'];
        }
        $reportStats = computeTicketStats($reportWhere, $reportParams);
    }

    $sectionContent = match ($section) {
        'departments' => renderDepartmentsSection($selfUrl, $deptFormError),
        'users' => renderUsersSection($selfUrl, $userFormError),
        'status' => renderStatusSection($selfUrl, $statusFormError),
        'reports' => renderReportsSection($selfUrl, $reportFilters, $reportStats),
        'kb' => renderKbSection($selfUrl, $kbFormError),
        'faq' => renderFaqSection($selfUrl, $faqFormError),
        'types' => renderRequestTypesSection($selfUrl, $typeFormError, $typeFieldFormError),
        'settings' => renderSettingsSection($selfUrl, $settingsFormError),
        'tickets' => renderAdminTicketsSection($selfUrl),
        'team' => renderTeamKpiSection(),
        default => renderDashboardSection($selfUrl, $viewAsError),
    };

    renderPage('Admin', renderAdminShell($section, $user, $selfUrl, $sectionContent));
}

const ADMIN_NAV_ICONS = [
    'dashboard' => '⬡',
    'tickets' => '☰',
    'departments' => '◆',
    'users' => '◎',
    'team' => '★',
    'status' => '◉',
    'reports' => '▦',
    'kb' => '▤',
    'faq' => '◈',
    'types' => '▧',
    'settings' => '⊙',
];

// T041 — sidebar shell replaces the old top button-row nav; ADMIN_SECTIONS is still the single
// source of truth for what sections exist, just rendered as sidebar items instead of buttons.
function renderAdminShell(string $activeSection, array $user, string $selfUrl, string $sectionContent): string
{
    $navItems = [];
    foreach (ADMIN_SECTIONS as $key => $label) {
        $navItems[] = [
            'key' => $key,
            'label' => $label,
            'href' => $key === 'dashboard' ? $selfUrl : $selfUrl . '?section=' . $key,
            'icon' => ADMIN_NAV_ICONS[$key] ?? '•',
            'badge' => null,
        ];
    }

    $content = '
    <main class="container">
      <h1>' . htmlspecialchars(ADMIN_SECTIONS[$activeSection] ?? 'Admin') . '</h1>
      ' . $sectionContent . '
    </main>';

    return renderSidebarShell(
        $activeSection,
        $navItems,
        (string) $user['name'],
        'Super Admin',
        $selfUrl . '?logout=1',
        url(''),
        $content
    );
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
             ' . csrfField() . '
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

// ── T060 — superadmin cross-department tickets dashboard ─────────────────────────────────────
// Same analytics.php building blocks as a single department's dashboard, but scoped to '1=1'
// (or narrowed by the department/priority/status filters below) instead of one department's
// $where — this is the one place in the app a non-View-As superadmin sees every ticket at once.
function renderAdminTicketsSection(string $selfUrl): string
{
    $tabUrl = $selfUrl . '?section=tickets';

    $departmentFilter = isset($_GET['department_id']) && ctype_digit((string) $_GET['department_id']) ? (int) $_GET['department_id'] : null;
    $priorityFilter = (string) ($_GET['priority'] ?? '');
    if (!in_array($priorityFilter, PRIORITY_LEVELS, true)) {
        $priorityFilter = '';
    }
    $statusFilter = (string) ($_GET['status'] ?? '');
    if (!in_array($statusFilter, VALID_TICKET_STATUSES, true)) {
        $statusFilter = '';
    }

    // Qualified as tickets.department_id, not bare — this $where is also reused by
    // fetchRecentTickets() below, whose query LEFT JOINs users (which has its own department_id),
    // so an unqualified column name here would be ambiguous the moment a department filter is set
    // (same class of bug as F004/F005 — see _brain/fixes/fix_log.md).
    $where = '1=1';
    $params = [];
    if ($departmentFilter !== null) {
        $where .= ' AND tickets.department_id = :dept_id';
        $params['dept_id'] = $departmentFilter;
    }
    if ($priorityFilter !== '') {
        $where .= ' AND priority = :priority';
        $params['priority'] = $priorityFilter;
    }
    if ($statusFilter !== '') {
        $where .= ' AND status = :status';
        $params['status'] = $statusFilter;
    }

    $stats = computeTicketStats($where, $params);
    $statusBreakdown = fetchStatusBreakdown($where, $params);
    $priorityBreakdown = fetchPriorityBreakdown($where, $params);
    $chartRange = resolveChartRangeFromRequest();
    $chartSeries = fetchTicketsCreatedSeries($where, $params, $chartRange);

    $page = isset($_GET['page']) && ctype_digit((string) $_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $perPage = DASHBOARD_PAGE_SIZE;
    $offset = ($page - 1) * $perPage;
    $total = (int) (dbFetchOne("SELECT COUNT(*) AS cnt FROM tickets WHERE $where", $params)['cnt'] ?? 0);
    $tickets = dbFetchAll(
        "SELECT tickets.id, subject, status, priority, tickets.created_at, u.name AS assigned_name, d.name AS dept_name, d.slug AS dept_slug
         FROM tickets
         LEFT JOIN users u ON u.id = tickets.assigned_to
         LEFT JOIN departments d ON d.id = tickets.department_id
         WHERE $where ORDER BY tickets.created_at DESC LIMIT $perPage OFFSET $offset",
        $params
    );

    $departments = dbFetchAll('SELECT id, name, slug FROM departments ORDER BY name');
    $deptOptions = '<option value="">All departments</option>';
    foreach ($departments as $d) {
        $selected = $departmentFilter === (int) $d['id'] ? ' selected' : '';
        $deptOptions .= '<option value="' . (int) $d['id'] . '"' . $selected . '>' . htmlspecialchars((string) $d['name']) . '</option>';
    }
    $priorityOptions = '<option value="">All priorities</option>';
    foreach (PRIORITY_LEVELS as $priority) {
        $selected = $priorityFilter === $priority ? ' selected' : '';
        $priorityOptions .= '<option value="' . htmlspecialchars($priority) . '"' . $selected . '>' . htmlspecialchars(ucfirst($priority)) . '</option>';
    }
    $statusOptions = '<option value="">All statuses</option>';
    foreach (VALID_TICKET_STATUSES as $status) {
        $selected = $statusFilter === $status ? ' selected' : '';
        $statusOptions .= '<option value="' . htmlspecialchars($status) . '"' . $selected . '>' . htmlspecialchars($status) . '</option>';
    }

    // requireDepartmentAccess() lets a superadmin (not in View-As mode) into ANY department's
    // ticket page, so linking straight into department_controller.php's own detail view works
    // here without a separate admin-side ticket page to maintain.
    $recentTickets = fetchRecentTickets($where, $params, 8);
    $recentHtml = renderRecentTicketsList($recentTickets, static fn(array $t): string => url((string) $t['dept_slug'] . '/ticket/' . (int) $t['id']), true);

    $rows = $tickets === []
        ? '<tr><td colspan="7" class="muted">No tickets match these filters.</td></tr>'
        : '';
    foreach ($tickets as $t) {
        $badgeClass = 'badge-' . str_replace('_', '-', (string) $t['status']);
        $ticketUrl = url((string) $t['dept_slug'] . '/ticket/' . (int) $t['id']);
        $rows .= '<tr>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">#' . (int) $t['id'] . '</a></td>'
            . '<td>' . htmlspecialchars((string) ($t['dept_name'] ?? '—')) . '</td>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">' . htmlspecialchars((string) $t['subject']) . '</a></td>'
            . '<td><span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $t['status']) . '</span></td>'
            . '<td>' . htmlspecialchars((string) $t['priority']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($t['assigned_name'] ?? 'Unassigned')) . '</td>'
            . '<td class="muted">' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '</tr>';
    }

    $filterQueryParts = array_filter([
        'section' => 'tickets',
        'department_id' => $departmentFilter,
        'priority' => $priorityFilter,
        'status' => $statusFilter,
    ], static fn($v): bool => $v !== null && $v !== '');
    $totalPages = max(1, (int) ceil($total / $perPage));
    $pagerHtml = $totalPages > 1
        ? '<div style="display:flex; gap:.5rem; align-items:center; margin-top:1rem;">'
            . ($page > 1 ? '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?' . http_build_query($filterQueryParts + ['page' => $page - 1])) . '">Previous</a>' : '')
            . '<span class="muted">Page ' . $page . ' of ' . $totalPages . ' (' . $total . ' tickets)</span>'
            . ($page < $totalPages ? '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?' . http_build_query($filterQueryParts + ['page' => $page + 1])) . '">Next</a>' : '')
            . '</div>'
        : '<p class="muted" style="margin-top:1rem;">' . $total . ' ticket' . ($total === 1 ? '' : 's') . '</p>';

    return '
    ' . renderDashboardDateSubtitle() . '
    ' . renderStatCardsHtml($stats) . '
    <div class="analytics-row">
      <div class="card chart-card-wide">
        ' . renderTicketsCreatedChart($tabUrl, $filterQueryParts, $chartRange, $chartSeries) . '
      </div>
      <div class="card chart-card-narrow">
        <h3 class="chart-title">By Status</h3>
        <p class="muted chart-subtitle">Ticket distribution</p>
        ' . renderStatusPieChart($statusBreakdown) . '
      </div>
    </div>
    <div class="analytics-row">
      <div class="card chart-card-wide">
        <h3 class="chart-title">By Priority</h3>
        <p class="muted chart-subtitle">Ticket breakdown</p>
        ' . renderPriorityBarChart($priorityBreakdown) . '
      </div>
      <div class="card chart-card-narrow">
        <h3 class="chart-title">Recent Tickets</h3>
        <p class="muted chart-subtitle">Latest activity, all departments</p>
        ' . $recentHtml . '
      </div>
    </div>
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
        <form method="get" action="' . htmlspecialchars($selfUrl) . '" style="display:flex; flex-wrap:wrap; gap:.75rem; align-items:flex-end;">
          <input type="hidden" name="section" value="tickets">
          <div class="field" style="margin-bottom:0; width:180px;"><label>Department</label><select name="department_id" onchange="this.form.submit()">' . $deptOptions . '</select></div>
          <div class="field" style="margin-bottom:0; width:160px;"><label>Priority</label><select name="priority" onchange="this.form.submit()">' . $priorityOptions . '</select></div>
          <div class="field" style="margin-bottom:0; width:160px;"><label>Status</label><select name="status" onchange="this.form.submit()">' . $statusOptions . '</select></div>
          <button class="btn btn-outline" type="submit" style="padding:.5rem 1rem;">Apply</button>
        </form>
      </div>
      <table style="margin-top:1rem;">
        <thead><tr><th>ID</th><th>Department</th><th>Title</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Created</th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>
      ' . $pagerHtml . '
    </div>';
}

// ── T065 — per-agent KPI, superadmin-only. Reachable only through handleAdminRoute() (already
// gated on requireSuperadmin() before $section is read), and there is no equivalent link anywhere
// in department_controller.php's agent-facing sidebar — hidden from agents by construction, not
// just by convention.
function renderTeamKpiSection(): string
{
    $rows = dbFetchAll(
        "SELECT u.id, u.name, d.name AS dept_name,
                COUNT(t.id) AS total_assigned,
                SUM(t.status IN ('open','in_progress','on-hold')) AS active_count,
                SUM(t.status = 'closed') AS closed_count,
                SUM(t.status NOT IN ('closed','cancelled') AND t.sla_deadline IS NOT NULL AND t.sla_deadline < NOW()) AS breached_count,
                AVG(CASE WHEN t.status = 'closed' THEN TIMESTAMPDIFF(HOUR, t.created_at, t.updated_at) END) AS avg_resolution_hours
         FROM users u
         LEFT JOIN departments d ON d.id = u.department_id
         LEFT JOIN tickets t ON t.assigned_to = u.id
         WHERE u.role = 'agent'
         GROUP BY u.id, u.name, d.name
         ORDER BY d.name, u.name"
    );

    if ($rows === []) {
        return '<div class="card"><p class="muted">No agents yet.</p></div>';
    }

    $tableRows = '';
    foreach ($rows as $r) {
        $avgHours = $r['avg_resolution_hours'] !== null ? round((float) $r['avg_resolution_hours'], 1) . ' hrs' : '—';
        $breached = (int) $r['breached_count'];
        $tableRows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $r['name']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($r['dept_name'] ?? '—')) . '</td>'
            . '<td>' . (int) $r['total_assigned'] . '</td>'
            . '<td>' . (int) $r['active_count'] . '</td>'
            . '<td>' . (int) $r['closed_count'] . '</td>'
            . '<td' . ($breached > 0 ? ' class="text-destructive" style="font-weight:600;"' : '') . '>' . $breached . '</td>'
            . '<td>' . $avgHours . '</td>'
            . '</tr>';
    }

    return '
    <div class="card">
      <h2>Agent Performance</h2>
      <p class="muted">Visible only to superadmins — never surfaced on an agent\'s own department dashboard.</p>
      <table style="margin-top:1rem;">
        <thead><tr><th>Agent</th><th>Department</th><th>Total Assigned</th><th>Active</th><th>Closed</th><th>Currently Breached</th><th>Avg Resolution</th></tr></thead>
        <tbody>' . $tableRows . '</tbody>
      </table>
    </div>';
}

// ── Placeholders filled in by later tasks in this same phase ─────────────────────────────────

// ── Department CRUD (T028) ────────────────────────────────────────────────────────────────────

function applySaveDepartment(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $name = trim((string) ($_POST['name'] ?? ''));
    $slug = strtolower(trim((string) ($_POST['slug'] ?? '')));
    $description = trim((string) ($_POST['description'] ?? ''));
    $autoAssignEnabled = isset($_POST['auto_assign_enabled']) ? 1 : 0;

    if ($name === '') {
        return 'Name is required.';
    }
    if ($slug === '' || !preg_match('/^[a-z0-9-]+$/', $slug)) {
        return 'Slug must be lowercase letters, numbers, and hyphens only.';
    }
    if (in_array($slug, ['admin', 'account'], true)) {
        return '"' . $slug . '" is a reserved slug (it would collide with a built-in route).';
    }

    $existing = dbFetchOne('SELECT id FROM departments WHERE slug = :slug', ['slug' => $slug]);
    if ($existing !== null && ($id === null || (int) $existing['id'] !== $id)) {
        return 'That slug is already in use by another department.';
    }

    $data = ['name' => $name, 'slug' => $slug, 'description' => $description !== '' ? $description : null, 'auto_assign_enabled' => $autoAssignEnabled];
    if ($id !== null) {
        dbUpdate('departments', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('departments', $data);
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
        "SELECT d.id, d.name, d.slug, d.description, d.auto_assign_enabled, (SELECT COUNT(*) FROM tickets t WHERE t.department_id = d.id) AS ticket_count
         FROM departments d ORDER BY d.name"
    );

    $rows = $departments === []
        ? '<tr><td colspan="5" class="muted">No departments yet.</td></tr>'
        : '';
    foreach ($departments as $d) {
        // The whole JS snippet is escaped as ONE unit via htmlspecialchars() before landing inside
        // onclick="..." — json_encode()'s own double-quotes would otherwise prematurely close the
        // HTML attribute (its delimiter is also "), truncating the handler. htmlspecialchars()
        // turns those into &quot;, which the browser decodes back to " before JS ever sees it.
        $editJs = "document.getElementById('dp_id').value='" . (int) $d['id'] . "';"
            . "document.getElementById('dp_name').value=" . json_encode((string) $d['name']) . ";"
            . "document.getElementById('dp_slug').value=" . json_encode((string) $d['slug']) . ";"
            . "document.getElementById('dp_description').value=" . json_encode((string) ($d['description'] ?? '')) . ";"
            . "document.getElementById('dp_auto_assign').checked=" . ((int) $d['auto_assign_enabled'] === 1 ? 'true' : 'false') . ";";
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $d['name']) . '</td>'
            . '<td><code>' . htmlspecialchars((string) $d['slug']) . '</code></td>'
            . '<td>' . (int) $d['ticket_count'] . '</td>'
            . '<td>' . ((int) $d['auto_assign_enabled'] === 1 ? 'On' : 'Off') . '</td>'
            . '<td>'
            . '<button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button> '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . csrfField()
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
        <thead><tr><th>Name</th><th>Slug</th><th>Tickets</th><th>Auto-assign</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit Department</h2>
      ' . ($deptFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($deptFormError) . '</p>' : '') . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=departments') . '">
        ' . csrfField() . '
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
        <div class="field">
          <label>Description (shown to requestors on the portal picker)</label>
          <textarea name="description" id="dp_description" rows="2" placeholder="e.g. IT support, hardware, and account access requests."></textarea>
        </div>
        <div class="field">
          <label><input type="checkbox" name="auto_assign_enabled" id="dp_auto_assign" style="width:auto;"> Auto-assign new tickets to the least-loaded eligible agent</label>
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
    // T050 — "online" computed live (last_seen_at within 5 minutes), never trusted as a permanent
    // flag: is_online is only ever set to 1 (auth.php's updateUserPresence()), nothing sets it
    // back to 0 when someone leaves, so the stored column alone would show everyone who ever
    // logged in as perpetually online. Computed in SQL against MySQL's own NOW(), matching how
    // last_seen_at was written — see auth.php's comment on why (F002 clock-mismatch precedent).
    $users = dbFetchAll(
        "SELECT u.*, d.name AS dept_name,
                (u.last_seen_at IS NOT NULL AND u.last_seen_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)) AS is_online_live
         FROM users u LEFT JOIN departments d ON d.id = u.department_id
         ORDER BY u.role, dept_name, u.name"
    );
    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');

    $rows = $users === [] ? '<tr><td colspan="7" class="muted">No users yet.</td></tr>' : '';
    foreach ($users as $u) {
        $deactivated = str_starts_with((string) $u['password_hash'], DEACTIVATED_PASSWORD_PREFIX);
        $viewAsBtn = ($u['role'] === 'agent' && !$deactivated)
            ? '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
                . csrfField()
                . '<input type="hidden" name="intent" value="start_view_as">'
                . '<input type="hidden" name="agent_id" value="' . (int) $u['id'] . '">'
                . '<button class="btn btn-outline" type="submit">View As</button></form>'
            : '';
        $editJs = "document.getElementById('us_id').value='" . (int) $u['id'] . "';"
            . "document.getElementById('us_name').value=" . json_encode((string) $u['name']) . ";"
            . "document.getElementById('us_email').value=" . json_encode((string) $u['email']) . ";"
            . "document.getElementById('us_role').value=" . json_encode((string) $u['role']) . ";"
            . "document.getElementById('us_dept').value=" . json_encode($u['department_id'] !== null ? (string) (int) $u['department_id'] : '') . ";"
            . "document.getElementById('us_can_accept').checked=" . ((int) $u['can_accept_tickets'] === 1 ? 'true' : 'false') . ";";
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $u['name']) . ($deactivated ? ' <span class="badge badge-cancelled">deactivated</span>' : '') . '</td>'
            . '<td>' . htmlspecialchars((string) $u['email']) . '</td>'
            . '<td>' . htmlspecialchars((string) $u['role']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($u['dept_name'] ?? '—')) . '</td>'
            . '<td>' . ((int) $u['can_accept_tickets'] === 1 ? 'Yes' : 'No') . '</td>'
            . '<td>' . ((int) $u['is_online_live'] === 1 ? '<span class="badge badge-operational">Online</span>' : 'Offline') . ($u['last_seen_at'] !== null ? ' <span class="muted" style="font-size:.8rem;">(' . htmlspecialchars((string) $u['last_seen_at']) . ')</span>' : '') . '</td>'
            . '<td>'
            . '<button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button> '
            . $viewAsBtn . ' '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . csrfField()
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
        ' . csrfField() . '
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
        $editJs = "document.getElementById('sg_key').value=" . json_encode((string) $s['config_key']) . ";"
            . "document.getElementById('sg_value').value=" . json_encode((string) ($s['config_value'] ?? '')) . ";"
            . "document.getElementById('sg_enabled').checked=" . ((int) $s['is_enabled'] === 1 ? 'true' : 'false') . ";";
        $rows .= '<tr>'
            . '<td><code>' . htmlspecialchars((string) $s['config_key']) . '</code></td>'
            . '<td>' . htmlspecialchars((string) ($s['config_value'] ?? '')) . '</td>'
            . '<td>' . ((int) $s['is_enabled'] === 1 ? 'ON' : 'off') . '</td>'
            . '<td><button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button></td>'
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
        ' . csrfField() . '
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
        $editJs = "document.getElementById('sf_id').value='" . (int) $s['id'] . "';"
            . "document.getElementById('sf_name').value=" . json_encode((string) $s['system_name']) . ";"
            . "document.getElementById('sf_state').value=" . json_encode((string) $s['status_state']) . ";"
            . "document.getElementById('sf_msg').value=" . json_encode((string) ($s['alert_message'] ?? '')) . ";"
            . "document.getElementById('sf_visible').checked=" . ((int) $s['is_visible_to_public'] === 1 ? 'true' : 'false') . ";";
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $s['system_name']) . '</td>'
            . '<td><span class="badge badge-' . htmlspecialchars((string) $s['status_state']) . '">' . htmlspecialchars((string) $s['status_state']) . '</span></td>'
            . '<td>' . htmlspecialchars((string) ($s['alert_message'] ?? '')) . '</td>'
            . '<td>' . ((int) $s['is_visible_to_public'] === 1 ? 'Visible' : 'Hidden') . '</td>'
            . '<td><button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button></td>'
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
        ' . csrfField() . '
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

// ── Reporting (T032 CSV export, T033 print/PDF report) ────────────────────────────────────────
// Both export formats and the in-app preview below share one filter set and one query, so the
// three can never drift out of sync with each other.

/**
 * @return array{department_id:?int, status:string, from:string, to:string}
 */
function getReportFilters(): array
{
    $departmentId = isset($_GET['department_id']) && ctype_digit((string) $_GET['department_id']) ? (int) $_GET['department_id'] : null;

    $status = (string) ($_GET['status'] ?? '');
    if (!in_array($status, VALID_TICKET_STATUSES, true)) {
        $status = '';
    }

    // Malformed/missing dates fall back to "this month to today" (same default as the legacy
    // report), rather than erroring — a report filter is not a place to be strict about input.
    $from = (string) ($_GET['from'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
        $from = date('Y-m-01');
    }
    $to = (string) ($_GET['to'] ?? '');
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        $to = date('Y-m-d');
    }

    return ['department_id' => $departmentId, 'status' => $status, 'from' => $from, 'to' => $to];
}

/**
 * @param array{department_id:?int, status:string, from:string, to:string} $filters
 * @return array<int,array<string,mixed>>
 */
function fetchReportTickets(array $filters): array
{
    // Date-range bounds only (calendar days from the filter form), never compared against
    // NOW() — so this doesn't run into the PHP/MySQL timezone drift documented for T018/T020.
    $where = ['t.created_at >= :from', 't.created_at < DATE_ADD(:to, INTERVAL 1 DAY)'];
    $params = ['from' => $filters['from'], 'to' => $filters['to']];

    if ($filters['department_id'] !== null) {
        $where[] = 't.department_id = :dept_id';
        $params['dept_id'] = $filters['department_id'];
    }
    if ($filters['status'] !== '') {
        $where[] = 't.status = :status';
        $params['status'] = $filters['status'];
    }

    return dbFetchAll(
        'SELECT t.id, t.requestor_email, t.team_leader_name, t.client_name, t.subject, t.description,
                t.status, t.priority, t.created_at, t.updated_at, d.name AS department_name, u.name AS assigned_name,
                (SELECT a.new_value FROM audit_logs a
                 WHERE a.ticket_id = t.id AND a.action_type = "RESOLUTION_SUMMARY"
                 ORDER BY a.timestamp DESC, a.id DESC LIMIT 1) AS resolution_summary
         FROM tickets t
         LEFT JOIN departments d ON d.id = t.department_id
         LEFT JOIN users u ON u.id = t.assigned_to
         WHERE ' . implode(' AND ', $where) . '
         ORDER BY t.created_at',
        $params
    );
}

// Superadmin-only by construction — only reachable through handleAdminRoute(), which already
// gated on requireSuperadmin() before $section is ever read.
function exportTicketsReportCsv(array $filters): void
{
    $tickets = fetchReportTickets($filters);

    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="tickets_' . $filters['from'] . '_to_' . $filters['to'] . '.csv"');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['Ticket ID', 'Department', 'Requestor Email', 'Team Leader', 'Client', 'Title', 'Description', 'Status', 'Priority', 'Assigned To', 'Created', 'Updated', 'Resolution Summary']);
    foreach ($tickets as $t) {
        fputcsv($out, [
            $t['id'],
            $t['department_name'] ?? 'Unassigned',
            $t['requestor_email'],
            $t['team_leader_name'],
            $t['client_name'],
            $t['subject'],
            $t['description'],
            $t['status'],
            $t['priority'],
            $t['assigned_name'] ?? 'Unassigned',
            $t['created_at'],
            $t['updated_at'],
            $t['resolution_summary'] ?? '',
        ]);
    }
    fclose($out);
    exit;
}

// Standalone printable page — deliberately NOT passed through renderAdminShell(), so there is no
// admin nav/sidebar in the output; .no-print hides the on-screen print button itself when printed.
function renderTicketsReportPrintView(array $filters): string
{
    $tickets = fetchReportTickets($filters);

    $counts = array_fill_keys(VALID_TICKET_STATUSES, 0);
    foreach ($tickets as $t) {
        $counts[(string) $t['status']] = ($counts[(string) $t['status']] ?? 0) + 1;
    }
    $countsLine = '';
    foreach (VALID_TICKET_STATUSES as $status) {
        $countsLine .= htmlspecialchars($status) . ': ' . $counts[$status] . '&nbsp;&nbsp;';
    }

    $rows = $tickets === []
        ? '<tr><td colspan="7" class="muted">No tickets in this range.</td></tr>'
        : '';
    foreach ($tickets as $t) {
        $rows .= '<tr>'
            . '<td>#' . (int) $t['id'] . '</td>'
            . '<td>' . htmlspecialchars((string) ($t['department_name'] ?? 'Unassigned')) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['subject']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['team_leader_name']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['client_name']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['status']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($t['assigned_name'] ?? 'Unassigned')) . '</td>'
            . '<td>' . ($t['resolution_summary'] !== null ? nl2br(htmlspecialchars((string) $t['resolution_summary'])) : '—') . '</td>'
            . '</tr>';
    }

    return '
    <main class="container" style="max-width:960px;">
      <div class="no-print" style="margin-bottom:1rem;">
        <button class="btn" onclick="window.print()">Print / Save as PDF</button>
      </div>
      <h1>Ticket Report</h1>
      <p class="muted">' . htmlspecialchars($filters['from']) . ' to ' . htmlspecialchars($filters['to']) . ' &middot; '
        . count($tickets) . ' ticket(s) &middot; ' . $countsLine . '</p>
      <table>
        <thead><tr><th>ID</th><th>Dept</th><th>Title</th><th>Team Leader</th><th>Client</th><th>Status</th><th>Created</th><th>Assigned</th><th>Resolution Summary</th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>
      <style>@media print { .no-print { display: none; } }</style>
    </main>';
}

function renderReportsSection(string $selfUrl, array $filters, array $stats = []): string
{
    $tickets = fetchReportTickets($filters);
    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');

    $deptOptions = '<option value="">All departments</option>';
    foreach ($departments as $d) {
        $selected = $filters['department_id'] === (int) $d['id'] ? ' selected' : '';
        $deptOptions .= '<option value="' . (int) $d['id'] . '"' . $selected . '>' . htmlspecialchars((string) $d['name']) . '</option>';
    }
    $statusOptions = '<option value="">All statuses</option>';
    foreach (VALID_TICKET_STATUSES as $status) {
        $selected = $filters['status'] === $status ? ' selected' : '';
        $statusOptions .= '<option value="' . htmlspecialchars($status) . '"' . $selected . '>' . htmlspecialchars($status) . '</option>';
    }

    $rows = $tickets === []
        ? '<tr><td colspan="6" class="muted">No tickets match these filters.</td></tr>'
        : '';
    foreach ($tickets as $t) {
        $rows .= '<tr>'
            . '<td>#' . (int) $t['id'] . '</td>'
            . '<td>' . htmlspecialchars((string) ($t['department_name'] ?? 'Unassigned')) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['subject']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['status']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($t['assigned_name'] ?? 'Unassigned')) . '</td>'
            . '</tr>';
    }

    $queryString = http_build_query(array_filter(
        [
            'section' => 'reports',
            'department_id' => $filters['department_id'],
            'status' => $filters['status'],
            'from' => $filters['from'],
            'to' => $filters['to'],
        ],
        fn($v): bool => $v !== null && $v !== ''
    ));

    return '
    ' . renderStatCardsHtml($stats) . '
    <div class="card" style="margin-bottom:1.5rem;">
      <h2>Filters</h2>
      <form method="get" action="' . htmlspecialchars($selfUrl) . '">
        <input type="hidden" name="section" value="reports">
        <div class="field"><label>Department</label><select name="department_id">' . $deptOptions . '</select></div>
        <div class="field"><label>Status</label><select name="status">' . $statusOptions . '</select></div>
        <div class="field"><label>From</label><input type="date" name="from" value="' . htmlspecialchars($filters['from']) . '"></div>
        <div class="field"><label>To</label><input type="date" name="to" value="' . htmlspecialchars($filters['to']) . '"></div>
        <button class="btn" type="submit">Apply Filters</button>
      </form>
    </div>
    <div class="card">
      <h2>Preview (' . count($tickets) . ' ticket(s))</h2>
      <p class="muted">
        <a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?' . $queryString . '&format=csv') . '">Export CSV</a>
        <a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?' . $queryString . '&format=print') . '" target="_blank">Print / PDF Report</a>
      </p>
      <table>
        <thead><tr><th>ID</th><th>Dept</th><th>Title</th><th>Status</th><th>Created</th><th>Assigned</th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>
    </div>';
}

// ── Knowledge base (T034) — superadmin can author for any department ─────────────────────────
// Separate function names from the department-agent versions in department_controller.php
// (same intent strings are fine — they're on different routes, dispatched by different handlers,
// so there's no runtime collision), but superadmin isn't locked to one department like an agent
// is, so the query/validation shape genuinely differs enough to not share the same function.

function applySaveKbArticleAdmin(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $title = trim((string) ($_POST['title'] ?? ''));
    $content = trim((string) ($_POST['content'] ?? ''));
    $departmentId = isset($_POST['department_id']) && ctype_digit((string) $_POST['department_id']) ? (int) $_POST['department_id'] : null;

    if ($title === '' || mb_strlen($title) > 255) {
        return 'Title is required (max 255 characters).';
    }
    if ($content === '') {
        return 'Content is required.';
    }
    if ($departmentId === null || dbFetchOne('SELECT id FROM departments WHERE id = :id', ['id' => $departmentId]) === null) {
        return 'Select a valid department.';
    }

    $data = ['title' => $title, 'content' => $content, 'department_id' => $departmentId];
    if ($id !== null) {
        dbUpdate('knowledge_base', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('knowledge_base', $data);
    }

    return null;
}

function handleDeleteKbArticleAdmin(string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $article = dbFetchOne('SELECT id, title FROM knowledge_base WHERE id = :id', ['id' => $id]);
    if ($article === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Delete Article?',
            'This will permanently delete "' . $article['title'] . '".',
            $selfUrl . '?section=kb',
            ['intent' => 'delete_kb_article', 'id' => $id]
        );
        return true;
    }

    dbDelete('knowledge_base', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl . '?section=kb');
    exit;
}

function renderKbSection(string $selfUrl, ?string $kbFormError): string
{
    $articles = dbFetchAll(
        'SELECT k.id, k.title, k.content, k.created_at, k.department_id, d.name AS dept_name
         FROM knowledge_base k LEFT JOIN departments d ON d.id = k.department_id
         ORDER BY d.name, k.created_at DESC'
    );
    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');

    $rows = $articles === [] ? '<tr><td colspan="4" class="muted">No articles yet.</td></tr>' : '';
    foreach ($articles as $a) {
        $editJs = "document.getElementById('kb_id').value='" . (int) $a['id'] . "';"
            . "document.getElementById('kb_title').value=" . json_encode((string) $a['title']) . ";"
            . "document.getElementById('kb_content').value=" . json_encode((string) $a['content']) . ";"
            . "document.getElementById('kb_dept').value=" . json_encode((string) (int) $a['department_id']) . ";";
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $a['title']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($a['dept_name'] ?? '—')) . '</td>'
            . '<td class="muted">' . htmlspecialchars((string) $a['created_at']) . '</td>'
            . '<td>'
            . '<button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button> '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . csrfField()
            . '<input type="hidden" name="intent" value="delete_kb_article">'
            . '<input type="hidden" name="id" value="' . (int) $a['id'] . '">'
            . '<button class="btn btn-danger" type="submit">Delete</button>'
            . '</form>'
            . '</td>'
            . '</tr>';
    }

    $deptOptions = '';
    foreach ($departments as $d) {
        $deptOptions .= '<option value="' . (int) $d['id'] . '">' . htmlspecialchars((string) $d['name']) . '</option>';
    }

    $errorHtml = $kbFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($kbFormError) . '</p>' : '';

    return '
    <div class="card">
      <h2>Knowledge Base</h2>
      <table>
        <thead><tr><th>Title</th><th>Department</th><th>Created</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit Article</h2>
      ' . $errorHtml . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=kb') . '">
        ' . csrfField() . '
        <input type="hidden" name="intent" value="save_kb_article">
        <input type="hidden" name="id" id="kb_id" value="">
        <div class="field"><label>Title</label><input type="text" name="title" id="kb_title" maxlength="255" required></div>
        <div class="field"><label>Department</label><select name="department_id" id="kb_dept">' . $deptOptions . '</select></div>
        <div class="field"><label>Content</label><textarea name="content" id="kb_content" rows="6" required></textarea></div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}

// ── FAQ (T044) — superadmin can author for any department, same shape as the KB admin side ─────

function applySaveFaqItemAdmin(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $question = trim((string) ($_POST['question'] ?? ''));
    $answer = trim((string) ($_POST['answer'] ?? ''));
    $sortOrder = isset($_POST['sort_order']) && ctype_digit((string) $_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;
    $departmentId = isset($_POST['department_id']) && ctype_digit((string) $_POST['department_id']) ? (int) $_POST['department_id'] : null;

    if ($question === '' || mb_strlen($question) > 255) {
        return 'Question is required (max 255 characters).';
    }
    if ($answer === '') {
        return 'Answer is required.';
    }
    if ($departmentId === null || dbFetchOne('SELECT id FROM departments WHERE id = :id', ['id' => $departmentId]) === null) {
        return 'Select a valid department.';
    }

    $data = ['question' => $question, 'answer' => $answer, 'sort_order' => $sortOrder, 'department_id' => $departmentId];
    if ($id !== null) {
        dbUpdate('faq_items', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('faq_items', $data);
    }

    return null;
}

function handleDeleteFaqItemAdmin(string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $item = dbFetchOne('SELECT id, question FROM faq_items WHERE id = :id', ['id' => $id]);
    if ($item === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Delete FAQ Item?',
            'This will permanently delete "' . $item['question'] . '".',
            $selfUrl . '?section=faq',
            ['intent' => 'delete_faq_item', 'id' => $id]
        );
        return true;
    }

    dbDelete('faq_items', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl . '?section=faq');
    exit;
}

function renderFaqSection(string $selfUrl, ?string $faqFormError): string
{
    $items = dbFetchAll(
        'SELECT f.id, f.question, f.answer, f.sort_order, f.department_id, d.name AS dept_name
         FROM faq_items f LEFT JOIN departments d ON d.id = f.department_id
         ORDER BY d.name, f.sort_order, f.id'
    );
    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');

    $rows = $items === [] ? '<tr><td colspan="5" class="muted">No FAQ items yet.</td></tr>' : '';
    foreach ($items as $item) {
        $editJs = "document.getElementById('faq_id').value='" . (int) $item['id'] . "';"
            . "document.getElementById('faq_question').value=" . json_encode((string) $item['question']) . ";"
            . "document.getElementById('faq_answer').value=" . json_encode((string) $item['answer']) . ";"
            . "document.getElementById('faq_sort_order').value='" . (int) $item['sort_order'] . "';"
            . "document.getElementById('faq_dept').value=" . json_encode((string) (int) $item['department_id']) . ";";
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $item['question']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($item['dept_name'] ?? '—')) . '</td>'
            . '<td>' . (int) $item['sort_order'] . '</td>'
            . '<td>'
            . '<button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button> '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . csrfField()
            . '<input type="hidden" name="intent" value="delete_faq_item">'
            . '<input type="hidden" name="id" value="' . (int) $item['id'] . '">'
            . '<button class="btn btn-danger" type="submit">Delete</button>'
            . '</form>'
            . '</td>'
            . '</tr>';
    }

    $deptOptions = '';
    foreach ($departments as $d) {
        $deptOptions .= '<option value="' . (int) $d['id'] . '">' . htmlspecialchars((string) $d['name']) . '</option>';
    }

    $errorHtml = $faqFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($faqFormError) . '</p>' : '';

    return '
    <div class="card">
      <h2>FAQ</h2>
      <p class="muted">Shown publicly on the ticket submission form once a requestor picks a department.</p>
      <table>
        <thead><tr><th>Question</th><th>Department</th><th>Order</th><th></th></tr></thead>
        <tbody>' . $rows . '</tbody>
      </table>

      <h2 style="margin-top:1.5rem;">Add / Edit FAQ Item</h2>
      ' . $errorHtml . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=faq') . '">
        ' . csrfField() . '
        <input type="hidden" name="intent" value="save_faq_item">
        <input type="hidden" name="id" id="faq_id" value="">
        <div class="field"><label>Question</label><input type="text" name="question" id="faq_question" maxlength="255" required></div>
        <div class="field"><label>Department</label><select name="department_id" id="faq_dept">' . $deptOptions . '</select></div>
        <div class="field"><label>Answer</label><textarea name="answer" id="faq_answer" rows="4" required></textarea></div>
        <div class="field"><label>Order (lower shows first)</label><input type="number" name="sort_order" id="faq_sort_order" value="0" min="0"></div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}

// ── Request Types (T045) — superadmin can author for any department, unscoped like the KB/FAQ
// admin sides. Field mutations still verify the field/type chain exists, just not restricted to
// one department the way the department-agent side is.

function applySaveRequestTypeAdmin(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $departmentId = isset($_POST['department_id']) && ctype_digit((string) $_POST['department_id']) ? (int) $_POST['department_id'] : null;
    $name = trim((string) ($_POST['name'] ?? ''));
    $icon = trim((string) ($_POST['icon'] ?? ''));
    $sortOrder = isset($_POST['sort_order']) && ctype_digit((string) $_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

    if ($departmentId === null || dbFetchOne('SELECT id FROM departments WHERE id = :id', ['id' => $departmentId]) === null) {
        return 'Select a valid department.';
    }
    if ($name === '' || mb_strlen($name) > 150) {
        return 'Name is required (max 150 characters).';
    }
    if ($icon === '') {
        $icon = '🎫'; // PHP-side default — see database.sql's comment on request_types.icon
    }
    $icon = mb_substr($icon, 0, 8);

    $data = ['department_id' => $departmentId, 'name' => $name, 'icon' => $icon, 'sort_order' => $sortOrder];
    if ($id !== null) {
        dbUpdate('request_types', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('request_types', $data);
    }

    return null;
}

function handleDeleteRequestTypeAdmin(string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $type = dbFetchOne('SELECT id, name FROM request_types WHERE id = :id', ['id' => $id]);
    if ($type === null) {
        return false;
    }

    if (!isConfirmed()) {
        $fieldCount = (int) (dbFetchOne('SELECT COUNT(*) AS cnt FROM request_type_fields WHERE request_type_id = :id', ['id' => $id])['cnt'] ?? 0);
        renderConfirmation(
            'Delete Request Type?',
            'This will permanently delete "' . $type['name'] . '" and its ' . $fieldCount . ' custom field(s).',
            $selfUrl . '?section=types',
            ['intent' => 'delete_request_type', 'id' => $id]
        );
        return true;
    }

    dbDelete('request_types', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl . '?section=types');
    exit;
}

function applySaveRequestTypeFieldAdmin(): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $requestTypeId = isset($_POST['request_type_id']) && ctype_digit((string) $_POST['request_type_id']) ? (int) $_POST['request_type_id'] : null;
    $label = trim((string) ($_POST['label'] ?? ''));
    $fieldKey = strtolower(trim((string) ($_POST['field_key'] ?? '')));
    $fieldType = (string) ($_POST['field_type'] ?? 'text');
    $isRequired = isset($_POST['is_required']) ? 1 : 0;
    $optionsRaw = trim((string) ($_POST['field_options'] ?? ''));
    $sortOrder = isset($_POST['sort_order']) && ctype_digit((string) $_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

    if ($requestTypeId === null || dbFetchOne('SELECT id FROM request_types WHERE id = :id', ['id' => $requestTypeId]) === null) {
        return 'Invalid request type.';
    }
    if ($label === '' || mb_strlen($label) > 150) {
        return 'Field label is required (max 150 characters).';
    }
    if ($fieldKey === '' || !preg_match('/^[a-z0-9_]+$/', $fieldKey)) {
        return 'Field key must be lowercase letters, numbers, and underscores only.';
    }
    if (!in_array($fieldType, REQUEST_FIELD_TYPES, true)) {
        return 'Invalid field type.';
    }

    $duplicateKey = dbFetchOne('SELECT id FROM request_type_fields WHERE request_type_id = :rt_id AND field_key = :key', ['rt_id' => $requestTypeId, 'key' => $fieldKey]);
    if ($duplicateKey !== null && ($id === null || (int) $duplicateKey['id'] !== $id)) {
        return 'That field key is already used by another field on this request type.';
    }

    $data = [
        'request_type_id' => $requestTypeId,
        'label' => $label,
        'field_key' => $fieldKey,
        'field_type' => $fieldType,
        'is_required' => $isRequired,
        'field_options' => $optionsRaw !== '' ? $optionsRaw : null,
        'sort_order' => $sortOrder,
    ];
    if ($id !== null) {
        dbUpdate('request_type_fields', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('request_type_fields', $data);
    }

    return null;
}

function handleDeleteRequestTypeFieldAdmin(string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $field = dbFetchOne('SELECT id, label FROM request_type_fields WHERE id = :id', ['id' => $id]);
    if ($field === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Delete Field?',
            'This will permanently delete the "' . $field['label'] . '" field.',
            $selfUrl . '?section=types',
            ['intent' => 'delete_request_type_field', 'id' => $id]
        );
        return true;
    }

    dbDelete('request_type_fields', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl . '?section=types');
    exit;
}

function renderRequestTypesSection(string $selfUrl, ?string $typeFormError, ?string $fieldFormError): string
{
    $types = dbFetchAll(
        'SELECT rt.id, rt.name, rt.icon, rt.sort_order, rt.department_id, d.name AS dept_name
         FROM request_types rt LEFT JOIN departments d ON d.id = rt.department_id
         ORDER BY d.name, rt.sort_order, rt.id'
    );
    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');

    $deptOptions = '';
    foreach ($departments as $d) {
        $deptOptions .= '<option value="' . (int) $d['id'] . '">' . htmlspecialchars((string) $d['name']) . '</option>';
    }
    $fieldTypeOptions = '';
    foreach (REQUEST_FIELD_TYPES as $ft) {
        $fieldTypeOptions .= '<option value="' . htmlspecialchars($ft) . '">' . htmlspecialchars($ft) . '</option>';
    }

    $typesHtml = $types === [] ? '<p class="muted">No request types yet.</p>' : '';
    foreach ($types as $type) {
        $typeId = (int) $type['id'];
        $fields = dbFetchAll(
            'SELECT id, label, field_key, field_type, is_required, field_options, sort_order FROM request_type_fields WHERE request_type_id = :rt_id ORDER BY sort_order, id',
            ['rt_id' => $typeId]
        );

        $fieldRows = $fields === [] ? '<tr><td colspan="5" class="muted">No custom fields yet.</td></tr>' : '';
        foreach ($fields as $field) {
            $editFieldJs = "document.getElementById('rtf_id_$typeId').value='" . (int) $field['id'] . "';"
                . "document.getElementById('rtf_label_$typeId').value=" . json_encode((string) $field['label']) . ";"
                . "document.getElementById('rtf_key_$typeId').value=" . json_encode((string) $field['field_key']) . ";"
                . "document.getElementById('rtf_type_$typeId').value=" . json_encode((string) $field['field_type']) . ";"
                . "document.getElementById('rtf_required_$typeId').checked=" . ((int) $field['is_required'] === 1 ? 'true' : 'false') . ";"
                . "document.getElementById('rtf_options_$typeId').value=" . json_encode((string) ($field['field_options'] ?? '')) . ";"
                . "document.getElementById('rtf_sort_$typeId').value='" . (int) $field['sort_order'] . "';";
            $fieldRows .= '<tr>'
                . '<td>' . htmlspecialchars((string) $field['label']) . '</td>'
                . '<td><code>' . htmlspecialchars((string) $field['field_key']) . '</code></td>'
                . '<td>' . htmlspecialchars((string) $field['field_type']) . '</td>'
                . '<td>' . ((int) $field['is_required'] === 1 ? 'Yes' : 'No') . '</td>'
                . '<td>'
                . '<button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editFieldJs) . '">Edit</button> '
                . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
                . csrfField()
                . '<input type="hidden" name="intent" value="delete_request_type_field">'
                . '<input type="hidden" name="id" value="' . (int) $field['id'] . '">'
                . '<button class="btn btn-danger" type="submit">Delete</button>'
                . '</form>'
                . '</td>'
                . '</tr>';
        }

        $editTypeJs = "document.getElementById('rt_id').value='" . $typeId . "';"
            . "document.getElementById('rt_name').value=" . json_encode((string) $type['name']) . ";"
            . "document.getElementById('rt_icon').value=" . json_encode((string) $type['icon']) . ";"
            . "document.getElementById('rt_dept').value=" . json_encode((string) (int) $type['department_id']) . ";"
            . "document.getElementById('rt_sort_order').value='" . (int) $type['sort_order'] . "';"
            . "document.getElementById('rt_form').scrollIntoView();";

        $typesHtml .= '
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 style="margin:0;">' . htmlspecialchars((string) $type['icon']) . ' ' . htmlspecialchars((string) $type['name'])
                . ' <span class="muted" style="font-size:.8rem; font-weight:400;">(' . htmlspecialchars((string) ($type['dept_name'] ?? '—')) . ')</span></h3>
            <div>
              <button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editTypeJs) . '">Edit</button>
              <form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
                . csrfField()
                . '<input type="hidden" name="intent" value="delete_request_type">
                <input type="hidden" name="id" value="' . $typeId . '">
                <button class="btn btn-danger" type="submit">Delete</button>
              </form>
            </div>
          </div>
          <table style="margin-top:1rem;">
            <thead><tr><th>Label</th><th>Key</th><th>Type</th><th>Required</th><th></th></tr></thead>
            <tbody>' . $fieldRows . '</tbody>
          </table>
          <h4 style="margin-top:1rem;">Add / Edit Field</h4>
          <form method="post" action="' . htmlspecialchars($selfUrl . '?section=types') . '">'
            . csrfField()
            . '<input type="hidden" name="intent" value="save_request_type_field">
            <input type="hidden" name="request_type_id" value="' . $typeId . '">
            <input type="hidden" name="id" id="rtf_id_' . $typeId . '" value="">
            <div class="field"><label>Label</label><input type="text" name="label" id="rtf_label_' . $typeId . '" maxlength="150" required></div>
            <div class="field"><label>Key (lowercase_with_underscores)</label><input type="text" name="field_key" id="rtf_key_' . $typeId . '" pattern="[a-z0-9_]+" required></div>
            <div class="field"><label>Field type</label><select name="field_type" id="rtf_type_' . $typeId . '">' . $fieldTypeOptions . '</select></div>
            <div class="field"><label>Options (one per line, only used for "select")</label><textarea name="field_options" id="rtf_options_' . $typeId . '" rows="3"></textarea></div>
            <div class="field"><label><input type="checkbox" name="is_required" id="rtf_required_' . $typeId . '" style="width:auto;"> Required</label></div>
            <div class="field"><label>Order</label><input type="number" name="sort_order" id="rtf_sort_' . $typeId . '" value="0" min="0"></div>
            <button class="btn btn-outline" type="submit">Save Field</button>
          </form>
        </div>';
    }

    $typeErrorHtml = $typeFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($typeFormError) . '</p>' : '';
    $fieldErrorHtml = $fieldFormError !== null ? '<p class="text-destructive">' . htmlspecialchars($fieldFormError) . '</p>' : '';

    return '
    <div class="card" style="margin-bottom:1.5rem;">
      <p class="muted">Shown as a picker on the public submission form once a requestor picks a department. A department with no request types just gets the plain form.</p>
    </div>
    ' . $fieldErrorHtml . $typesHtml . '
    <div class="card" id="rt_form">
      <h2>Add / Edit Request Type</h2>
      ' . $typeErrorHtml . '
      <form method="post" action="' . htmlspecialchars($selfUrl . '?section=types') . '">
        ' . csrfField() . '
        <input type="hidden" name="intent" value="save_request_type">
        <input type="hidden" name="id" id="rt_id" value="">
        <div class="field"><label>Name</label><input type="text" name="name" id="rt_name" maxlength="150" required></div>
        <div class="field"><label>Department</label><select name="department_id" id="rt_dept">' . $deptOptions . '</select></div>
        <div class="field"><label>Icon (single emoji, optional)</label><input type="text" name="icon" id="rt_icon" maxlength="8"></div>
        <div class="field"><label>Order</label><input type="number" name="sort_order" id="rt_sort_order" value="0" min="0"></div>
        <button class="btn" type="submit">Save</button>
      </form>
    </div>';
}
