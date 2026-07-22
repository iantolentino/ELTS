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
        'team_leader_name' => '',
        'client_name' => '',
        'subject' => '',
        'description' => '',
        'department_id' => '',
        'request_type_id' => '',
        'supplier_name' => '',
        'budget_amount' => '',
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

    // Only degraded/down entries are worth a banner — "operational" means nothing to report.
    $statusAlerts = dbFetchAll(
        "SELECT system_name, status_state, alert_message FROM service_status
         WHERE is_visible_to_public = 1 AND status_state != 'operational'
         ORDER BY FIELD(status_state, 'down', 'degraded')"
    );

    $departments = dbFetchAll('SELECT id, name, description FROM departments ORDER BY name');

    // T052 — FAQ search across every department, right on the landing page, before picking one.
    // Separate from T044's per-department FAQ accordion (shown only after a department is
    // chosen) — this is meant to let someone self-serve an answer before submitting anything.
    $faqSearchQuery = trim((string) ($_GET['faq_search'] ?? ''));
    $faqSearchResults = $faqSearchQuery !== ''
        ? dbFetchAll(
            // Two differently-named placeholders bound to the same value — see F004 in
            // fixes/fix_log.md for why a repeated named placeholder breaks under this app's
            // non-emulated PDO prepares.
            'SELECT f.question, f.answer, d.name AS dept_name
             FROM faq_items f JOIN departments d ON d.id = f.department_id
             WHERE f.question LIKE :q1 OR f.answer LIKE :q2
             ORDER BY d.name, f.sort_order LIMIT 20',
            ['q1' => '%' . $faqSearchQuery . '%', 'q2' => '%' . $faqSearchQuery . '%']
        )
        : [];

    // Department selection (T042): sticky across a failed submit retry (via $old, so a validation
    // error never bounces the requestor back to the picker and loses their place), otherwise from
    // the portal card grid's ?dept= link. Neither present -> show the picker instead of the form.
    $selectedDeptId = null;
    if ($old['department_id'] !== '' && ctype_digit($old['department_id'])) {
        $selectedDeptId = (int) $old['department_id'];
    } elseif (isset($_GET['dept']) && ctype_digit((string) $_GET['dept'])) {
        $selectedDeptId = (int) $_GET['dept'];
    }
    $selectedDept = null;
    foreach ($departments as $d) {
        if ($selectedDeptId !== null && (int) $d['id'] === $selectedDeptId) {
            $selectedDept = $d;
            break;
        }
    }

    // T044: public FAQ for the selected department only — no point querying it for the picker view.
    $faqItems = $selectedDept !== null
        ? dbFetchAll(
            'SELECT question, answer FROM faq_items WHERE department_id = :dept_id ORDER BY sort_order, id',
            ['dept_id' => (int) $selectedDept['id']]
        )
        : [];

    // T045: request types for the selected department. A department with none skips straight to
    // the plain form (backward compatible); one with any requires picking a type first, same as
    // the department picker itself requires picking a department first.
    $requestTypes = $selectedDept !== null
        ? dbFetchAll(
            'SELECT id, name, icon FROM request_types WHERE department_id = :dept_id ORDER BY sort_order, id',
            ['dept_id' => (int) $selectedDept['id']]
        )
        : [];

    $selectedRequestTypeId = null;
    if ($old['request_type_id'] !== '' && ctype_digit($old['request_type_id'])) {
        $selectedRequestTypeId = (int) $old['request_type_id'];
    } elseif (isset($_GET['type']) && ctype_digit((string) $_GET['type'])) {
        $selectedRequestTypeId = (int) $_GET['type'];
    }
    $selectedRequestType = null;
    foreach ($requestTypes as $rt) {
        if ($selectedRequestTypeId !== null && (int) $rt['id'] === $selectedRequestTypeId) {
            $selectedRequestType = $rt;
            break;
        }
    }
    $requestTypeFields = $selectedRequestType !== null
        ? dbFetchAll(
            'SELECT label, field_key, field_type, is_required, field_options FROM request_type_fields WHERE request_type_id = :rt_id ORDER BY sort_order, id',
            ['rt_id' => (int) $selectedRequestType['id']]
        )
        : [];

    renderPage('Home', renderHomeContent(
        $submittedId,
        $errors,
        $old,
        $departments,
        $formError,
        $statusAlerts,
        $selectedDept,
        $faqItems,
        $requestTypes,
        $selectedRequestType,
        $requestTypeFields,
        $faqSearchQuery,
        $faqSearchResults
    ));
}

