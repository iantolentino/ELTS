<?php
declare(strict_types=1);

function renderPage(string $title, string $bodyHtml): void
{
    $viewAs = getViewAsContext();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= htmlspecialchars($title) ?> — MTS</title>
<link rel="stylesheet" href="<?= htmlspecialchars(url('assets/app.css')) ?>">
</head>
<body>
<?php if ($viewAs !== null): ?>
<div style="background:var(--destructive); color:#fff; padding:.6rem 1rem; text-align:center; font-size:.85rem;">
  Viewing as <strong><?= htmlspecialchars($viewAs['agent_name']) ?></strong> (read-only).
  <a href="<?= htmlspecialchars(url('?exit_view_as=1')) ?>" style="color:#fff; text-decoration:underline;">Exit View As</a>
</div>
<?php endif; ?>
<?= $bodyHtml ?>
</body>
</html>
<?php
}

function send404(): void
{
    http_response_code(404);
    renderPage('Not Found', '<main class="container"><div class="card"><h1>404</h1><p class="muted">That page doesn\'t exist.</p></div></main>');
}

function send403(): void
{
    http_response_code(403);
    renderPage('Access Denied', '<main class="container"><div class="card"><h1>403</h1><p class="muted">You don\'t have access to this page.</p></div></main>');
}

// Reusable server-enforced confirmation step (T027) for irreversible actions. The action handler
// must call isConfirmed() itself before doing anything destructive — this only renders the
// interstitial; it can't be bypassed by skipping a JS confirm() dialog, since the server never
// executes the action without the follow-up POST carrying confirm=yes.
/**
 * @param array<string,int|string> $hiddenFields
 */
function renderConfirmation(string $title, string $message, string $actionUrl, array $hiddenFields): void
{
    $fields = '';
    foreach ($hiddenFields as $name => $value) {
        $fields .= '<input type="hidden" name="' . htmlspecialchars((string) $name) . '" value="' . htmlspecialchars((string) $value) . '">';
    }
    $content = '
    <main class="container">
      <div class="card" style="max-width:420px; margin:0 auto; border-color:var(--destructive);">
        <h1>' . htmlspecialchars($title) . '</h1>
        <p class="muted">' . htmlspecialchars($message) . '</p>
        <form method="post" action="' . htmlspecialchars($actionUrl) . '">
          ' . $fields . '
          <input type="hidden" name="confirm" value="yes">
          <button class="btn btn-danger" type="submit">Yes, proceed</button>
          <a class="btn btn-outline" href="' . htmlspecialchars($actionUrl) . '">Cancel</a>
        </form>
      </div>
    </main>';
    renderPage($title, $content);
}

function isConfirmed(): bool
{
    return ($_POST['confirm'] ?? '') === 'yes';
}
