<?php
declare(strict_types=1);

const DASHBOARD_PAGE_SIZE = 25;
// T049: in_progress = claimed/actively worked, distinct from a plain unclaimed 'open' ticket.
const VALID_TICKET_STATUSES = ['open', 'in_progress', 'on-hold', 'closed', 'cancelled'];

// Computed live on every read rather than trusting/maintaining the stored `is_overdue` column —
// there's no cron/scheduler in this project, and computing in SQL (not PHP) avoids the exact
// PHP/MySQL timezone mismatch that broke the cache in T018/F002.
const IS_OVERDUE_SQL = "(sla_deadline IS NOT NULL AND sla_deadline < NOW() AND status NOT IN ('closed','cancelled')) AS is_overdue_live";

// closed/cancelled are terminal by design — no transitions out (also covers "closed -> closed").
const STATUS_TRANSITIONS = [
    'open' => ['in_progress', 'on-hold', 'closed', 'cancelled'],
    'in_progress' => ['open', 'on-hold', 'closed', 'cancelled'],
    'on-hold' => ['open', 'in_progress', 'closed', 'cancelled'],
    'closed' => [],
    'cancelled' => [],
];

const DEPARTMENT_NAV_ICONS = [
    'dashboard' => '⬡',
    'tickets' => '▣',
    'report' => '▦',
    'kb' => '▤',
    'faq' => '◈',
    'request-types' => '▧',
];

const REQUEST_FIELD_TYPES = ['text', 'textarea', 'select', 'number', 'date', 'boolean'];

// T041 — shared sidebar shell for every department-agent page (dashboard, tickets, ticket detail, KB).
// $activeKey highlights the relevant nav item; ticket detail counts as under 'tickets' because
// the ticket list now lives behind its own sidebar entry instead of inside the dashboard.
function renderDepartmentShell(array $dept, array $user, string $activeKey, string $content): string
{
    $navItems = [
        ['key' => 'dashboard', 'label' => 'Dashboard', 'href' => url($dept['slug'] . '/'), 'icon' => DEPARTMENT_NAV_ICONS['dashboard'], 'badge' => null],
        ['key' => 'tickets', 'label' => 'Tickets', 'href' => url($dept['slug'] . '/tickets'), 'icon' => DEPARTMENT_NAV_ICONS['tickets'], 'badge' => null],
        ['key' => 'report', 'label' => 'Report', 'href' => url($dept['slug'] . '/report'), 'icon' => DEPARTMENT_NAV_ICONS['report'], 'badge' => null],
        ['key' => 'kb', 'label' => 'Knowledge Base', 'href' => url($dept['slug'] . '/kb'), 'icon' => DEPARTMENT_NAV_ICONS['kb'], 'badge' => null],
        ['key' => 'faq', 'label' => 'FAQ', 'href' => url($dept['slug'] . '/faq'), 'icon' => DEPARTMENT_NAV_ICONS['faq'], 'badge' => null],
        ['key' => 'request-types', 'label' => 'Request Types', 'href' => url($dept['slug'] . '/request-types'), 'icon' => DEPARTMENT_NAV_ICONS['request-types'], 'badge' => null],
    ];

    return renderSidebarShell(
        $activeKey,
        $navItems,
        (string) $user['name'],
        $dept['name'] . ' · ' . ucfirst((string) $user['role']),
        url($dept['slug'] . '/') . '?logout=1',
        url(''),
        $content
    );
}

function handleDepartmentRoute(string $slug, array $segments): void
{
    $dept = dbFetchOne('SELECT id, name, slug FROM departments WHERE slug = :slug', ['slug' => $slug]);
    if ($dept === null) {
        send404();
        return;
    }

    if (count($segments) === 0) {
        handleDepartmentDashboard($dept);
        return;
    }

    if (count($segments) === 2 && $segments[0] === 'ticket' && ctype_digit($segments[1])) {
        handleDepartmentTicket($dept, (int) $segments[1]);
        return;
    }

    if (count($segments) === 1 && $segments[0] === 'tickets') {
        handleDepartmentTickets($dept);
        return;
    }

    if (count($segments) === 1 && $segments[0] === 'report') {
        handleDepartmentReport($dept);
        return;
    }

    if (count($segments) === 1 && $segments[0] === 'kb') {
        handleDepartmentKb($dept);
        return;
    }

    if (count($segments) === 1 && $segments[0] === 'faq') {
        handleDepartmentFaq($dept);
        return;
    }

    if (count($segments) === 1 && $segments[0] === 'request-types') {
        handleDepartmentRequestTypes($dept);
        return;
    }

    send404();
}

function handleDepartmentDashboard(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl, (int) $dept['id']);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    $baseWhere = '(tickets.department_id = :dept_id OR EXISTS (SELECT 1 FROM ticket_departments td WHERE td.ticket_id = tickets.id AND td.department_id = :dept_id2))';
    $baseParams = ['dept_id' => (int) $dept['id'], 'dept_id2' => (int) $dept['id']];

    $analyticsStats = computeTicketStats($baseWhere, $baseParams);
    $statusBreakdown = fetchStatusBreakdown($baseWhere, $baseParams);
    $priorityBreakdown = fetchPriorityBreakdown($baseWhere, $baseParams);
    $chartRange = resolveChartRangeFromRequest();
    $chartSeries = fetchTicketsCreatedSeries($baseWhere, $baseParams, $chartRange);
    $recentTickets = fetchRecentTickets($baseWhere, $baseParams, 8);

    $content = renderDashboardContent($dept, $analyticsStats, $statusBreakdown, $priorityBreakdown, $chartRange, $chartSeries, $recentTickets);
    renderPage($dept['name'], renderDepartmentShell($dept, $user, 'dashboard', $content));
}

function handleDepartmentTickets(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/tickets');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl, (int) $dept['id']);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    // T049 — quick "Claim" from the list itself (View-As stays read-only, same rule used
    // throughout this controller for every other mutating POST). The collision message (lost the
    // atomic race to another agent) is carried forward as a query param and shown as a banner —
    // there's no per-row form error slot on a list page the way there is on the detail page.
    if (getViewAsContext() === null && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'claim') {
        $claimTicketId = isset($_POST['ticket_id']) && ctype_digit((string) $_POST['ticket_id']) ? (int) $_POST['ticket_id'] : null;
        $claimError = $claimTicketId !== null ? applyClaimTicket($claimTicketId, (int) $user['id']) : null;
        $redirectQs = isset($_GET['status']) ? ['status' => (string) $_GET['status']] : [];
        if ($claimError !== null) {
            $redirectQs['claim_error'] = $claimError;
        }
        header('Location: ' . $selfUrl . ($redirectQs !== [] ? '?' . http_build_query($redirectQs) : ''));
        exit;
    }

    $page = isset($_GET['page']) && ctype_digit((string) $_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $statusFilter = (string) ($_GET['status'] ?? '');
    if (!in_array($statusFilter, VALID_TICKET_STATUSES, true)) {
        $statusFilter = '';
    }
    // T061 — free-form filtering beyond just status: priority, assigned agent (including
    // "unassigned"), and a keyword search across the fields an agent would actually recognize a
    // ticket by. Each is optional and additive with the others.
    $priorityFilter = (string) ($_GET['priority'] ?? '');
    if (!in_array($priorityFilter, PRIORITY_LEVELS, true)) {
        $priorityFilter = '';
    }
    $assignedFilter = (string) ($_GET['assigned_to'] ?? '');
    if ($assignedFilter !== '' && $assignedFilter !== 'unassigned' && !ctype_digit($assignedFilter)) {
        $assignedFilter = '';
    }
    $searchFilter = trim((string) ($_GET['q'] ?? ''));

    // T054 — a ticket belongs to a department if it's the primary owner OR listed in
    // ticket_departments (full shared ownership: either side's agents see and can act on it).
    // This EXISTS clause is the one place that definition lives; every ticket query below reuses
    // the same $where so isolation can't drift between the list, stats, and export.
    // PDO with EMULATE_PREPARES=false (db.php) can't bind the same named placeholder twice in
    // one query — MySQL's native prepared-statement protocol needs one bound value per
    // occurrence, not per name, so :dept_id and :dept_id2 below are two names for the same value.
    $baseWhere = '(tickets.department_id = :dept_id OR EXISTS (SELECT 1 FROM ticket_departments td WHERE td.ticket_id = tickets.id AND td.department_id = :dept_id2))';
    $baseParams = ['dept_id' => (int) $dept['id'], 'dept_id2' => (int) $dept['id']];

    $where = $baseWhere;
    $params = $baseParams;
    if ($statusFilter !== '') {
        $where .= ' AND status = :status';
        $params['status'] = $statusFilter;
    }
    if ($priorityFilter !== '') {
        $where .= ' AND priority = :priority';
        $params['priority'] = $priorityFilter;
    }
    if ($assignedFilter === 'unassigned') {
        $where .= ' AND assigned_to IS NULL';
    } elseif ($assignedFilter !== '') {
        $where .= ' AND assigned_to = :assigned_to';
        $params['assigned_to'] = (int) $assignedFilter;
    }
    if ($searchFilter !== '') {
        $where .= ' AND (subject LIKE :q1 OR description LIKE :q2 OR requestor_email LIKE :q3 OR client_name LIKE :q4 OR team_leader_name LIKE :q5)';
        $needle = '%' . $searchFilter . '%';
        $params['q1'] = $needle;
        $params['q2'] = $needle;
        $params['q3'] = $needle;
        $params['q4'] = $needle;
        $params['q5'] = $needle;
    }

    // Export (not paginated — the whole filtered set) bypasses the page render entirely, same
    // pattern as T032's admin CSV export.
    if (($_GET['format'] ?? '') === 'csv') {
        exportDepartmentTicketsCsv($dept, $where, $params, $statusFilter);
        return;
    }

    $total = (int) (dbFetchOne("SELECT COUNT(*) AS cnt FROM tickets WHERE $where", $params)['cnt'] ?? 0);

    $perPage = DASHBOARD_PAGE_SIZE;
    $offset = (max(1, $page) - 1) * $perPage;
    // LIMIT/OFFSET can't be bound as named params under real prepared statements (db.php sets
    // EMULATE_PREPARES=false) — MySQL's native protocol requires them as integers, but
    // PDOStatement::execute(array) always binds as PARAM_STR. Both values are guaranteed ints
    // (cast above), never raw request input, so inlining them here is safe.
    $tickets = dbFetchAll(
        "SELECT tickets.id, subject, description, status, priority, requestor_email, team_leader_name, client_name,
                assigned_to, tickets.created_at, " . IS_OVERDUE_SQL . ", u.name AS assigned_name
         FROM tickets LEFT JOIN users u ON u.id = tickets.assigned_to
         WHERE $where ORDER BY tickets.created_at DESC LIMIT $perPage OFFSET $offset",
        $params
    );

    // Which departments (beyond the dept currently being viewed) each listed ticket also belongs
    // to, for the "also: HR" tag — one query for the whole page, not one per row.
    $ticketIds = array_map(static fn(array $t): int => (int) $t['id'], $tickets);
    $sharedDeptsByTicket = $ticketIds !== [] ? fetchSharedDepartmentNames($ticketIds, (int) $dept['id']) : [];

    // 60s read-through cache — ticket lists for a busy department get hit far more often than the
    // underlying ticket volume changes, so this absorbs repeated aggregate queries (T019).
    $stats = cacheRemember('dept_stats_' . $dept['id'], 60, function () use ($dept) {
        $rows = dbFetchAll(
            'SELECT status, COUNT(*) AS cnt FROM tickets
             WHERE department_id = :dept_id OR EXISTS (SELECT 1 FROM ticket_departments td WHERE td.ticket_id = tickets.id AND td.department_id = :dept_id2)
             GROUP BY status',
            ['dept_id' => (int) $dept['id'], 'dept_id2' => (int) $dept['id']]
        );
        $counts = array_fill_keys(VALID_TICKET_STATUSES, 0);
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['cnt'];
        }
        return $counts;
    });

    $claimError = isset($_GET['claim_error']) ? (string) $_GET['claim_error'] : null;

    $eligibleAgents = dbFetchAll(
        'SELECT id, name FROM users WHERE department_id = :dept_id AND role = "agent" ORDER BY name',
        ['dept_id' => (int) $dept['id']]
    );

    $content = renderTicketsContent(
        $dept, $user, $tickets, $total, $page, $perPage, $statusFilter, $priorityFilter, $assignedFilter, $searchFilter,
        $stats, $sharedDeptsByTicket, $claimError, $eligibleAgents
    );
    renderPage($dept['name'] . ' Tickets', renderDepartmentShell($dept, $user, 'tickets', $content));
}