/**
 * Validates and inserts a ticket submission.
 * @return array{0: array<string,string>, 1: array<string,string>, 2: ?int, 3: ?string}
 */
function handleTicketSubmission(): array
{
    $old = [
        'requestor_email' => trim((string) ($_POST['requestor_email'] ?? '')),
        'team_leader_name' => trim((string) ($_POST['team_leader_name'] ?? '')),
        'client_name' => trim((string) ($_POST['client_name'] ?? '')),
        'subject' => trim((string) ($_POST['subject'] ?? '')),
        'description' => trim((string) ($_POST['description'] ?? '')),
        'department_id' => trim((string) ($_POST['department_id'] ?? '')),
        'request_type_id' => trim((string) ($_POST['request_type_id'] ?? '')),
        'supplier_name' => trim((string) ($_POST['supplier_name'] ?? '')),
        'budget_amount' => trim((string) ($_POST['budget_amount'] ?? '')),
        'priority' => trim((string) ($_POST['priority'] ?? 'med')),
    ];
    // T054 — optional additional departments beyond the primary one above, for a ticket that
    // genuinely needs more than one department's attention. A plain array, not part of $old
    // (which is scalar-only), but still needs to survive a validation-error retry the same way.
    $additionalDeptIds = array_values(array_unique(array_filter(
        array_map('intval', (array) ($_POST['additional_departments'] ?? [])),
        static fn(int $id): bool => $id > 0
    )));

    $errors = [];

    if ($old['requestor_email'] === '' || !filter_var($old['requestor_email'], FILTER_VALIDATE_EMAIL)) {
        $errors['requestor_email'] = 'Enter a valid email address.';
    }
    if ($old['team_leader_name'] === '' || mb_strlen($old['team_leader_name']) > 150) {
        $errors['team_leader_name'] = 'Team leader name is required (max 150 characters).';
    }
    if ($old['client_name'] === '' || mb_strlen($old['client_name']) > 150) {
        $errors['client_name'] = 'Client name is required (max 150 characters).';
    }
    if ($old['subject'] === '' || mb_strlen($old['subject']) > 255) {
        $errors['subject'] = 'Title is required (max 255 characters).';
    }
    if ($old['description'] === '') {
        $errors['description'] = 'Description is required.';
    }
    if ($old['department_id'] === '' || !ctype_digit($old['department_id'])
        || dbFetchOne('SELECT id FROM departments WHERE id = :id', ['id' => (int) $old['department_id']]) === null) {
        $errors['department_id'] = 'Select a valid department.';
    }

    // T053 — optional; only validated (must be a non-negative number) when actually filled in.
    if ($old['budget_amount'] !== '' && (!is_numeric($old['budget_amount']) || (float) $old['budget_amount'] < 0)) {
        $errors['budget_amount'] = 'Enter a valid non-negative amount, or leave it blank.';
    }

    // T054 — additional departments must be real, existing departments and can't just repeat the
    // primary one already selected above.
    $additionalDeptIds = array_values(array_diff($additionalDeptIds, [(int) $old['department_id']]));
    if ($additionalDeptIds !== []) {
        $validCount = (int) (dbFetchOne(
            'SELECT COUNT(*) AS cnt FROM departments WHERE id IN (' . implode(',', array_fill(0, count($additionalDeptIds), '?')) . ')',
            $additionalDeptIds
        )['cnt'] ?? 0);
        if ($validCount !== count($additionalDeptIds)) {
            $errors['additional_departments'] = 'One or more selected additional departments is invalid.';
        }
    }

    $allowedPriorities = ['low', 'med', 'high', 'urgent'];
    if (!in_array($old['priority'], $allowedPriorities, true)) {
        $old['priority'] = 'med';
    }

    // T045 — a request type is optional overall (a department with none skips it entirely), but
    // once one is posted it must genuinely belong to the department being submitted to, and its
    // custom fields are validated/collected the same way the static fields above are.
    $requestTypeId = null;
    $customFieldValues = [];
    if ($old['request_type_id'] !== '' && $old['department_id'] !== '' && ctype_digit($old['department_id'])) {
        $requestTypeId = ctype_digit($old['request_type_id']) ? (int) $old['request_type_id'] : null;
        $requestType = $requestTypeId !== null
            ? dbFetchOne('SELECT id FROM request_types WHERE id = :id AND department_id = :dept_id', ['id' => $requestTypeId, 'dept_id' => (int) $old['department_id']])
            : null;
        if ($requestType === null) {
            $errors['request_type_id'] = 'Select a valid request type.';
        } else {
            $fields = dbFetchAll(
                'SELECT label, field_key, field_type, is_required, field_options FROM request_type_fields WHERE request_type_id = :rt_id ORDER BY sort_order, id',
                ['rt_id' => $requestTypeId]
            );
            foreach ($fields as $field) {
                $fieldKey = (string) $field['field_key'];
                $inputName = 'cf_' . $fieldKey;
                if ((string) $field['field_type'] === 'boolean') {
                    $customFieldValues[$fieldKey] = isset($_POST[$inputName]) ? true : false;
                    continue;
                }

                $value = trim((string) ($_POST[$inputName] ?? ''));
                if ($value === '') {
                    if ((int) $field['is_required'] === 1) {
                        $errors[$inputName] = (string) $field['label'] . ' is required.';
                    }
                    continue;
                }

                if ((string) $field['field_type'] === 'number' && !is_numeric($value)) {
                    $errors[$inputName] = (string) $field['label'] . ' must be a number.';
                    continue;
                }
                if ((string) $field['field_type'] === 'select') {
                    $options = array_filter(array_map('trim', explode("\n", (string) ($field['field_options'] ?? ''))));
                    if (!in_array($value, $options, true)) {
                        $errors[$inputName] = 'Select a valid option for ' . (string) $field['label'] . '.';
                        continue;
                    }
                }

                $customFieldValues[$fieldKey] = $value;
            }
        }
    }

    // Carried as a comma-separated string so it fits $old's scalar-only shape (used for both
    // sticky-retry and, on success, is re-split below to insert the ticket_departments rows).
    $old['additional_department_ids'] = implode(',', $additionalDeptIds);

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
        'INSERT INTO tickets (requestor_email, team_leader_name, client_name, subject, description, department_id, supplier_name, budget_amount, priority, request_type_id, custom_fields, sla_deadline)
         VALUES (:requestor_email, :team_leader_name, :client_name, :subject, :description, :department_id, :supplier_name, :budget_amount, :priority, :request_type_id, :custom_fields, DATE_ADD(NOW(), INTERVAL :sla_hours HOUR))',
        [
            'requestor_email' => $old['requestor_email'],
            'team_leader_name' => $old['team_leader_name'],
            'client_name' => $old['client_name'],
            'subject' => $old['subject'],
            'description' => $old['description'],
            'department_id' => (int) $old['department_id'],
            'supplier_name' => $old['supplier_name'] !== '' ? $old['supplier_name'] : null,
            'budget_amount' => $old['budget_amount'] !== '' ? (float) $old['budget_amount'] : null,
            'priority' => $old['priority'],
            'request_type_id' => $requestTypeId,
            'custom_fields' => $customFieldValues !== [] ? json_encode($customFieldValues) : null,
            'sla_hours' => $slaHours,
        ]
    );
    $newId = (int) getDb()->lastInsertId();

    // T054 — the primary department already lives on the ticket row itself; ticket_departments
    // holds only the additional ones, so "all departments for this ticket" is always
    // `department_id` UNION this table (see database.sql's comment on the table for why).
    foreach ($additionalDeptIds as $additionalDeptId) {
        dbInsert('ticket_departments', ['ticket_id' => $newId, 'department_id' => $additionalDeptId]);
    }
    if (($autoAssignDeptId = (int) $old['department_id']) !== 0) {
        applyAutoAssignIfEnabled($newId, $autoAssignDeptId);
    }

    return [[], $old, $newId, null];
}

