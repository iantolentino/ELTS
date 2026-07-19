<?php
declare(strict_types=1);

const DASHBOARD_PAGE_SIZE = 25;
const VALID_TICKET_STATUSES = ['open', 'on-hold', 'closed', 'cancelled'];

// Computed live on every read rather than trusting/maintaining the stored `is_overdue` column —
// there's no cron/scheduler in this project, and computing in SQL (not PHP) avoids the exact
// PHP/MySQL timezone mismatch that broke the cache in T018/F002.
const IS_OVERDUE_SQL = "(sla_deadline IS NOT NULL AND sla_deadline < NOW() AND status NOT IN ('closed','cancelled')) AS is_overdue_live";

// closed/cancelled are terminal by design — no transitions out (also covers "closed -> closed").
const STATUS_TRANSITIONS = [
    'open' => ['on-hold', 'closed', 'cancelled'],
    'on-hold' => ['open', 'closed', 'cancelled'],
    'closed' => [],
    'cancelled' => [],
];

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

    send404();
}

function handleDepartmentDashboard(array $dept): void
{
    $selfUrl = url($dept['slug'] . '/');
    handleLogoutIfRequested($selfUrl);

    $user = requireLogin($dept['name'] . ' Login', $selfUrl);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    $page = isset($_GET['page']) && ctype_digit((string) $_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $statusFilter = (string) ($_GET['status'] ?? '');
    if (!in_array($statusFilter, VALID_TICKET_STATUSES, true)) {
        $statusFilter = '';
    }

    $where = 'department_id = :dept_id';
    $params = ['dept_id' => (int) $dept['id']];
    if ($statusFilter !== '') {
        $where .= ' AND status = :status';
        $params['status'] = $statusFilter;
    }

    $total = (int) (dbFetchOne("SELECT COUNT(*) AS cnt FROM tickets WHERE $where", $params)['cnt'] ?? 0);

    $perPage = DASHBOARD_PAGE_SIZE;
    $offset = (max(1, $page) - 1) * $perPage;
    // LIMIT/OFFSET can't be bound as named params under real prepared statements (db.php sets
    // EMULATE_PREPARES=false) — MySQL's native protocol requires them as integers, but
    // PDOStatement::execute(array) always binds as PARAM_STR. Both values are guaranteed ints
    // (cast above), never raw request input, so inlining them here is safe.
    $tickets = dbFetchAll(
        "SELECT id, subject, status, priority, requestor_email, created_at, " . IS_OVERDUE_SQL . "
         FROM tickets WHERE $where ORDER BY created_at DESC LIMIT $perPage OFFSET $offset",
        $params
    );

    // 60s read-through cache — dashboards for a busy department get hit far more often than the
    // underlying ticket volume changes, so this absorbs repeated aggregate queries (T019).
    $stats = cacheRemember('dept_stats_' . $dept['id'], 60, function () use ($dept) {
        $rows = dbFetchAll(
            'SELECT status, COUNT(*) AS cnt FROM tickets WHERE department_id = :dept_id GROUP BY status',
            ['dept_id' => (int) $dept['id']]
        );
        $counts = array_fill_keys(VALID_TICKET_STATUSES, 0);
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['cnt'];
        }
        return $counts;
    });

    $content = renderDashboardContent($dept, $user, $tickets, $total, $page, $perPage, $statusFilter, $stats);
    renderPage($dept['name'], $content);
}

/**
 * @param array<int,array<string,mixed>> $tickets
 * @param array<string,int> $stats
 */