// T054 — for a page of ticket ids, the departments (other than $excludeDeptId, the one currently
// being viewed) each ticket is ALSO shared with, keyed by ticket id. One query for the whole
// page rather than one per row.
function fetchSharedDepartmentNames(array $ticketIds, int $excludeDeptId): array
{
    $placeholders = implode(',', array_fill(0, count($ticketIds), '?'));
    $rows = dbFetchAll(
        "SELECT t.id AS ticket_id, d.name AS dept_name
         FROM tickets t JOIN departments d ON d.id = t.department_id
         WHERE t.id IN ($placeholders) AND t.department_id != ?
         UNION
         SELECT td.ticket_id, d.name AS dept_name
         FROM ticket_departments td JOIN departments d ON d.id = td.department_id
         WHERE td.ticket_id IN ($placeholders) AND td.department_id != ?",
        [...$ticketIds, $excludeDeptId, ...$ticketIds, $excludeDeptId]
    );
    $byTicket = [];
    foreach ($rows as $row) {
        $byTicket[(int) $row['ticket_id']][] = (string) $row['dept_name'];
    }
    return $byTicket;
}

// Export for this department only — reachable only through handleDepartmentDashboard(), which
// already gated on requireDepartmentAccess() before this is ever called, so it's scoped by
// construction the same way the rest of this controller is (not a separate isolation check here).
// Reuses the exact $where/$params the caller already built, so it can never drift from what the
// Tickets page is currently showing (same filters, same department).
function exportDepartmentTicketsCsv(array $dept, string $where, array $params, string $statusFilter): void
{
    $tickets = dbFetchAll(
        "SELECT tickets.id, subject, description, status, priority, requestor_email, team_leader_name, client_name,
                supplier_name, budget_amount, tickets.created_at, tickets.updated_at, u.name AS assigned_name
         FROM tickets LEFT JOIN users u ON u.id = tickets.assigned_to
         WHERE $where ORDER BY tickets.created_at DESC",
        $params
    );

    $filename = $dept['slug'] . '_tickets' . ($statusFilter !== '' ? '_' . $statusFilter : '') . '.csv';
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['Ticket ID', 'Title', 'Description', 'Status', 'Priority', 'Assigned To', 'Requestor Email', 'Team Leader', 'Client', 'Supplier', 'Budget', 'Created', 'Updated']);
    foreach ($tickets as $t) {
        fputcsv($out, [
            $t['id'], $t['subject'], $t['description'], $t['status'], $t['priority'], $t['assigned_name'] ?? 'Unassigned',
            $t['requestor_email'], $t['team_leader_name'], $t['client_name'], $t['supplier_name'] ?? '', $t['budget_amount'] ?? '',
            $t['created_at'], $t['updated_at'],
        ]);
    }
    fclose($out);
    exit;
}

/**
 * @param array<string,int> $analyticsStats
 * @param array<string,int> $statusBreakdown
 * @param array<string,int> $priorityBreakdown
 * @param array<int,array<string,mixed>> $chartSeries
 * @param array<int,array<string,mixed>> $recentTickets
 */
function renderDashboardContent(
    array $dept,
    array $analyticsStats,
    array $statusBreakdown,
    array $priorityBreakdown,
    array $chartRange,
    array $chartSeries,
    array $recentTickets
): string {
    $selfUrl = url($dept['slug'] . '/');
    $ticketUrlFn = static fn(array $t): string => url($dept['slug'] . '/ticket/' . (int) $t['id']);

    return '
    <main class="container">
      <h1>' . htmlspecialchars($dept['name']) . '</h1>
      ' . renderDashboardDateSubtitle() . '
      ' . renderStatCardsHtml($analyticsStats) . '
      <div class="analytics-row">
        <div class="card chart-card-wide">
          ' . renderTicketsCreatedChart($selfUrl, [], $chartRange, $chartSeries) . '
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
          <p class="muted chart-subtitle">Latest activity</p>
          ' . renderRecentTicketsList($recentTickets, $ticketUrlFn) . '
        </div>
      </div>
    </main>';
}

/**
 * @param array<int,array<string,mixed>> $tickets
 * @param array<string,int> $stats
 * @param array<int,array<int,string>> $sharedDeptsByTicket
 * @param array<int,array<string,mixed>> $eligibleAgents
 */
