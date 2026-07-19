<?php
declare(strict_types=1);

// SLA duration by priority — the spec defines no policy for this, see
// _brain/decisions/decision_log.md [ARCH] for the reasoning behind these defaults.
const SLA_HOURS_BY_PRIORITY = ['urgent' => 4, 'high' => 8, 'med' => 24, 'low' => 72];

function handlePublicHome(): void
{
    // T026: a superadmin can flip this in the Settings tab and it takes effect on the very next
    // request, no deploy — DB-backed (`settings` table), not a config.php constant.
    if (isSettingEnabled('maintenance_mode')) {
        $message = getSettingValue('maintenance_mode', 'This system is temporarily down for maintenance. Please check back soon.');
        renderPage('Maintenance', '<main class="container"><div class="card"><h1>Under Maintenance</h1><p class="muted">' . htmlspecialchars($message) . '</p></div></main>');
        return;
    }

    $submittedId = isset($_GET['submitted']) && ctype_digit((string) $_GET['submitted'])
        ? (int) $_GET['submitted']
        : null;

    $errors = [];
    $old = [
        'requestor_email' => '',
        'subject' => '',
        'description' => '',
        'department_id' => '',
        'supplier_name' => '',
        'priority' => 'med',
    ];

    $formError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'submit') {
        [$errors, $old, $newId, $formError] = handleTicketSubmission();
        if ($newId !== null) {
            header('Location: ' . url('?submitted=' . $newId));
            exit;
        }
    }

    $statusOld = ['ticket_id' => '', 'requestor_email' => ''];
    $statusResult = null;
    $statusError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'status') {
        [$statusOld, $statusResult, $statusError] = handleStatusLookup();
    }

    // Only degraded/down entries are worth a banner — "operational" means nothing to report.
    $statusAlerts = dbFetchAll(
        "SELECT system_name, status_state, alert_message FROM service_status
         WHERE is_visible_to_public = 1 AND status_state != 'operational'
         ORDER BY FIELD(status_state, 'down', 'degraded')"
    );

    $departments = dbFetchAll('SELECT id, name FROM departments ORDER BY name');
    renderPage('Home', renderHomeContent(
        $submittedId,
        $errors,
        $old,
        $departments,
        $statusOld,
        $statusResult,
        $statusError,
        $formError,
        $statusAlerts
    ));
}

/**
 * Looks up a ticket by ID + requestor email — both must match, so a ticket ID alone can't be
 * used to enumerate/probe other people's tickets.
 * @return array{0: array<string,string>, 1: ?array<string,mixed>, 2: ?string}
 */
function handleStatusLookup(): array
{
    $old = [
        'ticket_id' => trim((string) ($_POST['ticket_id'] ?? '')),
        'requestor_email' => trim((string) ($_POST['requestor_email'] ?? '')),
    ];

    if ($old['ticket_id'] === '' || !ctype_digit($old['ticket_id']) || $old['requestor_email'] === '') {
        return [$old, null, 'Enter both a ticket number and the email used to submit it.'];
    }

    $ticket = dbFetchOne(
        'SELECT id, subject, status, created_at, updated_at FROM tickets WHERE id = :id AND requestor_email = :email',
        ['id' => (int) $old['ticket_id'], 'email' => $old['requestor_email']]
    );

    if ($ticket === null) {
        return [$old, null, 'No matching ticket found for that ticket number and email.'];
    }

    return [$old, $ticket, null];
}

/**
 * Validates and inserts a ticket submission.
 * @return array{0: array<string,string>, 1: array<string,string>, 2: ?int, 3: ?string}
 */
