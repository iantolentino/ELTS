<?php
declare(strict_types=1);

function renderPage(string $title, string $bodyHtml): void
{
    $viewAs = getViewAsContext();
    // T043 — cookie-driven, never prefers-color-scheme; a first-time visitor with no cookie
    // always gets light mode, only an explicit toggle click changes it.
    $isDark = ($_COOKIE['mts_theme'] ?? 'light') === 'dark';
    ?>
<!DOCTYPE html>
<html lang="en"<?= $isDark ? ' class="dark"' : '' ?>>
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
          ' . csrfField() . '
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

// Shared left-sidebar shell (T041) for every authenticated area (department agent + admin) —
// same visual shell, different nav item sets supplied by the caller. $content is placed as-is
// inside .app-main, so callers keep their own <main class="container"> wrapper unchanged.
//
// @param array<int,array{key:string,label:string,href:string,icon:string,badge:?int}> $navItems
function renderSidebarShell(
    string $activeKey,
    array $navItems,
    string $userName,
    string $userRoleLabel,
    string $logoutUrl,
    string $portalUrl,
    string $content
): string {
    $initials = mb_strtoupper(mb_substr(trim($userName) !== '' ? trim($userName) : '?', 0, 1));

    // T043 — toggles a persistent cookie (handled in index.php before routing) and redirects
    // back to this exact page, current query string preserved.
    $isDark = ($_COOKIE['mts_theme'] ?? 'light') === 'dark';
    $currentPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    parse_str((string) (parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_QUERY) ?? ''), $currentQuery);
    $currentQuery['toggle_theme'] = '1';
    $themeToggleUrl = $currentPath . '?' . http_build_query($currentQuery);

    $navHtml = '';
    foreach ($navItems as $item) {
        $isActive = $item['key'] === $activeKey;
        $badgeHtml = $item['badge'] !== null && $item['badge'] > 0
            ? '<span class="sidebar-nav-badge">' . (int) $item['badge'] . '</span>'
            : '';
        $navHtml .= '<a class="sidebar-nav-item' . ($isActive ? ' active' : '') . '" href="'
            . htmlspecialchars($item['href']) . '">'
            . '<span class="sidebar-nav-icon">' . htmlspecialchars($item['icon']) . '</span>'
            . '<span class="sidebar-nav-label">' . htmlspecialchars($item['label']) . '</span>'
            . $badgeHtml
            . '</a>';
    }

    return '
    <div class="app-shell">
      <aside class="sidebar">
        <a class="sidebar-logo" href="' . htmlspecialchars($portalUrl) . '">
          <span class="sidebar-logo-mark">M</span>
          <span>MTS</span>
        </a>
        <nav class="sidebar-nav">' . $navHtml . '</nav>
        <div class="sidebar-bottom">
          <a class="sidebar-nav-item" href="' . htmlspecialchars($portalUrl) . '">
            <span class="sidebar-nav-icon">↗</span>
            <span class="sidebar-nav-label">Submit request</span>
          </a>
          <a class="sidebar-nav-item" href="' . htmlspecialchars($themeToggleUrl) . '">
            <span class="sidebar-nav-icon">' . ($isDark ? '☀' : '☾') . '</span>
            <span class="sidebar-nav-label">' . ($isDark ? 'Light mode' : 'Dark mode') . '</span>
          </a>
          <div class="sidebar-user">
            <div class="sidebar-user-avatar">' . htmlspecialchars($initials) . '</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">' . htmlspecialchars($userName) . '</div>
              <div class="sidebar-user-role">' . htmlspecialchars($userRoleLabel) . '</div>
            </div>
            <a href="' . htmlspecialchars($logoutUrl) . '">Log out</a>
          </div>
        </div>
      </aside>
      <div class="app-main">' . $content . '</div>
    </div>';
}