function renderTicketsContent(
    array $dept,
    array $user,
    array $tickets,
    int $total,
    int $page,
    int $perPage,
    string $statusFilter,
    string $priorityFilter = '',
    string $assignedFilter = '',
    string $searchFilter = '',
    array $stats = [],
    array $sharedDeptsByTicket = [],
    ?string $claimError = null,
    array $eligibleAgents = []
): string {
    $selfUrl = url($dept['slug'] . '/tickets');

    $statusOptions = '<option value="">All statuses</option>';
    foreach (VALID_TICKET_STATUSES as $status) {
        $selected = $statusFilter === $status ? ' selected' : '';
        $statusOptions .= '<option value="' . htmlspecialchars($status) . '"' . $selected . '>' . htmlspecialchars($status) . '</option>';
    }
    $priorityOptions = '<option value="">All priorities</option>';
    foreach (PRIORITY_LEVELS as $priority) {
        $selected = $priorityFilter === $priority ? ' selected' : '';
        $priorityOptions .= '<option value="' . htmlspecialchars($priority) . '"' . $selected . '>' . htmlspecialchars(ucfirst($priority)) . '</option>';
    }
    $assignedOptions = '<option value="">Anyone</option><option value="unassigned"' . ($assignedFilter === 'unassigned' ? ' selected' : '') . '>Unassigned</option>';
    foreach ($eligibleAgents as $agent) {
        $selected = $assignedFilter === (string) $agent['id'] ? ' selected' : '';
        $assignedOptions .= '<option value="' . (int) $agent['id'] . '"' . $selected . '>' . htmlspecialchars((string) $agent['name']) . '</option>';
    }

    $claimErrorHtml = $claimError !== null
        ? '<div class="card" style="margin-bottom:1rem; border-color:var(--destructive);"><p class="text-destructive" style="margin:0;">' . htmlspecialchars($claimError) . '</p></div>'
        : '';

    $rows = '';
    if ($tickets === []) {
        $rows = '<tr><td colspan="10" class="muted">No tickets match this filter.</td></tr>';
    }
    foreach ($tickets as $t) {
        $badgeClass = 'badge-' . str_replace('_', '-', (string) $t['status']);
        $ticketUrl = url($dept['slug'] . '/ticket/' . (int) $t['id']);
        $overdueTag = ((int) $t['is_overdue_live'] === 1)
            ? ' <span class="badge badge-on-hold">overdue</span>'
            : '';
        // T054 — "also: HR" tag when this ticket is shared with another department, so an agent
        // immediately sees it wasn't submitted to their department alone.
        $sharedNames = $sharedDeptsByTicket[(int) $t['id']] ?? [];
        $sharedTag = $sharedNames !== []
            ? ' <span class="badge badge-cancelled" title="Also submitted to">also: ' . htmlspecialchars(implode(', ', $sharedNames)) . '</span>'
            : '';
        // Truncated — the full description is one click away on the ticket detail page; showing
        // it in full here would blow out an already-wide table.
        $description = (string) $t['description'];
        $descriptionShort = mb_strlen($description) > 80 ? mb_substr($description, 0, 80) . '…' : $description;
        // T049 — quick claim inline, only offered while genuinely unassigned.
        $assignedCell = $t['assigned_to'] !== null
            ? htmlspecialchars((string) $t['assigned_name'])
            : '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
                . csrfField()
                . '<input type="hidden" name="intent" value="claim">'
                . '<input type="hidden" name="ticket_id" value="' . (int) $t['id'] . '">'
                . '<button class="btn btn-outline" type="submit" style="padding:.2rem .6rem; font-size:.8rem;">Claim</button>'
                . '</form>';
        $rows .= '<tr>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">#' . (int) $t['id'] . '</a></td>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">' . htmlspecialchars((string) $t['subject']) . '</a>' . $overdueTag . $sharedTag . '</td>'
            . '<td class="muted">' . htmlspecialchars($descriptionShort) . '</td>'
            . '<td><span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $t['status']) . '</span></td>'
            . '<td>' . htmlspecialchars((string) $t['priority']) . '</td>'
            . '<td>' . $assignedCell . '</td>'
            . '<td>' . htmlspecialchars((string) $t['requestor_email']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['team_leader_name']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['client_name']) . '</td>'
            . '<td class="muted">' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '</tr>';
    }

    // Carries every active filter (not just status) into pagination and the CSV export link, so
    // neither one silently drops a priority/assigned/search filter the agent has set.
    $filterQueryParts = array_filter([
        'status' => $statusFilter,
        'priority' => $priorityFilter,
        'assigned_to' => $assignedFilter,
        'q' => $searchFilter,
    ], static fn(string $v): bool => $v !== '');

    $totalPages = max(1, (int) ceil($total / $perPage));
    $pagerHtml = '';
    if ($totalPages > 1) {
        $prevDisabled = $page <= 1;
        $nextDisabled = $page >= $totalPages;
        $qs = $filterQueryParts !== [] ? '&' . http_build_query($filterQueryParts) : '';
        $pagerHtml = '<div style="display:flex; gap:.5rem; align-items:center; margin-top:1rem;">'
            . ($prevDisabled ? '' : '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?page=' . ($page - 1) . $qs) . '">Previous</a>')
            . '<span class="muted">Page ' . $page . ' of ' . $totalPages . ' (' . $total . ' tickets)</span>'
            . ($nextDisabled ? '' : '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?page=' . ($page + 1) . $qs) . '">Next</a>')
            . '</div>';
    } else {
        $pagerHtml = '<p class="muted" style="margin-top:1rem;">' . $total . ' ticket' . ($total === 1 ? '' : 's') . '</p>';
    }

    // Clickable — each tile is a quick filter to that status (e.g. "closed" to see completed
    // tickets), not just a static count. Same $selfUrl + ?status= the dropdown below uses.
    $statTiles = '';
    foreach (VALID_TICKET_STATUSES as $status) {
        $badgeClass = 'badge-' . str_replace('_', '-', $status);
        $isActive = $statusFilter === $status;
        $tileUrl = $selfUrl . '?status=' . urlencode($status);
        $statTiles .= '<a href="' . htmlspecialchars($tileUrl) . '" class="card" style="padding:.9rem 1.1rem; display:block; text-decoration:none; color:inherit;'
            . ($isActive ? ' border-color:var(--ring);' : '') . '">'
            . '<div class="muted" style="font-size:.75rem; text-transform:uppercase;">' . htmlspecialchars($status) . '</div>'
            . '<div style="font-size:1.4rem; font-weight:600;">' . (int) ($stats[$status] ?? 0) . '</div>'
            . '</a>';
    }

    return '
    <main class="container">
      <h1>' . htmlspecialchars($dept['name']) . ' Tickets</h1>
      ' . $claimErrorHtml . '
      <div style="display:grid; grid-template-columns:repeat(' . count(VALID_TICKET_STATUSES) . ', 1fr); gap:.75rem; margin-bottom:1.5rem;">' . $statTiles . '</div>
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:1rem;">
          <form method="get" action="' . htmlspecialchars($selfUrl) . '" style="display:flex; flex-wrap:wrap; gap:.75rem; align-items:flex-end;">
            <div class="field" style="margin-bottom:0; width:160px;">
              <label>Status</label>
              <select name="status" onchange="this.form.submit()">' . $statusOptions . '</select>
            </div>
            <div class="field" style="margin-bottom:0; width:160px;">
              <label>Priority</label>
              <select name="priority" onchange="this.form.submit()">' . $priorityOptions . '</select>
            </div>
            <div class="field" style="margin-bottom:0; width:180px;">
              <label>Assigned</label>
              <select name="assigned_to" onchange="this.form.submit()">' . $assignedOptions . '</select>
            </div>
            <div class="field" style="margin-bottom:0; width:220px;">
              <label>Search</label>
              <input type="text" name="q" value="' . htmlspecialchars($searchFilter) . '" placeholder="Title, requestor, client…">
            </div>
            <button class="btn btn-outline" type="submit" style="padding:.5rem 1rem;">Apply</button>
            ' . ($filterQueryParts !== [] ? '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl) . '">Clear</a>' : '') . '
          </form>
          <a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?format=csv' . ($filterQueryParts !== [] ? '&' . http_build_query($filterQueryParts) : '')) . '">Export CSV</a>
        </div>
        <table style="margin-top:1rem;">
          <thead><tr><th>ID</th><th>Title</th><th>Description</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Requestor</th><th>Team Leader</th><th>Client</th><th>Created</th></tr></thead>
          <tbody>' . $rows . '</tbody>
        </table>
        ' . $pagerHtml . '
      </div>
    </main>';
}

// T063 — per-department Report tab. Reuses admin_controller.php's getReportFilters()/
// fetchReportTickets()/exportTicketsReportCsv()/renderTicketsReportPrintView() wholesale by
// forcing department_id to this department regardless of what a tampered query string requests —
// same isolation shape as every other department-scoped page in this controller, just expressed
// as "the filter can never be widened" instead of a WHERE clause of its own.
function handleDepartmentReport(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/report');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl, (int) $dept['id']);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    $filters = getReportFilters();
    $filters['department_id'] = (int) $dept['id'];

    $format = (string) ($_GET['format'] ?? '');
    if ($format === 'csv') {
        exportTicketsReportCsv($filters);
        return;
    }
    if ($format === 'print') {
        renderPage($dept['name'] . ' Report', renderTicketsReportPrintView($filters));
        return;
    }

    $where = 'department_id = :dept_id AND created_at >= :from AND created_at < DATE_ADD(:to, INTERVAL 1 DAY)';
    $params = ['dept_id' => (int) $dept['id'], 'from' => $filters['from'], 'to' => $filters['to']];
    if ($filters['status'] !== '') {
        $where .= ' AND status = :status';
        $params['status'] = $filters['status'];
    }
    $stats = computeTicketStats($where, $params);

    $content = renderDepartmentReportContent($dept, $selfUrl, $filters, $stats);
    renderPage($dept['name'] . ' Report', renderDepartmentShell($dept, $user, 'report', $content));
}

function renderDepartmentReportContent(array $dept, string $selfUrl, array $filters, array $stats): string
{
    $tickets = fetchReportTickets($filters);

    $statusOptions = '<option value="">All statuses</option>';
    foreach (VALID_TICKET_STATUSES as $status) {
        $selected = $filters['status'] === $status ? ' selected' : '';
        $statusOptions .= '<option value="' . htmlspecialchars($status) . '"' . $selected . '>' . htmlspecialchars($status) . '</option>';
    }

    $rows = $tickets === []
        ? '<tr><td colspan="5" class="muted">No tickets match these filters.</td></tr>'
        : '';
    foreach ($tickets as $t) {
        $rows .= '<tr>'
            . '<td>#' . (int) $t['id'] . '</td>'
            . '<td>' . htmlspecialchars((string) $t['subject']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['status']) . '</td>'
            . '<td class="muted">' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '<td>' . htmlspecialchars((string) ($t['assigned_name'] ?? 'Unassigned')) . '</td>'
            . '</tr>';
    }

    $queryString = http_build_query(array_filter(
        ['status' => $filters['status'], 'from' => $filters['from'], 'to' => $filters['to']],
        fn($v): bool => $v !== null && $v !== ''
    ));

    return '
    <main class="container">
      <h1>' . htmlspecialchars($dept['name']) . ' Report</h1>
      ' . renderStatCardsHtml($stats) . '
      <div class="card" style="margin-bottom:1.5rem;">
        <h2>Filters</h2>
        <form method="get" action="' . htmlspecialchars($selfUrl) . '">
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
          <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Created</th><th>Assigned</th></tr></thead>
          <tbody>' . $rows . '</tbody>
        </table>
      </div>
    </main>';
}