/**
 * @param array<string,string> $errors
 * @param array<string,string> $old
 * @param array<int,array<string,mixed>> $departments
 * @param array<int,array<string,mixed>> $statusAlerts
 * @param ?array<string,mixed> $selectedDept
 * @param array<int,array<string,mixed>> $faqItems
 * @param array<int,array<string,mixed>> $requestTypes
 * @param ?array<string,mixed> $selectedRequestType
 * @param array<int,array<string,mixed>> $requestTypeFields
 * @param array<int,array<string,mixed>> $faqSearchResults
 */
function renderHomeContent(
    ?int $submittedId,
    array $errors,
    array $old,
    array $departments,
    ?string $formError = null,
    array $statusAlerts = [],
    ?array $selectedDept = null,
    array $faqItems = [],
    array $requestTypes = [],
    ?array $selectedRequestType = null,
    array $requestTypeFields = [],
    string $faqSearchQuery = '',
    array $faqSearchResults = []
): string {
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
            . 'Sign in or register to track it under <a href="' . htmlspecialchars(url('account/register')) . '">My Requests</a>.</p></div>';
    }

    // T042: a chosen department (from the portal card grid, or sticky across a failed submit
    // retry) shows the locked submission form; otherwise the department-picker grid.
    // T045: if that department has request types configured, one must be picked too (same
    // pattern as the department step) before the form itself appears.
    if ($selectedDept === null) {
        $mainHtml = renderFaqSearchBox($faqSearchQuery, $faqSearchResults) . renderDepartmentPicker($departments);
    } elseif ($requestTypes !== [] && $selectedRequestType === null) {
        $mainHtml = renderRequestTypePicker($selectedDept, $requestTypes);
    } else {
        $mainHtml = renderFaqAccordion($faqItems)
            . renderTicketSubmissionForm($selectedDept, $errors, $old, $formError, $departments, $selectedRequestType, $requestTypeFields);
    }

    return '
    <main class="container">
      ' . renderRequesterAccountNav() . $alertsHtml . $confirmationHtml . $mainHtml . '
    </main>';
}