function renderDashboardContent(
    array $dept,
    array $user,
    array $tickets,
    int $total,
    int $page,
    int $perPage,
    string $statusFilter,
    array $stats = []
): string {
    $selfUrl = url($dept['slug'] . '/');

    $statusOptions = '<option value="">All statuses</option>';
    foreach (VALID_TICKET_STATUSES as $status) {
        $selected = $statusFilter === $status ? ' selected' : '';
        $statusOptions .= '<option value="' . htmlspecialchars($status) . '"' . $selected . '>' . htmlspecialchars($status) . '</option>';
    }

    $rows = '';
    if ($tickets === []) {
        $rows = '<tr><td colspan="6" class="muted">No tickets match this filter.</td></tr>';
    }
    foreach ($tickets as $t) {
        $badgeClass = 'badge-' . str_replace('_', '-', (string) $t['status']);
        $ticketUrl = url($dept['slug'] . '/ticket/' . (int) $t['id']);
        $overdueTag = ((int) $t['is_overdue_live'] === 1)
            ? ' <span class="badge badge-on-hold">overdue</span>'
            : '';
        $rows .= '<tr>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">#' . (int) $t['id'] . '</a></td>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">' . htmlspecialchars((string) $t['subject']) . '</a>' . $overdueTag . '</td>'
            . '<td><span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $t['status']) . '</span></td>'
            . '<td>' . htmlspecialchars((string) $t['priority']) . '</td>'
            . '<td>' . htmlspecialchars((string) $t['requestor_email']) . '</td>'
            . '<td class="muted">' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '</tr>';
    }

    $totalPages = max(1, (int) ceil($total / $perPage));
    $pagerHtml = '';
    if ($totalPages > 1) {
        $prevDisabled = $page <= 1;
        $nextDisabled = $page >= $totalPages;
        $qs = $statusFilter !== '' ? '&status=' . urlencode($statusFilter) : '';
        $pagerHtml = '<div style="display:flex; gap:.5rem; align-items:center; margin-top:1rem;">'
            . ($prevDisabled ? '' : '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?page=' . ($page - 1) . $qs) . '">Previous</a>')
            . '<span class="muted">Page ' . $page . ' of ' . $totalPages . ' (' . $total . ' tickets)</span>'
            . ($nextDisabled ? '' : '<a class="btn btn-outline" href="' . htmlspecialchars($selfUrl . '?page=' . ($page + 1) . $qs) . '">Next</a>')
            . '</div>';
    } else {
        $pagerHtml = '<p class="muted" style="margin-top:1rem;">' . $total . ' ticket' . ($total === 1 ? '' : 's') . '</p>';
    }

    $statTiles = '';
    foreach (VALID_TICKET_STATUSES as $status) {
        $badgeClass = 'badge-' . str_replace('_', '-', $status);
        $statTiles .= '<div class="card" style="padding:.9rem 1.1rem;">'
            . '<div class="muted" style="font-size:.75rem; text-transform:uppercase;">' . htmlspecialchars($status) . '</div>'
            . '<div style="font-size:1.4rem; font-weight:600;">' . (int) ($stats[$status] ?? 0) . '</div>'
            . '</div>';
    }

    return '
    <main class="container">
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:.75rem; margin-bottom:1.5rem;">' . $statTiles . '</div>
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h1>' . htmlspecialchars($dept['name']) . '</h1>
            <p class="muted">Logged in as ' . htmlspecialchars($user['name']) . ' (' . htmlspecialchars($user['role']) . ').
            <a href="' . htmlspecialchars($selfUrl . '?logout=1') . '">Log out</a></p>
          </div>
        </div>
        <form method="get" action="' . htmlspecialchars($selfUrl) . '" style="max-width:220px;">
          <div class="field">
            <label>Filter by status</label>
            <select name="status" onchange="this.form.submit()">' . $statusOptions . '</select>
          </div>
        </form>
        <table>
          <thead><tr><th>ID</th><th>Subject</th><th>Status</th><th>Priority</th><th>Requestor</th><th>Created</th></tr></thead>
          <tbody>' . $rows . '</tbody>
        </table>
        ' . $pagerHtml . '
      </div>
    </main>';
}