function handleDepartmentTicket(array $dept, int $ticketId): void
{
    $actionUrl = url($dept['slug'] . '/ticket/' . $ticketId);

    $user = requireLogin($dept['name'] . ' Login', $actionUrl, (int) $dept['id']);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    // Must match department_id (or be shared with this department via T054's ticket_departments)
    // here too, not just check the agent's own access to $dept above — otherwise /it/ticket/{id}
    // could render an HR-only ticket if that numeric id happens to exist.
    $ticket = dbFetchOne(
        'SELECT t.*, u.name AS assigned_name, rt.name AS request_type_name, ' . IS_OVERDUE_SQL . '
         FROM tickets t
         LEFT JOIN users u ON u.id = t.assigned_to
         LEFT JOIN request_types rt ON rt.id = t.request_type_id
         WHERE t.id = :id AND (t.department_id = :dept_id OR EXISTS (
             SELECT 1 FROM ticket_departments td WHERE td.ticket_id = t.id AND td.department_id = :dept_id2
         ))',
        ['id' => $ticketId, 'dept_id' => (int) $dept['id'], 'dept_id2' => (int) $dept['id']]
    );
    if ($ticket === null) {
        send404();
        return;
    }

    $sharedDeptNames = fetchSharedDepartmentNames([$ticketId], (int) $dept['id'])[$ticketId] ?? [];

    // Download goes through the same login + department-isolation checks already passed above —
    // the attachment row must also belong to this exact ticket, and files are never directly
    // reachable via a static URL (uploads/.htaccess denies all direct HTTP access).
    if (isset($_GET['download']) && ctype_digit((string) $_GET['download'])) {
        streamAttachment((int) $_GET['download'], $ticketId);
        return;
    }

    // View-As grants read access only (T025) — every mutating intent on this page is a POST, so
    // blocking all POSTs here covers status changes, reassignment, notes, and uploads uniformly
    // without repeating the check in each intent branch below.
    if (getViewAsContext() !== null && $_SERVER['REQUEST_METHOD'] === 'POST') {
        send403();
        return;
    }

    $statusError = null;
    $oldResolutionSummary = '';
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'change_status') {
        $oldResolutionSummary = trim((string) ($_POST['resolution_summary'] ?? ''));
        $statusError = applyStatusTransition(
            $ticketId,
            (string) $ticket['status'],
            (string) ($_POST['new_status'] ?? ''),
            $oldResolutionSummary,
            (int) $user['id']
        );
        if ($statusError === null) {
            header('Location: ' . $actionUrl);
            exit;
        }
        // Re-fetch so the rendered page reflects the (unchanged) current state after a rejected transition.
        $ticket = dbFetchOne(
            'SELECT t.*, u.name AS assigned_name, rt.name AS request_type_name, ' . IS_OVERDUE_SQL . ' FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN request_types rt ON rt.id = t.request_type_id WHERE t.id = :id',
            ['id' => $ticketId]
        );
    }

    $claimError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'claim') {
        $claimError = applyClaimTicket($ticketId, (int) $user['id']);
        if ($claimError === null) {
            header('Location: ' . $actionUrl);
            exit;
        }
        $ticket = dbFetchOne(
            'SELECT t.*, u.name AS assigned_name, rt.name AS request_type_name, ' . IS_OVERDUE_SQL . ' FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN request_types rt ON rt.id = t.request_type_id WHERE t.id = :id',
            ['id' => $ticketId]
        );
    }

    $reassignError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'reassign') {
        $reassignError = applyReassignment(
            $ticketId,
            $ticket['assigned_to'] !== null ? (int) $ticket['assigned_to'] : null,
            $_POST['assigned_to'] !== '' ? (int) $_POST['assigned_to'] : null,
            (int) $dept['id'],
            (int) $user['id']
        );
        if ($reassignError === null) {
            header('Location: ' . $actionUrl);
            exit;
        }
        $ticket = dbFetchOne(
            'SELECT t.*, u.name AS assigned_name, rt.name AS request_type_name, ' . IS_OVERDUE_SQL . ' FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN request_types rt ON rt.id = t.request_type_id WHERE t.id = :id',
            ['id' => $ticketId]
        );
    }

    $noteError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'add_note') {
        $noteError = applyAddNote($ticketId, (int) $user['id'], (string) ($_POST['message'] ?? ''));
        if ($noteError === null) {
            header('Location: ' . $actionUrl);
            exit;
        }
    }

    $attachmentError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'upload_attachment') {
        $attachmentError = applyUploadAttachment($ticketId, $_FILES['attachment'] ?? null);
        if ($attachmentError === null) {
            header('Location: ' . $actionUrl);
            exit;
        }
    }

    $commentError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'add_comment') {
        $commentError = applyAddComment($ticketId, 'agent', (int) $user['id'], (string) $user['name'], (string) ($_POST['body'] ?? ''));
        if ($commentError === null) {
            header('Location: ' . $actionUrl);
            exit;
        }
    }

    // T048 — tags, LOW priority: agent-editable free-form labels, deliberately kept to
    // add/remove only (no dashboard filter — the task's own acceptance criteria marked that
    // "nice-to-have... don't gold-plate it").
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'add_tag') {
        $tag = mb_substr(trim((string) ($_POST['tag'] ?? '')), 0, 50);
        if ($tag !== '') {
            dbQuery(
                'INSERT IGNORE INTO ticket_tags (ticket_id, tag) VALUES (:ticket_id, :tag)',
                ['ticket_id' => $ticketId, 'tag' => $tag]
            );
        }
        header('Location: ' . $actionUrl);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'remove_tag') {
        // Scoped by ticket_id, not just the tag row's own id — a tag id alone isn't trusted.
        dbDelete('ticket_tags', 'id = :id AND ticket_id = :ticket_id', ['id' => (int) ($_POST['id'] ?? 0), 'ticket_id' => $ticketId]);
        header('Location: ' . $actionUrl);
        exit;
    }

    $eligibleAgents = dbFetchAll(
        'SELECT id, name FROM users WHERE department_id = :dept_id AND role = "agent" AND can_accept_tickets = 1 ORDER BY name',
        ['dept_id' => (int) $dept['id']]
    );

    $attachments = dbFetchAll(
        'SELECT id, file_name, file_size_kb, uploaded_at FROM attachments WHERE ticket_id = :id ORDER BY uploaded_at ASC',
        ['id' => $ticketId]
    );

    // Agent-only collaboration notes — only ever fetched/rendered from this authenticated,
    // department-isolated controller; public_controller.php has no code path that touches this table.
    $notes = dbFetchAll(
        'SELECT n.message, n.created_at, u.name AS agent_name
         FROM internal_notes n JOIN users u ON u.id = n.agent_id
         WHERE n.ticket_id = :id ORDER BY n.created_at ASC',
        ['id' => $ticketId]
    );

    // LEFT JOIN, not JOIN — actor_id is NULL for genuinely automated changes, which must still
    // render (as "System"), not disappear from the trail. Scoped by the ticket already confirmed
    // to belong to this department above, so this inherits that same isolation guard.
    $auditLogs = dbFetchAll(
        'SELECT a.action_type, a.old_value, a.new_value, a.timestamp, u.name AS actor_name
         FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id
         WHERE a.ticket_id = :id ORDER BY a.timestamp DESC, a.id DESC',
        ['id' => $ticketId]
    );

    // T046 — visible to the requester too (via public_controller.php's status-lookup page), so
    // unlike $notes above this is NOT agent-only. Chronological, oldest first, like $notes.
    $comments = dbFetchAll(
        'SELECT author_type, author_name, body, created_at FROM ticket_comments WHERE ticket_id = :id ORDER BY created_at ASC',
        ['id' => $ticketId]
    );

    $tags = dbFetchAll('SELECT id, tag FROM ticket_tags WHERE ticket_id = :id ORDER BY tag', ['id' => $ticketId]);

    $content = renderTicketDetail(
        $dept,
        $user,
        $ticket,
        $statusError,
        $oldResolutionSummary,
        $eligibleAgents,
        $reassignError,
        $notes,
        $noteError,
        $attachments,
        $attachmentError,
        $auditLogs,
        $comments,
        $commentError,
        $tags,
        $claimError,
        $sharedDeptNames
    );
    renderPage('Ticket #' . $ticketId, renderDepartmentShell($dept, $user, 'tickets', $content));
}

// Streams an attachment's file content for download. Requires the attachment to belong to the
// exact ticket already confirmed (by the caller) to be in the agent's own department — so this
// re-checks isolation by construction, not by trusting the attachment id alone.
function streamAttachment(int $attachmentId, int $ticketId): void
{
    $attachment = dbFetchOne(
        'SELECT file_path, file_name FROM attachments WHERE id = :id AND ticket_id = :ticket_id',
        ['id' => $attachmentId, 'ticket_id' => $ticketId]
    );
    if ($attachment === null || !is_file((string) $attachment['file_path'])) {
        send404();
        return;
    }

    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename((string) $attachment['file_name']) . '"');
    header('Content-Length: ' . (string) filesize((string) $attachment['file_path']));
    readfile((string) $attachment['file_path']);
}

/**
 * @param array{name:string,type:string,tmp_name:string,error:int,size:int}|null $file
 */
function applyUploadAttachment(int $ticketId, ?array $file): ?string
{
    if ($file === null || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return 'Choose a file to upload.';
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return 'Upload failed — please try again.';
    }
    if ($file['size'] > MAX_UPLOAD_SIZE_KB * 1024) {
        return 'File is too large (max ' . MAX_UPLOAD_SIZE_KB . ' KB).';
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_UPLOAD_EXTENSIONS, true)) {
        return 'File type not allowed (.' . htmlspecialchars($ext) . ').';
    }

    $dir = __DIR__ . '/../uploads/' . $ticketId;
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return 'Could not prepare storage for this upload — try again.';
    }

    // Server-generated filename only — never derived from the user-supplied name, so there is
    // no path-traversal or overwrite risk from what the client sends.
    $storedName = bin2hex(random_bytes(16)) . '.' . $ext;
    $destination = $dir . '/' . $storedName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return 'Could not save the uploaded file — try again.';
    }

    dbInsert('attachments', [
        'ticket_id' => $ticketId,
        'file_path' => $destination,
        'file_name' => basename($file['name']),
        'file_size_kb' => (int) ceil($file['size'] / 1024),
    ]);

    return null;
}

function applyAddNote(int $ticketId, int $agentId, string $message): ?string
{
    $message = trim($message);
    if ($message === '') {
        return 'Note cannot be empty.';
    }
    dbInsert('internal_notes', [
        'ticket_id' => $ticketId,
        'agent_id' => $agentId,
        'message' => $message,
    ]);
    writeAuditLog($ticketId, $agentId, 'NOTE_ADDED', null, $message);
    return null;
}

// T051 — called right after a new ticket is inserted for $departmentId. No-op unless that
// department has auto-assignment on; otherwise picks whichever eligible agent (can_accept_tickets)
// currently has the fewest open/in_progress/on-hold tickets — "least-loaded", not round-robin, so
// it self-corrects if one agent falls behind rather than blindly rotating regardless of load.
// Mirrors applyClaimTicket()'s effect (assigned + moved to in_progress) but actor_id is NULL in
// the audit row since nobody chose this, the system did.
function applyAutoAssignIfEnabled(int $ticketId, int $departmentId): void
{
    $dept = dbFetchOne('SELECT auto_assign_enabled FROM departments WHERE id = :id', ['id' => $departmentId]);
    if ($dept === null || (int) $dept['auto_assign_enabled'] !== 1) {
        return;
    }

    $agent = dbFetchOne(
        'SELECT u.id
         FROM users u
         LEFT JOIN tickets t ON t.assigned_to = u.id AND t.status IN ("open", "in_progress", "on-hold")
         WHERE u.department_id = :dept_id AND u.role = "agent" AND u.can_accept_tickets = 1
         GROUP BY u.id
         ORDER BY COUNT(t.id) ASC, u.id ASC
         LIMIT 1',
        ['dept_id' => $departmentId]
    );
    if ($agent === null) {
        return; // no eligible agent — ticket just stays unassigned/open, same as auto-assign off
    }

    $rowsChanged = dbUpdate(
        'tickets',
        ['assigned_to' => (int) $agent['id'], 'status' => 'in_progress'],
        'id = :id AND assigned_to IS NULL',
        ['id' => $ticketId]
    );
    if ($rowsChanged === 0) {
        return;
    }

    dbInsert('status_history', ['ticket_id' => $ticketId, 'status_from' => 'open', 'status_to' => 'in_progress']);
    writeAuditLog($ticketId, null, 'AUTO_ASSIGN', null, (string) $agent['id']);
}