// T047 — a small top-of-page link, not a full nav bar (the app has no persistent public header
// to put one in). Requester session is separate from the agent/admin one (requester_auth.php).
function renderRequesterAccountNav(): string
{
    $account = requesterCurrentUser();
    $linkHtml = $account !== null
        ? '<a href="' . htmlspecialchars(url('account/my-requests')) . '">My Requests</a> (' . htmlspecialchars((string) $account['email']) . ')'
        : '<a href="' . htmlspecialchars(url('account/login')) . '">Sign in</a> or <a href="' . htmlspecialchars(url('account/register')) . '">register</a> to track your requests';

    return '<p class="muted" style="text-align:right; font-size:.85rem; margin-bottom:.5rem;">' . $linkHtml . '</p>';
}

// T052 — cross-department FAQ search, shown above the department picker so someone can try to
// self-serve an answer before deciding whether to submit a ticket at all. Plain GET form (no JS,
// consistent with the rest of this public page) — a search is just a normal page load with
// ?faq_search=..., not an AJAX round trip.
/**
 * @param array<int,array<string,mixed>> $results
 */
function renderFaqSearchBox(string $query, array $results): string
{
    $resultsHtml = '';
    if ($query !== '') {
        if ($results === []) {
            $resultsHtml = '<p class="muted" style="margin-top:1rem;">No help articles found for "' . htmlspecialchars($query) . '".</p>';
        } else {
            $items = '';
            foreach ($results as $r) {
                $items .= '<details style="margin-bottom:.6rem;">'
                    . '<summary style="cursor:pointer; font-weight:500;">' . htmlspecialchars((string) $r['question'])
                    . ' <span class="muted" style="font-weight:400; font-size:.8rem;">(' . htmlspecialchars((string) $r['dept_name']) . ')</span></summary>'
                    . '<p class="muted" style="margin:.5rem 0 0;">' . nl2br(htmlspecialchars((string) $r['answer'])) . '</p>'
                    . '</details>';
            }
            $resultsHtml = '<div style="margin-top:1rem;">' . $items . '</div>';
        }
    }

    return '
    <div class="card" style="margin-bottom:1.5rem;">
      <h2>Search Help Articles</h2>
      <form method="get" action="' . htmlspecialchars(url('')) . '">
        <div class="field" style="margin-bottom:0;">
          <input type="text" name="faq_search" value="' . htmlspecialchars($query) . '" placeholder="Search across every department&hellip;">
        </div>
        <button class="btn btn-outline" type="submit" style="margin-top:.5rem;">Search</button>
      </form>
      ' . $resultsHtml . '
    </div>';
}

/**
 * @param array<int,array<string,mixed>> $departments
 */