function handleDepartmentTicket(array $dept, int $ticketId): void
{
    $actionUrl = url($dept['slug'] . '/ticket/' . $ticketId);

    $user = requireLogin($dept['name'] . ' Login', $actionUrl);
    if ($user === null) {
        return; // login form already rendered
    }
    if (!requireDepartmentAccess($user, (int) $dept['id'])) {
        return; // 403 already rendered
    }

    // Must match department_id here too, not just check the agent's own access to $dept above —
    // otherwise /it/ticket/{id} could render an HR ticket if that numeric id happens to exist.
    $ticket = dbFetchOne(
        'SELECT t.*, u.name AS assigned_name, ' . IS_OVERDUE_SQL . '
         FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.id = :id AND t.department_id = :dept_id',
        ['id' => $ticketId, 'dept_id' => (int) $dept['id']]
    );
    if ($ticket === null) {
        send404();
        return;
    }

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
            'SELECT t.*, u.name AS assigned_name, ' . IS_OVERDUE_SQL . ' FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to WHERE t.id = :id',
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
            'SELECT t.*, u.name AS assigned_name, ' . IS_OVERDUE_SQL . ' FROM tickets t LEFT JOIN users u ON u.id = t.assigned_to WHERE t.id = :id',
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

    renderPage('Ticket #' . $ticketId, renderTicketDetail(
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
        $attachmentError
    ));
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
    dbInsert('audit_logs', [
        'ticket_id' => $ticketId,
        'actor_id' => $actorId,
        'action_type' => 'REASSIGN',
        'old_value' => $oldAssignedTo !== null ? (string) $oldAssignedTo : null,
        'new_value' => $newAssignedTo !== null ? (string) $newAssignedTo : null,
    ]);

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

    if ($newStatus === 'closed') {
        dbInsert('audit_logs', [
            'ticket_id' => $ticketId,
            'actor_id' => $actorId,
            'action_type' => 'RESOLUTION_SUMMARY',
            'old_value' => null,
            'new_value' => $resolutionSummary,
        ]);
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
    ?string $attachmentError = null
): string {
    $badgeClass = 'badge-' . str_replace('_', '-', (string) $ticket['status']);
    $overdueBadge = ((int) $ticket['is_overdue_live'] === 1)
        ? '<span class="badge badge-on-hold" style="margin-left:.4rem;">overdue</span>'
        : '';

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
        <p class="muted"><a href="' . htmlspecialchars(url($dept['slug'] . '/')) . '">&larr; Back to ' . htmlspecialchars($dept['name']) . '</a></p>
        <h1>#' . (int) $ticket['id'] . ' — ' . htmlspecialchars((string) $ticket['subject']) . '</h1>
        <p>
          <span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $ticket['status']) . '</span>
          <span class="badge badge-cancelled" style="margin-left:.4rem;">priority: ' . htmlspecialchars((string) $ticket['priority']) . '</span>
          ' . $overdueBadge . '
        </p>
        <table style="margin-top:1rem;">
          <tr><th>Requestor</th><td>' . htmlspecialchars((string) $ticket['requestor_email']) . '</td></tr>
          <tr><th>Assigned to</th><td>' . htmlspecialchars((string) ($ticket['assigned_name'] ?? 'Unassigned')) . '</td></tr>
          <tr><th>Supplier</th><td>' . htmlspecialchars((string) ($ticket['supplier_name'] ?? '—')) . '</td></tr>
          <tr><th>Created</th><td>' . htmlspecialchars((string) $ticket['created_at']) . '</td></tr>
          <tr><th>Updated</th><td>' . htmlspecialchars((string) $ticket['updated_at']) . '</td></tr>
          <tr><th>SLA deadline</th><td>' . htmlspecialchars((string) ($ticket['sla_deadline'] ?? '—')) . '</td></tr>
        </table>
        <h2 style="margin-top:1.5rem;">Description</h2>
        <p>' . nl2br(htmlspecialchars((string) $ticket['description'])) . '</p>
        <h2 style="margin-top:1.5rem;">Status</h2>
        ' . $statusFormHtml . '
        <h2 style="margin-top:1.5rem;">Assignment</h2>
        ' . renderAssignmentForm($ticket, $eligibleAgents, $reassignError) . '
        <h2 style="margin-top:1.5rem;">Internal Notes</h2>
        ' . renderNotesSection($notes, $noteError) . '
        <h2 style="margin-top:1.5rem;">Attachments</h2>
        ' . renderAttachmentsSection($dept, $ticket, $attachments, $attachmentError) . '
        <p class="muted" style="margin-top:1.5rem;">(Full audit history is wired in T031.)</p>
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
      <input type="hidden" name="intent" value="add_note">
      <div class="field">
        <textarea name="message" rows="3" placeholder="Add an internal note (not visible to the requestor)"></textarea>
      </div>
      ' . $errorHtml . '
      <button class="btn btn-outline" type="submit">Add Note</button>
    </form>';
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
      <input type="hidden" name="intent" value="reassign">
      <div class="field">
        <label>Assigned agent</label>
        <select name="assigned_to">' . $options . '</select>
      </div>
      <button class="btn" type="submit">Reassign</button>
    </form>
    ' . $errorHtml;
}