// T049 — atomic self-assignment, race-safe against two agents claiming the same unassigned
// ticket at once. The initial SELECT is only for a friendlier early-exit message in the common
// case; the actual race protection is the `assigned_to IS NULL` in the UPDATE itself — if another
// agent's claim commits between this function's SELECT and UPDATE, rowCount() comes back 0 and
// that's the real "lost the race" signal, not the SELECT.
function applyClaimTicket(int $ticketId, int $agentId): ?string
{
    $ticket = dbFetchOne('SELECT status, assigned_to FROM tickets WHERE id = :id', ['id' => $ticketId]);
    if ($ticket === null) {
        return 'Ticket not found.';
    }
    if ($ticket['assigned_to'] !== null) {
        return 'This ticket was already claimed by another agent.';
    }
    if (in_array((string) $ticket['status'], ['closed', 'cancelled'], true)) {
        return 'This ticket is closed or cancelled and can\'t be claimed.';
    }

    $rowsChanged = dbUpdate(
        'tickets',
        ['assigned_to' => $agentId, 'status' => 'in_progress'],
        'id = :id AND assigned_to IS NULL',
        ['id' => $ticketId]
    );
    if ($rowsChanged === 0) {
        return 'This ticket was already claimed by another agent.';
    }

    dbInsert('status_history', ['ticket_id' => $ticketId, 'status_from' => $ticket['status'], 'status_to' => 'in_progress']);
    writeAuditLog($ticketId, $agentId, 'CLAIM', null, (string) $agentId);

    return null;
}

// Validates and applies a reassignment, logging it to audit_logs. $newAssignedTo may be null to
// unassign. Rejects assigning to anyone outside the ticket's own department.
function applyReassignment(int $ticketId, ?int $oldAssignedTo, ?int $newAssignedTo, int $departmentId, int $actorId): ?string
{
    if ($newAssignedTo !== null) {
        $target = dbFetchOne(
            'SELECT id FROM users WHERE id = :id AND department_id = :dept_id AND role = "agent"',
            ['id' => $newAssignedTo, 'dept_id' => $departmentId]
        );
        if ($target === null) {
            return 'Can only assign to an agent within this department.';
        }
    }

    if ($oldAssignedTo === $newAssignedTo) {
        return null; // no-op, nothing to log
    }

    dbUpdate('tickets', ['assigned_to' => $newAssignedTo], 'id = :id', ['id' => $ticketId]);
    writeAuditLog(
        $ticketId,
        $actorId,
        'REASSIGN',
        $oldAssignedTo !== null ? (string) $oldAssignedTo : null,
        $newAssignedTo !== null ? (string) $newAssignedTo : null
    );

    return null;
}

// Validates and applies a status transition, logging it to status_history. Closing a ticket
// additionally requires a non-empty resolution summary, stored as an audit_logs row (see
// _brain/decisions/decision_log.md [ARCH] — database.sql has no dedicated column for this).
// Returns null on success, or an error message if the transition/summary is rejected.
function applyStatusTransition(int $ticketId, string $currentStatus, string $newStatus, string $resolutionSummary, int $actorId): ?string
{
    $allowed = STATUS_TRANSITIONS[$currentStatus] ?? [];
    if (!in_array($newStatus, $allowed, true)) {
        return "Can't change status from \"$currentStatus\" to \"$newStatus\".";
    }

    if ($newStatus === 'closed' && $resolutionSummary === '') {
        return 'A resolution summary is required to close a ticket.';
    }

    dbUpdate('tickets', ['status' => $newStatus], 'id = :id', ['id' => $ticketId]);
    dbInsert('status_history', [
        'ticket_id' => $ticketId,
        'status_from' => $currentStatus,
        'status_to' => $newStatus,
    ]);
    writeAuditLog($ticketId, $actorId, 'STATUS_CHANGE', $currentStatus, $newStatus);

    if ($newStatus === 'closed') {
        writeAuditLog($ticketId, $actorId, 'RESOLUTION_SUMMARY', null, $resolutionSummary);
    }

    return null;
}

/**
 * @param array<string,mixed> $ticket
 * @param array<int,array<string,mixed>> $eligibleAgents
 * @param array<int,array<string,mixed>> $notes
 * @param array<int,array<string,mixed>> $attachments
 */
function renderTicketDetail(
    array $dept,
    array $user,
    array $ticket,
    ?string $statusError = null,
    string $oldResolutionSummary = '',
    array $eligibleAgents = [],
    ?string $reassignError = null,
    array $notes = [],
    ?string $noteError = null,
    array $attachments = [],
    ?string $attachmentError = null,
    array $auditLogs = [],
    array $comments = [],
    ?string $commentError = null,
    array $tags = [],
    ?string $claimError = null,
    array $sharedDeptNames = []
): string {
    $badgeClass = 'badge-' . str_replace('_', '-', (string) $ticket['status']);
    $overdueBadge = ((int) $ticket['is_overdue_live'] === 1)
        ? '<span class="badge badge-on-hold" style="margin-left:.4rem;">overdue</span>'
        : '';

    // T045 — custom_fields is a JSON blob keyed by field_key; look up the matching
    // request_type_fields rows just to resolve human-readable labels for display.
    $customFieldsHtml = '';
    if ($ticket['custom_fields'] !== null && $ticket['request_type_id'] !== null) {
        $values = json_decode((string) $ticket['custom_fields'], true);
        $values = is_array($values) ? $values : [];
        if ($values !== []) {
            $fieldDefs = dbFetchAll(
                'SELECT field_key, label, field_type FROM request_type_fields WHERE request_type_id = :rt_id',
                ['rt_id' => (int) $ticket['request_type_id']]
            );
            $defsByKey = [];
            foreach ($fieldDefs as $def) {
                $defsByKey[(string) $def['field_key']] = $def;
            }
            $rows = '';
            foreach ($values as $key => $value) {
                $def = $defsByKey[(string) $key] ?? null;
                $label = $def !== null ? (string) $def['label'] : (string) $key;
                $display = ($def !== null && (string) $def['field_type'] === 'boolean')
                    ? ((bool) $value ? 'Yes' : 'No')
                    : (string) $value;
                $rows .= '<tr><th>' . htmlspecialchars($label) . '</th><td>' . htmlspecialchars($display) . '</td></tr>';
            }
            $customFieldsHtml = '<h2 style="margin-top:1.5rem;">Request Details</h2><table>' . $rows . '</table>';
        }
    }

    // T048 — tags rendered as small removable badges + a one-field add form, inline right under
    // the status/priority badges (matches where Trackr shows them, near the ticket header).
    $tagsHtml = '';
    foreach ($tags as $tag) {
        $tagsHtml .= '<span class="badge badge-cancelled" style="margin-right:.3rem;">'
            . htmlspecialchars((string) $tag['tag'])
            . ' <form method="post" style="display:inline;" onsubmit="return true;">'
            . csrfField()
            . '<input type="hidden" name="intent" value="remove_tag">'
            . '<input type="hidden" name="id" value="' . (int) $tag['id'] . '">'
            . '<button type="submit" style="background:none; border:none; cursor:pointer; color:inherit; font-size:.75rem; padding:0 0 0 .3rem;" title="Remove tag">&times;</button>'
            . '</form>'
            . '</span>';
    }
    $tagsHtml .= '<form method="post" style="display:inline-flex; gap:.3rem; align-items:center; margin-left:.3rem;">'
        . csrfField()
        . '<input type="hidden" name="intent" value="add_tag">'
        . '<input type="text" name="tag" maxlength="50" placeholder="Add tag" style="width:120px; padding:.2rem .4rem; font-size:.8rem; border:1px solid var(--input); border-radius:4px;">'
        . '<button class="btn btn-outline" type="submit" style="padding:.2rem .6rem; font-size:.8rem;">+</button>'
        . '</form>';

    $nextStatuses = STATUS_TRANSITIONS[(string) $ticket['status']] ?? [];
    $statusFormHtml = '<p class="muted" style="margin-top:1rem;">This ticket is in a terminal state — no further status changes.</p>';
    if ($nextStatuses !== []) {
        $options = '';
        foreach ($nextStatuses as $s) {
            $options .= '<option value="' . htmlspecialchars($s) . '">' . htmlspecialchars($s) . '</option>';
        }
        $errorHtml = $statusError !== null ? '<p class="text-destructive">' . htmlspecialchars($statusError) . '</p>' : '';
        $summaryFieldHtml = in_array('closed', $nextStatuses, true)
            ? '<div class="field"><label>Resolution summary (required to close)</label>
               <textarea name="resolution_summary" rows="3">' . htmlspecialchars($oldResolutionSummary) . '</textarea></div>'
            : '';
        $statusFormHtml = '
        <form method="post" style="margin-top:1rem;">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="change_status">
          <div class="field">
            <label>Change status to</label>
            <select name="new_status">' . $options . '</select>
          </div>
          ' . $summaryFieldHtml . '
          <button class="btn" type="submit">Update</button>
        </form>
        ' . $errorHtml;
    }

    return '
    <main class="container">
      <div class="card">
        <p class="muted"><a href="' . htmlspecialchars(url($dept['slug'] . '/tickets')) . '">&larr; Back to Tickets</a></p>
        <h1>#' . (int) $ticket['id'] . ' — ' . htmlspecialchars((string) $ticket['subject']) . '</h1>
        <p>
          <span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $ticket['status']) . '</span>
          <span class="badge badge-cancelled" style="margin-left:.4rem;">priority: ' . htmlspecialchars((string) $ticket['priority']) . '</span>
          ' . $overdueBadge . ($sharedDeptNames !== [] ? ' <span class="badge badge-cancelled" title="Also submitted to">also: ' . htmlspecialchars(implode(', ', $sharedDeptNames)) . '</span>' : '') . '
        </p>
        <p style="margin-top:.5rem;">' . $tagsHtml . '</p>
        <table style="margin-top:1rem;">
          <tr><th>Requestor</th><td>' . htmlspecialchars((string) $ticket['requestor_email']) . '</td></tr>'
          . ($ticket['request_type_name'] !== null ? '<tr><th>Request Type</th><td>' . htmlspecialchars((string) $ticket['request_type_name']) . '</td></tr>' : '') . '
          <tr><th>Team Leader</th><td>' . htmlspecialchars((string) $ticket['team_leader_name']) . '</td></tr>
          <tr><th>Client</th><td>' . htmlspecialchars((string) $ticket['client_name']) . '</td></tr>
          <tr><th>Assigned to</th><td>' . htmlspecialchars((string) ($ticket['assigned_name'] ?? 'Unassigned')) . '</td></tr>
          <tr><th>Supplier</th><td>' . htmlspecialchars((string) ($ticket['supplier_name'] ?? '—')) . '</td></tr>'
          . ($ticket['budget_amount'] !== null ? '<tr><th>Budget</th><td>' . htmlspecialchars((string) $ticket['budget_amount']) . '</td></tr>' : '') . '
          <tr><th>Created</th><td>' . htmlspecialchars((string) $ticket['created_at']) . '</td></tr>
          <tr><th>Updated</th><td>' . htmlspecialchars((string) $ticket['updated_at']) . '</td></tr>
          <tr><th>SLA deadline</th><td>' . htmlspecialchars((string) ($ticket['sla_deadline'] ?? '—')) . '</td></tr>
        </table>
        <h2 style="margin-top:1.5rem;">Description</h2>
        <p>' . nl2br(htmlspecialchars((string) $ticket['description'])) . '</p>
        ' . $customFieldsHtml . '
        <h2 style="margin-top:1.5rem;">Status</h2>
        ' . $statusFormHtml . '
        <h2 style="margin-top:1.5rem;">Assignment</h2>'
        . ($ticket['assigned_to'] === null ? '
        <form method="post" style="margin-bottom:.75rem;">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="claim">
          <button class="btn btn-outline" type="submit">Claim this ticket</button>
        </form>
        ' . ($claimError !== null ? '<p class="text-destructive">' . htmlspecialchars($claimError) . '</p>' : '') . '
        ' : '') . '
        ' . renderAssignmentForm($ticket, $eligibleAgents, $reassignError) . '
        <h2 style="margin-top:1.5rem;">Comments</h2>
        <p class="muted" style="margin-top:-.5rem;">Visible to the requester too — not internal.</p>
        ' . renderCommentList($comments) . '
        <form method="post" style="margin-top:1rem;">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="add_comment">
          <div class="field">
            <textarea name="body" rows="3" placeholder="Reply to the requester"></textarea>
          </div>
          ' . ($commentError !== null ? '<p class="text-destructive">' . htmlspecialchars($commentError) . '</p>' : '') . '
          <button class="btn btn-outline" type="submit">Add Comment</button>
        </form>
        <h2 style="margin-top:1.5rem;">Internal Notes</h2>
        ' . renderNotesSection($notes, $noteError) . '
        <h2 style="margin-top:1.5rem;">Attachments</h2>
        ' . renderAttachmentsSection($dept, $ticket, $attachments, $attachmentError) . '
        <h2 style="margin-top:1.5rem;">Audit Trail</h2>
        ' . renderAuditTrailSection($auditLogs) . '
      </div>
    </main>';
}

