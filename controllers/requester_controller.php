<?php
declare(strict_types=1);

// T047 — requester self-service accounts. Additive: the anonymous email+ticket-id lookup (T010)
// and anonymous submission (T009) both keep working completely unchanged for anyone who never
// registers. "My Requests" works by email match against tickets.requestor_email — see
// database.sql's comment on requester_accounts for why that needs no separate linking step.

function handleRequesterAccountRoute(array $segments): void
{
    if (count($segments) === 0 || $segments[0] === 'login') {
        handleRequesterLogin();
        return;
    }
    if ($segments[0] === 'register') {
        handleRequesterRegister();
        return;
    }
    if ($segments[0] === 'logout') {
        requesterLogout();
        header('Location: ' . url('account/login'));
        exit;
    }
    if ($segments[0] === 'my-requests') {
        handleMyRequests();
        return;
    }
    if (count($segments) === 2 && $segments[0] === 'ticket' && ctype_digit($segments[1])) {
        handleRequesterTicket((int) $segments[1]);
        return;
    }

    send404();
}

function handleRequesterLogin(): void
{
    $account = requesterCurrentUser();
    if ($account !== null) {
        header('Location: ' . url('account/my-requests'));
        exit;
    }

    $error = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = trim((string) ($_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $found = dbFetchOne('SELECT * FROM requester_accounts WHERE email = :email', ['email' => $email]);
        if ($found !== null && password_verify($password, (string) $found['password_hash'])) {
            requesterLogin($found);
            header('Location: ' . url('account/my-requests'));
            exit;
        }
        $error = 'Invalid email or password.';
    }

    renderPage('My Account — Log In', renderRequesterAuthForm('login', $error));
}

function handleRequesterRegister(): void
{
    $account = requesterCurrentUser();
    if ($account !== null) {
        header('Location: ' . url('account/my-requests'));
        exit;
    }

    $error = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = trim((string) ($_POST['email'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Enter a valid email address.';
        } elseif (strlen($password) < 8) {
            $error = 'Password must be at least 8 characters.';
        } elseif (dbFetchOne('SELECT id FROM requester_accounts WHERE email = :email', ['email' => $email]) !== null) {
            $error = 'An account with that email already exists — log in instead.';
        } else {
            $id = dbInsert('requester_accounts', [
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
            requesterLogin(['id' => $id, 'email' => $email]);
            header('Location: ' . url('account/my-requests'));
            exit;
        }
    }

    renderPage('My Account — Register', renderRequesterAuthForm('register', $error));
}

function handleMyRequests(): void
{
    $account = requesterCurrentUser();
    if ($account === null) {
        header('Location: ' . url('account/login'));
        exit;
    }

    $tickets = dbFetchAll(
        'SELECT t.id, t.subject, t.status, t.priority, t.created_at, d.name AS dept_name
         FROM tickets t LEFT JOIN departments d ON d.id = t.department_id
         WHERE t.requestor_email = :email ORDER BY t.created_at DESC',
        ['email' => (string) $account['email']]
    );

    renderPage('My Requests', renderMyRequestsPage($account, $tickets));
}

function handleRequesterTicket(int $ticketId): void
{
    $account = requesterCurrentUser();
    if ($account === null) {
        header('Location: ' . url('account/login'));
        exit;
    }

    // Same isolation shape as every other "prove you own this ticket" check in the app (T010's
    // email+id lookup, T046's comment guard) — the account's email must match the ticket's
    // requestor_email, the ticket id alone proves nothing.
    $ticket = dbFetchOne(
        'SELECT id, subject, description, status, priority, created_at, updated_at FROM tickets WHERE id = :id AND requestor_email = :email',
        ['id' => $ticketId, 'email' => (string) $account['email']]
    );
    if ($ticket === null) {
        send404();
        return;
    }

    $commentError = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['intent'] ?? '') === 'add_requester_comment') {
        $commentError = applyAddComment($ticketId, 'requester', null, deriveNameFromEmail((string) $account['email']), (string) ($_POST['body'] ?? ''));
        if ($commentError === null) {
            header('Location: ' . url('account/ticket/' . $ticketId));
            exit;
        }
    }

    $comments = dbFetchAll(
        'SELECT author_type, author_name, body, created_at FROM ticket_comments WHERE ticket_id = :id ORDER BY created_at ASC',
        ['id' => $ticketId]
    );

    renderPage('Ticket #' . $ticketId, renderRequesterTicketPage($ticket, $comments, $commentError));
}

function renderRequesterAuthForm(string $mode, ?string $error): string
{
    $isLogin = $mode === 'login';
    $title = $isLogin ? 'Log In' : 'Register';
    $actionUrl = url('account/' . ($isLogin ? 'login' : 'register'));
    $switchHtml = $isLogin
        ? '<p class="muted">No account? <a href="' . htmlspecialchars(url('account/register')) . '">Register</a></p>'
        : '<p class="muted">Already have an account? <a href="' . htmlspecialchars(url('account/login')) . '">Log in</a></p>';
    $errorHtml = $error !== null ? '<p class="text-destructive">' . htmlspecialchars($error) . '</p>' : '';

    return '
    <main class="container">
      <div class="card" style="max-width:400px; margin:0 auto;">
        <p class="muted"><a href="' . htmlspecialchars(url('')) . '">&larr; Back to portal</a></p>
        <h1>' . htmlspecialchars($title) . '</h1>
        <p class="muted">Track every request you\'ve submitted in one place.</p>
        ' . $errorHtml . '
        <form method="post" action="' . htmlspecialchars($actionUrl) . '">
          ' . csrfField() . '
          <div class="field"><label>Email</label><input type="email" name="email" required autofocus></div>
          <div class="field"><label>Password' . ($isLogin ? '' : ' (min. 8 characters)') . '</label><input type="password" name="password" required></div>
          <button class="btn" type="submit">' . htmlspecialchars($title) . '</button>
        </form>
        ' . $switchHtml . '
      </div>
    </main>';
}

/**
 * @param array<string,mixed> $account
 * @param array<int,array<string,mixed>> $tickets
 */
function renderMyRequestsPage(array $account, array $tickets): string
{
    $rows = $tickets === [] ? '<tr><td colspan="5" class="muted">No requests yet.</td></tr>' : '';
    foreach ($tickets as $t) {
        $badgeClass = 'badge-' . str_replace('_', '-', (string) $t['status']);
        $ticketUrl = url('account/ticket/' . (int) $t['id']);
        $rows .= '<tr>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">#' . (int) $t['id'] . '</a></td>'
            . '<td><a href="' . htmlspecialchars($ticketUrl) . '">' . htmlspecialchars((string) $t['subject']) . '</a></td>'
            . '<td>' . htmlspecialchars((string) ($t['dept_name'] ?? '—')) . '</td>'
            . '<td><span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $t['status']) . '</span></td>'
            . '<td class="muted">' . htmlspecialchars((string) $t['created_at']) . '</td>'
            . '</tr>';
    }

    return '
    <main class="container">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h1>My Requests</h1>
            <p class="muted">Logged in as ' . htmlspecialchars(deriveNameFromEmail((string) $account['email'])) . ' (' . htmlspecialchars((string) $account['email']) . '). <a href="' . htmlspecialchars(url('account/logout')) . '">Log out</a></p>
          </div>
          <a class="btn btn-outline" href="' . htmlspecialchars(url('')) . '">Submit a new request</a>
        </div>
        <table style="margin-top:1rem;">
          <thead><tr><th>ID</th><th>Title</th><th>Department</th><th>Status</th><th>Submitted</th></tr></thead>
          <tbody>' . $rows . '</tbody>
        </table>
      </div>
    </main>';
}

/**
 * @param array<string,mixed> $ticket
 * @param array<int,array<string,mixed>> $comments
 */
function renderRequesterTicketPage(array $ticket, array $comments, ?string $commentError): string
{
    $badgeClass = 'badge-' . str_replace('_', '-', (string) $ticket['status']);
    $errorHtml = $commentError !== null ? '<p class="text-destructive">' . htmlspecialchars($commentError) . '</p>' : '';

    return '
    <main class="container">
      <div class="card">
        <p class="muted"><a href="' . htmlspecialchars(url('account/my-requests')) . '">&larr; Back to My Requests</a></p>
        <h1>#' . (int) $ticket['id'] . ' — ' . htmlspecialchars((string) $ticket['subject']) . '</h1>
        <p>
          <span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $ticket['status']) . '</span>
          <span class="badge badge-cancelled" style="margin-left:.4rem;">priority: ' . htmlspecialchars((string) $ticket['priority']) . '</span>
        </p>
        <p class="muted">Submitted ' . htmlspecialchars((string) $ticket['created_at']) . ' · Last updated ' . htmlspecialchars((string) $ticket['updated_at']) . '</p>
        <h2 style="margin-top:1.5rem;">Description</h2>
        <p>' . nl2br(htmlspecialchars((string) $ticket['description'])) . '</p>
        <h2 style="margin-top:1.5rem;">Comments</h2>
        ' . renderCommentList($comments) . '
        <form method="post" style="margin-top:1rem;">
          ' . csrfField() . '
          <input type="hidden" name="intent" value="add_requester_comment">
          <div class="field"><textarea name="body" rows="3" placeholder="Add a reply"></textarea></div>
          ' . $errorHtml . '
          <button class="btn btn-outline" type="submit">Reply</button>
        </form>
      </div>
    </main>';
}