function renderDepartmentPicker(array $departments): string
{
    // Fixed palette, not a `departments.color` column — this is a purely cosmetic accent and
    // adding a schema column for it isn't worth another database.sql change (see decisions/
    // decision_log.md [ARCH] on how deliberately that file has been treated as fixed spec).
    $palette = ['#7c5cfc', '#0ea5e9', '#f97316', '#10b981', '#ec4899', '#6366f1', '#eab308', '#14b8a6'];

    $cards = '';
    foreach ($departments as $dept) {
        $name = (string) $dept['name'];
        $color = $palette[(int) $dept['id'] % count($palette)];
        $deptUrl = url('?dept=' . (int) $dept['id']);
        $initial = htmlspecialchars(mb_strtoupper(mb_substr($name, 0, 1)));
        // T064 — superadmin-editable description (Admin > Departments); falls back to a generic
        // line for departments nobody has written one for yet, same as before this field existed.
        $description = trim((string) ($dept['description'] ?? ''));
        $descriptionHtml = $description !== '' ? htmlspecialchars($description) : 'Submit a request to this department.';
        $cards .= '
        <a href="' . htmlspecialchars($deptUrl) . '" class="dept-card" data-name="' . htmlspecialchars(mb_strtolower($name)) . '">
          <div class="dept-card-bar" style="background:' . $color . ';"></div>
          <div class="dept-card-body">
            <div class="dept-card-icon" style="background:' . $color . '22; border-color:' . $color . '55; color:' . $color . ';">' . $initial . '</div>
            <span class="dept-card-arrow">&rarr;</span>
            <h3>' . htmlspecialchars($name) . '</h3>
            <p class="muted">' . $descriptionHtml . '</p>
          </div>
        </a>';
    }

    $emptyHtml = $departments === []
        ? '<p class="muted" style="text-align:center; padding:2rem 0;">No departments available yet.</p>'
        : '<p class="muted" id="dept-empty" style="text-align:center; padding:2rem 0; display:none;">No departments found.</p>';

    return '
    <div class="portal-hero">
      <h1>How can we help you?</h1>
      <p class="muted">Browse our departments and submit a support request. We&rsquo;ll get back to you as soon as possible.</p>
      <div class="portal-search">
        <input type="text" id="dept-search" placeholder="Search departments&hellip;" oninput="filterDeptCards(this.value)">
      </div>
    </div>
    <div class="dept-grid" id="dept-grid">' . $cards . '</div>
    ' . $emptyHtml . '
    <script>
      function filterDeptCards(q) {
        q = q.toLowerCase();
        var visible = 0;
        document.querySelectorAll(".dept-card").forEach(function (card) {
          var match = card.getAttribute("data-name").indexOf(q) !== -1;
          card.style.display = match ? "" : "none";
          if (match) visible++;
        });
        var empty = document.getElementById("dept-empty");
        if (empty) empty.style.display = visible === 0 ? "" : "none";
      }
    </script>';
}

// T044 — public FAQ for the department the requestor just picked. Empty items list renders
// nothing at all rather than an empty "FAQ" card — no point showing chrome with no content.
/**
 * @param array<int,array<string,mixed>> $faqItems
 */
function renderFaqAccordion(array $faqItems): string
{
    if ($faqItems === []) {
        return '';
    }

    $list = '';
    foreach ($faqItems as $item) {
        $list .= '<details style="margin-bottom:.6rem;">'
            . '<summary style="cursor:pointer; font-weight:500;">' . htmlspecialchars((string) $item['question']) . '</summary>'
            . '<p class="muted" style="margin:.5rem 0 0;">' . nl2br(htmlspecialchars((string) $item['answer'])) . '</p>'
            . '</details>';
    }

    return '
    <div class="card" style="margin-bottom:1.5rem;">
      <h2>Frequently Asked Questions</h2>
      ' . $list . '
    </div>';
}

// T045 — shown when the selected department has request types configured and none is picked
// yet. Same locking pattern as the department picker: choosing one carries it forward via ?type=.
/**
 * @param array<string,mixed> $selectedDept
 * @param array<int,array<string,mixed>> $requestTypes
 */