/**
 * @param array<string,mixed> $ticket
 * @param array<int,array<string,mixed>> $attachments
 */
function renderAttachmentsSection(array $dept, array $ticket, array $attachments, ?string $attachmentError): string
{
    $ticketUrl = url($dept['slug'] . '/ticket/' . (int) $ticket['id']);

    $list = $attachments === []
        ? '<p class="muted">No attachments yet.</p>'
        : '<table><thead><tr><th>File</th><th>Size</th><th>Uploaded</th><th></th></tr></thead><tbody>';
    foreach ($attachments as $a) {
        $downloadUrl = $ticketUrl . '?download=' . (int) $a['id'];
        $list .= '<tr>'
            . '<td>' . htmlspecialchars((string) $a['file_name']) . '</td>'
            . '<td>' . (int) $a['file_size_kb'] . ' KB</td>'
            . '<td class="muted">' . htmlspecialchars((string) $a['uploaded_at']) . '</td>'
            . '<td><a class="btn btn-outline" href="' . htmlspecialchars($downloadUrl) . '">Download</a></td>'
            . '</tr>';
    }
    if ($attachments !== []) {
        $list .= '</tbody></table>';
    }

    $errorHtml = $attachmentError !== null ? '<p class="text-destructive">' . htmlspecialchars($attachmentError) . '</p>' : '';
    $allowedExt = implode(', ', ALLOWED_UPLOAD_EXTENSIONS);

    return $list . '
    <form method="post" enctype="multipart/form-data" style="margin-top:1rem;">
      ' . csrfField() . '
      <input type="hidden" name="intent" value="upload_attachment">
      <div class="field">
        <label>Add attachment (' . htmlspecialchars($allowedExt) . '; max ' . MAX_UPLOAD_SIZE_KB . ' KB)</label>
        <input type="file" name="attachment">
      </div>
      ' . $errorHtml . '
      <button class="btn btn-outline" type="submit">Upload</button>
    </form>';
}

/**
 * @param array<int,array<string,mixed>> $notes
 */
function renderNotesSection(array $notes, ?string $noteError): string
{
    $list = $notes === []
        ? '<p class="muted">No internal notes yet.</p>'
        : '';
    foreach ($notes as $note) {
        $list .= '<div style="border-bottom:1px solid var(--border); padding:.5rem 0;">'
            . '<p style="margin:0;">' . nl2br(htmlspecialchars((string) $note['message'])) . '</p>'
            . '<p class="muted" style="margin:.25rem 0 0; font-size:.8rem;">'
            . htmlspecialchars((string) $note['agent_name']) . ' — ' . htmlspecialchars((string) $note['created_at'])
            . '</p></div>';
    }

    $errorHtml = $noteError !== null ? '<p class="text-destructive">' . htmlspecialchars($noteError) . '</p>' : '';

    return $list . '
    <form method="post" style="margin-top:1rem;">
      ' . csrfField() . '
      <input type="hidden" name="intent" value="add_note">
      <div class="field">
        <textarea name="message" rows="3" placeholder="Add an internal note (not visible to the requestor)"></textarea>
      </div>
      ' . $errorHtml . '
      <button class="btn btn-outline" type="submit">Add Note</button>
    </form>';
}

/**
 * @param array<int,array<string,mixed>> $auditLogs
 */
function renderAuditTrailSection(array $auditLogs): string
{
    if ($auditLogs === []) {
        return '<p class="muted">No audit history yet.</p>';
    }

    $rows = '';
    foreach ($auditLogs as $log) {
        $actor = $log['actor_name'] !== null ? htmlspecialchars((string) $log['actor_name']) : 'System';
        $oldValue = $log['old_value'] !== null ? htmlspecialchars((string) $log['old_value']) : '—';
        $newValue = $log['new_value'] !== null ? htmlspecialchars((string) $log['new_value']) : '—';
        $rows .= '<tr>'
            . '<td>' . htmlspecialchars((string) $log['timestamp']) . '</td>'
            . '<td>' . $actor . '</td>'
            . '<td>' . htmlspecialchars((string) $log['action_type']) . '</td>'
            . '<td>' . $oldValue . ' &rarr; ' . $newValue . '</td>'
            . '</tr>';
    }

    return '<table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Change</th></tr></thead><tbody>'
        . $rows . '</tbody></table>';
}

/**
 * @param array<string,mixed> $ticket
 * @param array<int,array<string,mixed>> $eligibleAgents
 */
function renderAssignmentForm(array $ticket, array $eligibleAgents, ?string $reassignError): string
{
    if ($eligibleAgents === []) {
        return '<p class="muted">No agents in this department can currently accept tickets.</p>';
    }

    $currentAssignedTo = $ticket['assigned_to'] !== null ? (int) $ticket['assigned_to'] : null;
    $options = '<option value=""' . ($currentAssignedTo === null ? ' selected' : '') . '>Unassigned</option>';
    foreach ($eligibleAgents as $agent) {
        $selected = $currentAssignedTo === (int) $agent['id'] ? ' selected' : '';
        $options .= '<option value="' . (int) $agent['id'] . '"' . $selected . '>' . htmlspecialchars((string) $agent['name']) . '</option>';
    }

    $errorHtml = $reassignError !== null ? '<p class="text-destructive">' . htmlspecialchars($reassignError) . '</p>' : '';

    return '
    <form method="post" style="margin-top:.5rem;">
      ' . csrfField() . '
      <input type="hidden" name="intent" value="reassign">
      <div class="field">
        <label>Assigned agent</label>
        <select name="assigned_to">' . $options . '</select>
      </div>
      <button class="btn" type="submit">Reassign</button>
    </form>
    ' . $errorHtml;
}

// ── Knowledge base (T034) — department agents author for their own department only ────────────

function handleDepartmentKb(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/kb');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl, (int) $dept['id']);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    // View-As grants read access only (T025), same rule as ticket mutations.
    if (getViewAsContext() !== null && $_SERVER['REQUEST_METHOD'] === 'POST') {
        send403();
        return;
    }

    $formError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_kb_article') {
        $formError = applySaveKbArticle((int) $dept['id']);
        if ($formError === null) {
            header('Location: ' . $selfUrl);
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_kb_article') {
        $handled = handleDeleteKbArticle($dept, $selfUrl);
        if ($handled) {
            return; // confirmation screen rendered, or already redirected after real deletion
        }
    }

    $articles = dbFetchAll(
        'SELECT id, title, content, created_at FROM knowledge_base WHERE department_id = :dept_id ORDER BY created_at DESC',
        ['dept_id' => (int) $dept['id']]
    );

    $content = renderKnowledgeBasePage($dept, $articles, $formError);
    renderPage($dept['name'] . ' Knowledge Base', renderDepartmentShell($dept, $user, 'kb', $content));
}

