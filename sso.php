<?php
declare(strict_types=1);

// Deployment-only SSO hook — inert by default (config.php's SSO_ENABLED = false), per the
// DEFERRED COMPLEXITY RULE: no specific IdP/protocol has been chosen yet, so this deliberately
// does NOT implement OAuth/SAML/OIDC itself. What it DOES fix in place is the *contract* the rest
// of the app relies on, so wiring up a real provider later is a change to this one file only.
//
// The goal (per direct user request): once deployed with SSO turned on, a requester's SSO-verified
// email becomes their "My Requests" identity directly — no T047 register/login step, they "just
// need to have their email." requesterCurrentUser() (requester_auth.php) checks this hook first,
// before falling back to the normal session-based login, so both paths keep working side by side.
//
// ── What's real today ──────────────────────────────────────────────────────────────────────────
// - The SSO_ENABLED flag and the allow-list table/CRUD-free schema (sso_allowed_emails).
// - isEmailSsoAllowed() — a real, working allow-list check once the table has rows in it.
// - The requesterCurrentUser() integration point (requester_auth.php) — already wired, already
//   safe: with SSO_ENABLED false (the default), ssoAuthenticatedEmail() always returns null, so
//   none of this changes today's behavior at all.
//
// ── What's NOT implemented (deployment must add this) ─────────────────────────────────────────
// - ssoAuthenticatedEmail() below reads a single server variable (SSO_EMAIL_SERVER_VAR, e.g. a
//   header like HTTP_X_SSO_EMAIL) as a placeholder for "however the chosen IdP integration proves
//   who's logged in" — a reverse-proxy doing header injection (mod_auth_openidc, mod_shib), a real
//   OAuth/OIDC callback that sets a session var, etc. Replace the body of this one function with
//   whatever that integration actually looks like; nothing else in the app needs to change.
// - No email is ever trusted from a query string or POST body here — only from a source deployment
//   configures to be tamper-proof (a proxy-injected header stripped from client input, or a
//   server-side session set by a verified callback). Wiring this to anything client-controllable
//   would be an auth bypass.

function ssoEnabled(): bool
{
    return defined('SSO_ENABLED') && SSO_ENABLED === true;
}

// Placeholder extraction point — see header comment. Returns null whenever SSO is disabled or the
// configured server variable isn't present, which is always true today.
function ssoAuthenticatedEmail(): ?string
{
    if (!ssoEnabled()) {
        return null;
    }
    $varName = defined('SSO_EMAIL_SERVER_VAR') ? SSO_EMAIL_SERVER_VAR : '';
    $email = $varName !== '' ? (string) ($_SERVER[$varName] ?? '') : '';
    return ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) ? $email : null;
}

// Real check, not a placeholder — the allow-list is meaningful the moment rows exist in it,
// independent of whether the extraction side (ssoAuthenticatedEmail) has been wired up yet.
function isEmailSsoAllowed(string $email): bool
{
    return dbFetchOne('SELECT email FROM sso_allowed_emails WHERE email = :email', ['email' => $email]) !== null;
}

// The actual "just need to have their email" identity — an SSO-verified, allow-listed email
// becomes a requester identity with no requester_accounts row at all (id is null; every existing
// call site keys off ->email, not ->id, so this slots in without further changes — see
// requesterCurrentUser() in requester_auth.php).
function ssoRequesterIdentity(): ?array
{
    $email = ssoAuthenticatedEmail();
    if ($email === null || !isEmailSsoAllowed($email)) {
        return null;
    }
    return ['id' => null, 'email' => $email];
}