function renderRequestTypePicker(array $selectedDept, array $requestTypes): string
{
    $cards = '';
    foreach ($requestTypes as $rt) {
        $typeUrl = url('?dept=' . (int) $selectedDept['id'] . '&type=' . (int) $rt['id']);
        $cards .= '
        <a href="' . htmlspecialchars($typeUrl) . '" class="dept-card">
          <div class="dept-card-body">
            <div class="dept-card-icon" style="background:var(--muted); border-color:var(--border); color:var(--foreground);">' . htmlspecialchars((string) $rt['icon']) . '</div>
            <span class="dept-card-arrow">&rarr;</span>
            <h3>' . htmlspecialchars((string) $rt['name']) . '</h3>
          </div>
        </a>';
    }

    return '
    <div class="card" style="margin-bottom:1.5rem;">
      <h1>What do you need help with?</h1>
      <p class="muted">To <strong>' . htmlspecialchars((string) $selectedDept['name']) . '</strong>.
        <a href="' . htmlspecialchars(url('')) . '">Change department</a></p>
    </div>
    <div class="dept-grid">' . $cards . '</div>';
}

/**
 * @param array<string,mixed> $selectedDept
 * @param array<string,string> $errors
 * @param array<string,string> $old
 * @param array<int,array<string,mixed>> $departments
 * @param ?array<string,mixed> $selectedRequestType
 * @param array<int,array<string,mixed>> $requestTypeFields
 */
function renderTicketSubmissionForm(
    array $selectedDept,
    array $errors,
    array $old,
    ?string $formError,
    array $departments = [],
    ?array $selectedRequestType = null,
    array $requestTypeFields = []
): string {
    $formErrorHtml = $formError !== null ? '<p class="text-destructive">' . htmlspecialchars($formError) . '</p>' : '';
    $err = static fn(array $errors, string $field): string => isset($errors[$field])
        ? '<p class="text-destructive">' . htmlspecialchars($errors[$field]) . '</p>'
        : '';

    $typeLineHtml = $selectedRequestType !== null
        ? ' &middot; <strong>' . htmlspecialchars((string) $selectedRequestType['name']) . '</strong>. <a href="' . htmlspecialchars(url('?dept=' . (int) $selectedDept['id'])) . '">Change type</a>'
        : '';

    // T045 — one .field block per configured custom field, named cf_{field_key} so they can
    // never collide with the static field names above. $old has no per-field memory (only the
    // static top-level keys are tracked across a retry) — a validation-failure retry re-reads
    // $_POST directly here, same value the user just typed.
    $customFieldsHtml = '';
    foreach ($requestTypeFields as $field) {
        $fieldKey = (string) $field['field_key'];
        $inputName = 'cf_' . $fieldKey;
        $label = htmlspecialchars((string) $field['label']) . ((int) $field['is_required'] === 1 ? ' *' : '');
        $submitted = (string) ($_POST[$inputName] ?? '');
        $requiredAttr = (int) $field['is_required'] === 1 ? ' required' : '';

        $inputHtml = match ((string) $field['field_type']) {
            'textarea' => '<textarea name="' . htmlspecialchars($inputName) . '" rows="3"' . $requiredAttr . '>' . htmlspecialchars($submitted) . '</textarea>',
            'number' => '<input type="number" name="' . htmlspecialchars($inputName) . '" value="' . htmlspecialchars($submitted) . '"' . $requiredAttr . '>',
            'date' => '<input type="date" name="' . htmlspecialchars($inputName) . '" value="' . htmlspecialchars($submitted) . '"' . $requiredAttr . '>',
            'boolean' => '<label><input type="checkbox" name="' . htmlspecialchars($inputName) . '" style="width:auto;"' . (isset($_POST[$inputName]) ? ' checked' : '') . '> Yes</label>',
            'select' => (function () use ($field, $inputName, $submitted, $requiredAttr): string {
                $options = array_filter(array_map('trim', explode("\n", (string) ($field['field_options'] ?? ''))));
                $optionsHtml = '<option value="">Select&hellip;</option>';
                foreach ($options as $opt) {
                    $selected = $submitted === $opt ? ' selected' : '';
                    $optionsHtml .= '<option value="' . htmlspecialchars($opt) . '"' . $selected . '>' . htmlspecialchars($opt) . '</option>';
                }
                return '<select name="' . htmlspecialchars($inputName) . '"' . $requiredAttr . '>' . $optionsHtml . '</select>';
            })(),
            default => '<input type="text" name="' . htmlspecialchars($inputName) . '" value="' . htmlspecialchars($submitted) . '"' . $requiredAttr . '>',
        };

        $customFieldsHtml .= '<div class="field"><label>' . $label . '</label>' . $inputHtml . $err($errors, $inputName) . '</div>';
    }

    return '
    <div class="card">
      <h1>Submit a Ticket</h1>
      <p class="muted">To <strong>' . htmlspecialchars((string) $selectedDept['name']) . '</strong>.
        <a href="' . htmlspecialchars(url('')) . '">Change department</a>' . $typeLineHtml . '</p>
      ' . $formErrorHtml . '
      <form method="post" action="' . htmlspecialchars(url('')) . '">
        ' . csrfField() . '
        <input type="hidden" name="intent" value="submit">
        <input type="hidden" name="department_id" value="' . (int) $selectedDept['id'] . '">'
        . ($selectedRequestType !== null ? '<input type="hidden" name="request_type_id" value="' . (int) $selectedRequestType['id'] . '">' : '') . '
        <div class="field">
          <label>Your Email</label>
          <input type="email" name="requestor_email" value="' . htmlspecialchars($old['requestor_email']) . '" required>
          ' . $err($errors, 'requestor_email') . '
        </div>
        <div class="field">
          <label>Team Leader Name</label>
          <input type="text" name="team_leader_name" maxlength="150" value="' . htmlspecialchars($old['team_leader_name']) . '" required>
          ' . $err($errors, 'team_leader_name') . '
        </div>
        <div class="field">
          <label>Client Name</label>
          <input type="text" name="client_name" maxlength="150" value="' . htmlspecialchars($old['client_name']) . '" required>
          ' . $err($errors, 'client_name') . '
        </div>
        <div class="field">
          <label>Title</label>
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
        ' . renderBudgetField($old, $errors) . '
        ' . renderAdditionalDepartmentsField($departments, $selectedDept, $old, $errors) . '
        ' . $customFieldsHtml . '
        <button class="btn" type="submit">Submit Ticket</button>
      </form>
    </div>';
}