// $departmentId comes from the already dept-isolated route, never from request input — so a
// posted article id can only ever match a row re-checked against that same department below.
function applySaveKbArticle(int $departmentId): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $title = trim((string) ($_POST['title'] ?? ''));
    $content = trim((string) ($_POST['content'] ?? ''));

    if ($title === '' || mb_strlen($title) > 255) {
        return 'Title is required (max 255 characters).';
    }
    if ($content === '') {
        return 'Content is required.';
    }

    if ($id !== null) {
        $existing = dbFetchOne('SELECT id FROM knowledge_base WHERE id = :id AND department_id = :dept_id', ['id' => $id, 'dept_id' => $departmentId]);
        if ($existing === null) {
            return 'Article not found.';
        }
        dbUpdate('knowledge_base', ['title' => $title, 'content' => $content], 'id = :id', ['id' => $id]);
    } else {
        dbInsert('knowledge_base', ['title' => $title, 'content' => $content, 'department_id' => $departmentId]);
    }

    return null;
}

// Two-step delete (T027 pattern), scoped to this department the same way applySaveKbArticle() is.
function handleDeleteKbArticle(array $dept, string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $article = dbFetchOne('SELECT id, title FROM knowledge_base WHERE id = :id AND department_id = :dept_id', ['id' => $id, 'dept_id' => (int) $dept['id']]);
    if ($article === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Delete Article?',
            'This will permanently delete "' . $article['title'] . '".',
            $selfUrl,
            ['intent' => 'delete_kb_article', 'id' => $id]
        );
        return true;
    }

    dbDelete('knowledge_base', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl);
    exit;
}

/**
 * @param array<int,array<string,mixed>> $articles
 */
function renderKnowledgeBasePage(array $dept, array $articles, ?string $formError): string
{
    $selfUrl = url($dept['slug'] . '/kb');
    $backUrl = url($dept['slug'] . '/');

    $list = $articles === []
        ? '<p class="muted">No articles yet.</p>'
        : '';
    foreach ($articles as $a) {
        $editJs = "document.getElementById('kb_id').value='" . (int) $a['id'] . "';"
            . "document.getElementById('kb_title').value=" . json_encode((string) $a['title']) . ";"
            . "document.getElementById('kb_content').value=" . json_encode((string) $a['content']) . ";"
            . "document.getElementById('kb_form').scrollIntoView();";
        $list .= '<div class="card" style="margin-bottom:1rem;">'
            . '<div style="display:flex; justify-content:space-between; align-items:flex-start;">'
            . '<h3 style="margin:0;">' . htmlspecialchars((string) $a['title']) . '</h3>'
            . '<span class="muted" style="font-size:.8rem;">' . htmlspecialchars((string) $a['created_at']) . '</span>'
            . '</div>'
            . '<p style="white-space:pre-wrap;">' . nl2br(htmlspecialchars((string) $a['content'])) . '</p>'
            . '<button class="btn btn-outline" type="button" onclick="' . htmlspecialchars($editJs) . '">Edit</button> '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . csrfField()
            . '<input type="hidden" name="intent" value="delete_kb_article">'
            . '<input type="hidden" name="id" value="' . (int) $a['id'] . '">'
            . '<button class="btn btn-danger" type="submit">Delete</button>'
            . '</form>'
            . '</div>';
    }

    $errorHtml = $formError !== null ? '<p class="text-destructive">' . htmlspecialchars($formError) . '</p>' : '';

    return '
    <main class="container">
      <div class="card" style="margin-bottom:1.5rem;">
        <p class="muted"><a href="' . htmlspecialchars($backUrl) . '">&larr; Back to ' . htmlspecialchars($dept['name']) . '</a></p>
        <h1>' . htmlspecialchars($dept['name']) . ' Knowledge Base</h1>
      </div>
      ' . $list . '
      <div class="card" id="kb_form">
        <h2>Add / Edit Article</h2>
        ' . $errorHtml . '
        <form method="post" action="' . htmlspecialchars($selfUrl) . '">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="save_kb_article">
          <input type="hidden" name="id" id="kb_id" value="">
          <div class="field"><label>Title</label><input type="text" name="title" id="kb_title" maxlength="255" required></div>
          <div class="field"><label>Content</label><textarea name="content" id="kb_content" rows="6" required></textarea></div>
          <button class="btn" type="submit">Save</button>
        </form>
      </div>
    </main>';
}

// ── FAQ (T044) — same department-agent authorship model as Knowledge Base (T034), but publicly
// visible on the portal (public_controller.php reads faq_items directly, ordered by sort_order).

function handleDepartmentFaq(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/faq');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl, (int) $dept['id']);
    if ($user === null) {
        return;
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return;
    }

    if (getViewAsContext() !== null && $_SERVER['REQUEST_METHOD'] === 'POST') {
        send403();
        return;
    }

    $formError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_faq_item') {
        $formError = applySaveFaqItem((int) $dept['id']);
        if ($formError === null) {
            header('Location: ' . $selfUrl);
            exit;
        }
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_faq_item') {
        $handled = handleDeleteFaqItem($dept, $selfUrl);
        if ($handled) {
            return;
        }
    }

    $items = dbFetchAll(
        'SELECT id, question, answer, sort_order, created_at FROM faq_items WHERE department_id = :dept_id ORDER BY sort_order, id',
        ['dept_id' => (int) $dept['id']]
    );

    $content = renderFaqPage($dept, $items, $formError);
    renderPage($dept['name'] . ' FAQ', renderDepartmentShell($dept, $user, 'faq', $content));
}

function applySaveFaqItem(int $departmentId): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $question = trim((string) ($_POST['question'] ?? ''));
    $answer = trim((string) ($_POST['answer'] ?? ''));
    $sortOrder = isset($_POST['sort_order']) && ctype_digit((string) $_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

    if ($question === '' || mb_strlen($question) > 255) {
        return 'Question is required (max 255 characters).';
    }
    if ($answer === '') {
        return 'Answer is required.';
    }

    if ($id !== null) {
        $existing = dbFetchOne('SELECT id FROM faq_items WHERE id = :id AND department_id = :dept_id', ['id' => $id, 'dept_id' => $departmentId]);
        if ($existing === null) {
            return 'FAQ item not found.';
        }
        dbUpdate('faq_items', ['question' => $question, 'answer' => $answer, 'sort_order' => $sortOrder], 'id = :id', ['id' => $id]);
    } else {
        dbInsert('faq_items', ['question' => $question, 'answer' => $answer, 'sort_order' => $sortOrder, 'department_id' => $departmentId]);
    }

    return null;
}

function handleDeleteFaqItem(array $dept, string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $item = dbFetchOne('SELECT id, question FROM faq_items WHERE id = :id AND department_id = :dept_id', ['id' => $id, 'dept_id' => (int) $dept['id']]);
    if ($item === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Delete FAQ Item?',
            'This will permanently delete "' . $item['question'] . '".',
            $selfUrl,
            ['intent' => 'delete_faq_item', 'id' => $id]
        );
        return true;
    }

    dbDelete('faq_items', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl);
    exit;
}

/**
 * @param array<int,array<string,mixed>> $items
 */
function renderFaqPage(array $dept, array $items, ?string $formError): string
{
    $selfUrl = url($dept['slug'] . '/faq');
    $backUrl = url($dept['slug'] . '/');

    $list = $items === []
        ? '<p class="muted">No FAQ items yet.</p>'
        : '';
    foreach ($items as $item) {
        $list .= '<div class="card" style="margin-bottom:1rem;">'
            . '<div style="display:flex; justify-content:space-between; align-items:flex-start;">'
            . '<h3 style="margin:0;">' . htmlspecialchars((string) $item['question']) . '</h3>'
            . '<span class="muted" style="font-size:.8rem;">order: ' . (int) $item['sort_order'] . '</span>'
            . '</div>'
            . '<p style="white-space:pre-wrap;">' . nl2br(htmlspecialchars((string) $item['answer'])) . '</p>'
            . '<button class="btn btn-outline" type="button" onclick="'
            . htmlspecialchars(
                "document.getElementById('faq_id').value='" . (int) $item['id'] . "';"
                . "document.getElementById('faq_question').value=" . json_encode((string) $item['question']) . ";"
                . "document.getElementById('faq_answer').value=" . json_encode((string) $item['answer']) . ";"
                . "document.getElementById('faq_sort_order').value='" . (int) $item['sort_order'] . "';"
                . "document.getElementById('faq_form').scrollIntoView();"
            )
            . '">Edit</button> '
            . '<form method="post" action="' . htmlspecialchars($selfUrl) . '" style="display:inline;">'
            . csrfField()
            . '<input type="hidden" name="intent" value="delete_faq_item">'
            . '<input type="hidden" name="id" value="' . (int) $item['id'] . '">'
            . '<button class="btn btn-danger" type="submit">Delete</button>'
            . '</form>'
            . '</div>';
    }

    $errorHtml = $formError !== null ? '<p class="text-destructive">' . htmlspecialchars($formError) . '</p>' : '';

    return '
    <main class="container">
      <div class="card" style="margin-bottom:1.5rem;">
        <p class="muted"><a href="' . htmlspecialchars($backUrl) . '">&larr; Back to ' . htmlspecialchars($dept['name']) . '</a></p>
        <h1>' . htmlspecialchars($dept['name']) . ' FAQ</h1>
        <p class="muted">Shown publicly on the ticket submission form once a requestor picks this department.</p>
      </div>
      ' . $list . '
      <div class="card" id="faq_form">
        <h2>Add / Edit FAQ Item</h2>
        ' . $errorHtml . '
        <form method="post" action="' . htmlspecialchars($selfUrl) . '">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="save_faq_item">
          <input type="hidden" name="id" id="faq_id" value="">
          <div class="field"><label>Question</label><input type="text" name="question" id="faq_question" maxlength="255" required></div>
          <div class="field"><label>Answer</label><textarea name="answer" id="faq_answer" rows="4" required></textarea></div>
          <div class="field"><label>Order (lower shows first)</label><input type="number" name="sort_order" id="faq_sort_order" value="0" min="0"></div>
          <button class="btn" type="submit">Save</button>
        </form>
      </div>
    </main>';
}