function handleTicketSubmission(): array
{
    $old = [
        'requestor_email' => trim((string) ($_POST['requestor_email'] ?? '')),
        'subject' => trim((string) ($_POST['subject'] ?? '')),
        'description' => trim((string) ($_POST['description'] ?? '')),
        'department_id' => trim((string) ($_POST['department_id'] ?? '')),
        'supplier_name' => trim((string) ($_POST['supplier_name'] ?? '')),
        'priority' => trim((string) ($_POST['priority'] ?? 'med')),
    ];

    $errors = [];

    if ($old['requestor_email'] === '' || !filter_var($old['requestor_email'], FILTER_VALIDATE_EMAIL)) {
        $errors['requestor_email'] = 'Enter a valid email address.';
    }
    if ($old['subject'] === '' || mb_strlen($old['subject']) > 255) {
        $errors['subject'] = 'Subject is required (max 255 characters).';
    }
    if ($old['description'] === '') {
        $errors['description'] = 'Description is required.';
    }
    if ($old['department_id'] === '' || !ctype_digit($old['department_id'])
        || dbFetchOne('SELECT id FROM departments WHERE id = :id', ['id' => (int) $old['department_id']]) === null) {
        $errors['department_id'] = 'Select a valid department.';
    }

    $allowedPriorities = ['low', 'med', 'high', 'urgent'];
    if (!in_array($old['priority'], $allowedPriorities, true)) {
        $old['priority'] = 'med';
    }

    if ($errors !== []) {
        return [$errors, $old, null, null];
    }

    // Checked only once the other fields are valid — no point rate-limiting a submission that
    // would be rejected anyway, and this keeps the email format guaranteed sane before it's used
    // as the spam_trackers key.
    $spamError = checkSpamLimiter($old['requestor_email']);
    if ($spamError !== null) {
        return [$errors, $old, null, $spamError];
    }

    // Raw INSERT (not dbInsert()) because sla_deadline needs a SQL expression (DATE_ADD against
    // MySQL's own NOW()), not a literal bound value — same timezone-safety reasoning as cache.php.
    $slaHours = SLA_HOURS_BY_PRIORITY[$old['priority']] ?? SLA_HOURS_BY_PRIORITY['med'];
    dbQuery(
        'INSERT INTO tickets (requestor_email, subject, description, department_id, supplier_name, priority, sla_deadline)
         VALUES (:requestor_email, :subject, :description, :department_id, :supplier_name, :priority, DATE_ADD(NOW(), INTERVAL :sla_hours HOUR))',
        [
            'requestor_email' => $old['requestor_email'],
            'subject' => $old['subject'],
            'description' => $old['description'],
            'department_id' => (int) $old['department_id'],
            'supplier_name' => $old['supplier_name'] !== '' ? $old['supplier_name'] : null,
            'priority' => $old['priority'],
            'sla_hours' => $slaHours,
        ]
    );
    $newId = (int) getDb()->lastInsertId();

    return [[], $old, $newId, null];
}

/**
 * @param array<string,string> $errors
 * @param array<string,string> $old
 * @param array<int,array<string,mixed>> $departments
 * @param array<string,string> $statusOld
 * @param ?array<string,mixed> $statusResult
 */
/**
 * @param array<int,array<string,mixed>> $statusAlerts
 */