// T053 — optional cost field, only shown/relevant when the request actually has an associated
// budget; validated server-side (non-negative number) but never required.
/**
 * @param array<string,string> $old
 * @param array<string,string> $errors
 */
function renderBudgetField(array $old, array $errors): string
{
    $errorHtml = isset($errors['budget_amount']) ? '<p class="text-destructive">' . htmlspecialchars($errors['budget_amount']) . '</p>' : '';
    return '
        <div class="field">
          <label>Budget / Cost (optional — only if this request has an associated cost)</label>
          <input type="number" step="0.01" min="0" name="budget_amount" value="' . htmlspecialchars($old['budget_amount']) . '">
          ' . $errorHtml . '
        </div>';
}

// T054 — a ticket can optionally also involve up to a small handful of other departments beyond
// the primary one already locked in via the portal picker. Full shared ownership is enforced
// server-side (handleTicketSubmission()); this is just the checkbox list, excluding whichever
// department is already the primary.
/**
 * @param array<int,array<string,mixed>> $departments
 * @param array<string,mixed> $selectedDept
 * @param array<string,string> $old
 * @param array<string,string> $errors
 */
function renderAdditionalDepartmentsField(array $departments, array $selectedDept, array $old, array $errors): string
{
    $others = array_filter($departments, static fn(array $d): bool => (int) $d['id'] !== (int) $selectedDept['id']);
    if ($others === []) {
        return '';
    }

    $checkedIds = array_filter(array_map('intval', explode(',', $old['additional_department_ids'] ?? '')));

    $checkboxes = '';
    foreach ($others as $d) {
        $checked = in_array((int) $d['id'], $checkedIds, true) ? ' checked' : '';
        $checkboxes .= '<label style="display:block; font-weight:400; margin-bottom:.3rem;">'
            . '<input type="checkbox" name="additional_departments[]" value="' . (int) $d['id'] . '"' . $checked . ' style="width:auto;"> '
            . htmlspecialchars((string) $d['name'])
            . '</label>';
    }

    $errorHtml = isset($errors['additional_departments']) ? '<p class="text-destructive">' . htmlspecialchars($errors['additional_departments']) . '</p>' : '';

    return '
        <div class="field">
          <label>Also involves another department? (optional)</label>
          ' . $checkboxes . $errorHtml . '
        </div>';
}