// ── Request Types (T045) — configurable per-department request types with dynamic custom
// fields, same department-agent authorship model as KB/FAQ. A request type's fields are only
// ever reachable through a type already confirmed to belong to this department, so every field
// mutation re-verifies via a JOIN back to request_types.department_id, not just the field id.

function handleDepartmentRequestTypes(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/request-types');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl, (int) $dept['id']);
    if ($user === null) {
        return;
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return;
    }
    if (getViewAsContext() !== null && $_SERVER['REQUEST_METHOD'] === 'POST') {
        send403();
        return;
    }

    $typeFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_request_type') {
        $typeFormError = applySaveRequestType((int) $dept['id']);
        if ($typeFormError === null) {
            header('Location: ' . $selfUrl);
            exit;
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_request_type') {
        if (handleDeleteRequestType($dept, $selfUrl)) {
            return;
        }
    }

    $fieldFormError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'save_request_type_field') {
        $fieldFormError = applySaveRequestTypeField((int) $dept['id']);
        if ($fieldFormError === null) {
            header('Location: ' . $selfUrl);
            exit;
        }
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'delete_request_type_field') {
        if (handleDeleteRequestTypeField($dept, $selfUrl)) {
            return;
        }
    }

    $types = dbFetchAll(
        'SELECT id, name, icon, sort_order FROM request_types WHERE department_id = :dept_id ORDER BY sort_order, id',
        ['dept_id' => (int) $dept['id']]
    );
    $fieldsByType = [];
    foreach ($types as $type) {
        $fieldsByType[(int) $type['id']] = dbFetchAll(
            'SELECT id, label, field_key, field_type, is_required, field_options, sort_order
             FROM request_type_fields WHERE request_type_id = :rt_id ORDER BY sort_order, id',
            ['rt_id' => (int) $type['id']]
        );
    }

    $content = renderRequestTypesPage($dept, $types, $fieldsByType, $typeFormError, $fieldFormError);
    renderPage($dept['name'] . ' Request Types', renderDepartmentShell($dept, $user, 'request-types', $content));
}

function applySaveRequestType(int $departmentId): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $name = trim((string) ($_POST['name'] ?? ''));
    $icon = trim((string) ($_POST['icon'] ?? ''));
    $sortOrder = isset($_POST['sort_order']) && ctype_digit((string) $_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

    if ($name === '' || mb_strlen($name) > 150) {
        return 'Name is required (max 150 characters).';
    }
    // PHP-side default, not a SQL DEFAULT — see database.sql's comment on request_types.icon for
    // why (a multi-byte literal survives fine through PDO's utf8mb4 connection, unlike this box's
    // shell/mysql-CLI pipeline).
    if ($icon === '') {
        $icon = '🎫';
    }
    $icon = mb_substr($icon, 0, 8);

    $data = ['department_id' => $departmentId, 'name' => $name, 'icon' => $icon, 'sort_order' => $sortOrder];

    if ($id !== null) {
        $existing = dbFetchOne('SELECT id FROM request_types WHERE id = :id AND department_id = :dept_id', ['id' => $id, 'dept_id' => $departmentId]);
        if ($existing === null) {
            return 'Request type not found.';
        }
        dbUpdate('request_types', ['name' => $name, 'icon' => $icon, 'sort_order' => $sortOrder], 'id = :id', ['id' => $id]);
    } else {
        dbInsert('request_types', $data);
    }

    return null;
}

function handleDeleteRequestType(array $dept, string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $type = dbFetchOne('SELECT id, name FROM request_types WHERE id = :id AND department_id = :dept_id', ['id' => $id, 'dept_id' => (int) $dept['id']]);
    if ($type === null) {
        return false;
    }

    if (!isConfirmed()) {
        $fieldCount = (int) (dbFetchOne('SELECT COUNT(*) AS cnt FROM request_type_fields WHERE request_type_id = :id', ['id' => $id])['cnt'] ?? 0);
        renderConfirmation(
            'Delete Request Type?',
            'This will permanently delete "' . $type['name'] . '" and its ' . $fieldCount . ' custom field(s). '
                . 'Existing tickets already submitted under this type are not deleted (their request_type_id becomes empty).',
            url($dept['slug'] . '/request-types'),
            ['intent' => 'delete_request_type', 'id' => $id]
        );
        return true;
    }

    dbDelete('request_types', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl);
    exit;
}

function applySaveRequestTypeField(int $departmentId): ?string
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    $requestTypeId = isset($_POST['request_type_id']) && ctype_digit((string) $_POST['request_type_id']) ? (int) $_POST['request_type_id'] : null;
    $label = trim((string) ($_POST['label'] ?? ''));
    $fieldKey = strtolower(trim((string) ($_POST['field_key'] ?? '')));
    $fieldType = (string) ($_POST['field_type'] ?? 'text');
    $isRequired = isset($_POST['is_required']) ? 1 : 0;
    $optionsRaw = trim((string) ($_POST['field_options'] ?? ''));
    $sortOrder = isset($_POST['sort_order']) && ctype_digit((string) $_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

    if ($requestTypeId === null || dbFetchOne('SELECT id FROM request_types WHERE id = :id AND department_id = :dept_id', ['id' => $requestTypeId, 'dept_id' => $departmentId]) === null) {
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
        $existingField = dbFetchOne(
            'SELECT rtf.id FROM request_type_fields rtf JOIN request_types rt ON rt.id = rtf.request_type_id
             WHERE rtf.id = :id AND rt.department_id = :dept_id',
            ['id' => $id, 'dept_id' => $departmentId]
        );
        if ($existingField === null) {
            return 'Field not found.';
        }
        dbUpdate('request_type_fields', $data, 'id = :id', ['id' => $id]);
    } else {
        dbInsert('request_type_fields', $data);
    }

    return null;
}

function handleDeleteRequestTypeField(array $dept, string $selfUrl): bool
{
    $id = isset($_POST['id']) && ctype_digit((string) $_POST['id']) ? (int) $_POST['id'] : null;
    if ($id === null) {
        return false;
    }

    $field = dbFetchOne(
        'SELECT rtf.id, rtf.label FROM request_type_fields rtf JOIN request_types rt ON rt.id = rtf.request_type_id
         WHERE rtf.id = :id AND rt.department_id = :dept_id',
        ['id' => $id, 'dept_id' => (int) $dept['id']]
    );
    if ($field === null) {
        return false;
    }

    if (!isConfirmed()) {
        renderConfirmation(
            'Delete Field?',
            'This will permanently delete the "' . $field['label'] . '" field.',
            $selfUrl,
            ['intent' => 'delete_request_type_field', 'id' => $id]
        );
        return true;
    }

    dbDelete('request_type_fields', 'id = :id', ['id' => $id]);
    header('Location: ' . $selfUrl);
    exit;
}

/**
 * @param array<int,array<string,mixed>> $types
 * @param array<int,array<int,array<string,mixed>>> $fieldsByType
 */
function renderRequestTypesPage(array $dept, array $types, array $fieldsByType, ?string $typeFormError, ?string $fieldFormError): string
{
    $selfUrl = url($dept['slug'] . '/request-types');
    $backUrl = url($dept['slug'] . '/');

    $typesHtml = $types === [] ? '<p class="muted">No request types yet — requestors get the plain submission form.</p>' : '';
    foreach ($types as $type) {
        $typeId = (int) $type['id'];
        $fields = $fieldsByType[$typeId] ?? [];

        $fieldRows = $fields === []
            ? '<tr><td colspan="5" class="muted">No custom fields yet.</td></tr>'
            : '';
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
            . "document.getElementById('rt_sort_order').value='" . (int) $type['sort_order'] . "';"
            . "document.getElementById('rt_form').scrollIntoView();";

        $typeOptions = '';
        foreach (REQUEST_FIELD_TYPES as $ft) {
            $typeOptions .= '<option value="' . htmlspecialchars($ft) . '">' . htmlspecialchars($ft) . '</option>';
        }

        $typesHtml .= '
        <div class="card" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 style="margin:0;">' . htmlspecialchars((string) $type['icon']) . ' ' . htmlspecialchars((string) $type['name']) . '</h3>
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
          <form method="post" action="' . htmlspecialchars($selfUrl) . '">'
            . csrfField()
            . '<input type="hidden" name="intent" value="save_request_type_field">
            <input type="hidden" name="request_type_id" value="' . $typeId . '">
            <input type="hidden" name="id" id="rtf_id_' . $typeId . '" value="">
            <div class="field"><label>Label</label><input type="text" name="label" id="rtf_label_' . $typeId . '" maxlength="150" required></div>
            <div class="field"><label>Key (lowercase_with_underscores)</label><input type="text" name="field_key" id="rtf_key_' . $typeId . '" pattern="[a-z0-9_]+" required></div>
            <div class="field"><label>Field type</label><select name="field_type" id="rtf_type_' . $typeId . '">' . $typeOptions . '</select></div>
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
    <main class="container">
      <div class="card" style="margin-bottom:1.5rem;">
        <p class="muted"><a href="' . htmlspecialchars($backUrl) . '">&larr; Back to ' . htmlspecialchars($dept['name']) . '</a></p>
        <h1>' . htmlspecialchars($dept['name']) . ' Request Types</h1>
        <p class="muted">Shown as a picker on the public submission form once a requestor picks this department. A department with no request types just gets the plain form.</p>
      </div>
      ' . $fieldErrorHtml . $typesHtml . '
      <div class="card" id="rt_form">
        <h2>Add / Edit Request Type</h2>
        ' . $typeErrorHtml . '
        <form method="post" action="' . htmlspecialchars($selfUrl) . '">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="save_request_type">
          <input type="hidden" name="id" id="rt_id" value="">
          <div class="field"><label>Name</label><input type="text" name="name" id="rt_name" maxlength="150" required></div>
          <div class="field"><label>Icon (single emoji, optional)</label><input type="text" name="icon" id="rt_icon" maxlength="8"></div>
          <div class="field"><label>Order</label><input type="number" name="sort_order" id="rt_sort_order" value="0" min="0"></div>
          <button class="btn" type="submit">Save</button>
        </form>
      </div>
    </main>';
}