function renderHomeContent(
    ?int $submittedId,
    array $errors,
    array $old,
    array $departments,
    array $statusOld,
    ?array $statusResult,
    ?string $statusError,
    ?string $formError = null,
    array $statusAlerts = []
): string {
    $formErrorHtml = $formError !== null ? '<p class="text-destructive">' . htmlspecialchars($formError) . '</p>' : '';

    $alertsHtml = '';
    foreach ($statusAlerts as $alert) {
        $badgeClass = 'badge-' . htmlspecialchars((string) $alert['status_state']);
        $alertsHtml .= '<div class="card" style="margin-bottom:.75rem; border-color:var(--destructive);">'
            . '<span class="badge ' . $badgeClass . '">' . htmlspecialchars((string) $alert['status_state']) . '</span> '
            . '<strong>' . htmlspecialchars((string) $alert['system_name']) . '</strong>'
            . ($alert['alert_message'] !== null ? '<p class="muted" style="margin:.35rem 0 0;">' . htmlspecialchars((string) $alert['alert_message']) . '</p>' : '')
            . '</div>';
    }

    $confirmationHtml = '';
    if ($submittedId !== null) {
        $confirmationHtml = '<div class="card alert-success" style="margin-bottom:1.5rem;">'
            . '<h2>Ticket submitted</h2>'
            . '<p class="muted">Your ticket number is <strong>#' . $submittedId . '</strong>. '
            . 'Use it together with your email to check status.</p></div>';
    }

    $deptOptions = '';
    foreach ($departments as $dept) {
        $selected = ($old['department_id'] !== '' && (int) $old['department_id'] === (int) $dept['id']) ? ' selected' : '';
        $deptOptions .= '<option value="' . (int) $dept['id'] . '"' . $selected . '>' . htmlspecialchars($dept['name']) . '</option>';
    }

    $err = static fn(array $errors, string $field): string => isset($errors[$field])
        ? '<p class="text-destructive">' . htmlspecialchars($errors[$field]) . '</p>'
        : '';

    $statusResultHtml = '';
    if ($statusError !== null) {
        $statusResultHtml = '<p class="text-destructive">' . htmlspecialchars($statusError) . '</p>';
    } elseif ($statusResult !== null) {
        $badgeClass = 'badge-' . str_replace('_', '-', (string) $statusResult['status']);
        $statusResultHtml = '<div style="margin-top:1rem;">'
            . '<p><strong>#' . (int) $statusResult['id'] . '</strong> — ' . htmlspecialchars((string) $statusResult['subject']) . '</p>'
            . '<p><span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $statusResult['status']) . '</span></p>'
            . '<p class="muted">Submitted ' . htmlspecialchars((string) $statusResult['created_at'])
            . ' · Last updated ' . htmlspecialchars((string) $statusResult['updated_at']) . '</p>'
            . '</div>';
    }

    return '
    <main class="container">
      ' . $alertsHtml . $confirmationHtml . '
      <div class="card">
        <h1>Submit a Ticket</h1>
        ' . $formErrorHtml . '
        <form method="post" action="' . htmlspecialchars(url('')) . '">
          <input type="hidden" name="intent" value="submit">
          <div class="field">
            <label>Your Email</label>
            <input type="email" name="requestor_email" value="' . htmlspecialchars($old['requestor_email']) . '" required>
            ' . $err($errors, 'requestor_email') . '
          </div>
          <div class="field">
            <label>Department</label>
            <select name="department_id" required>
              <option value="">Select a department</option>
              ' . $deptOptions . '
            </select>
            ' . $err($errors, 'department_id') . '
          </div>
          <div class="field">
            <label>Subject</label>
            <input type="text" name="subject" maxlength="255" value="' . htmlspecialchars($old['subject']) . '" required>
            ' . $err($errors, 'subject') . '
          </div>
          <div class="field">
            <label>Description</label>
            <textarea name="description" rows="5" required>' . htmlspecialchars($old['description']) . '</textarea>
            ' . $err($errors, 'description') . '
          </div>
          <div class="field">
            <label>Supplier (optional)</label>
            <input type="text" name="supplier_name" value="' . htmlspecialchars($old['supplier_name']) . '">
          </div>
          <button class="btn" type="submit">Submit Ticket</button>
        </form>
      </div>

      <div class="card" style="margin-top:1.5rem;">
        <h1>Check Ticket Status</h1>
        <form method="post" action="' . htmlspecialchars(url('')) . '">
          <input type="hidden" name="intent" value="status">
          <div class="field">
            <label>Ticket Number</label>
            <input type="text" inputmode="numeric" name="ticket_id" value="' . htmlspecialchars($statusOld['ticket_id']) . '" required>
          </div>
          <div class="field">
            <label>Your Email</label>
            <input type="email" name="requestor_email" value="' . htmlspecialchars($statusOld['requestor_email']) . '" required>
          </div>
          <button class="btn btn-outline" type="submit">Check Status</button>
        </form>
        ' . $statusResultHtml . '
      </div>
    </main>';
}
