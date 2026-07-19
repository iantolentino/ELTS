# AUTH BOUNDARIES

> Confirmed 2026-07-19. Update only when auth model changes.

---

## Authentication Method
PHP session cookies (`$_SESSION`), started via `session_start()`. No JWT/OAuth — single-server
cPanel deployment doesn't need stateless tokens.

## Authorization Model
RBAC via `users.role` enum (`superadmin` / `agent`), combined with row-level ownership scoping on
`users.department_id` for agents (department isolation is enforced at the query layer, not just
the route layer — every ticket query for an agent role must filter `WHERE department_id = ?`).

---

## Roles

| Role       | Description                                   | Permissions |
|------------|------------------------------------------------|-------------|
| Superadmin | Full cross-department access                   | CRUD all tickets/depts/users; "View As" any agent; toggle feature flags in `settings`; CSV/print export; archive (behind confirmation modal) |
| Agent      | Department-scoped staff (`users.department_id`) | CRUD tickets within own department only; internal notes/attachments on own-department tickets; cannot see or modify other departments' data; `can_accept_tickets` flag gates whether they can self-assign |
| Public / Requestor | Unauthenticated visitor              | Submit a ticket (subject to burst limiter/cooldown); look up ticket status by ticket ID + requestor email; view Service Status Hub banner |

---

## Protected Routes

| Route pattern              | Required Role       | Notes                                                    |
|-----------------------------|----------------------|-----------------------------------------------------------|
| `/`                          | Public               | Requestor portal — submit + status lookup                 |
| `/admin/`                    | Superadmin           | Super admin dashboard, user/dept mgmt, feature flags, exports |
| `/{dept-slug}/`               | Agent (own dept only) | Department dashboard — 403/redirect if `department_id` mismatch |
| `/{dept-slug}/ticket/{id}`     | Agent (own dept) or Superadmin | Ticket detail — same department-isolation check as above |
| `/private/migration-command.php` | Shared token (`MIGRATION_CHECK_TOKEN` in `config.php`), not a user role | DB verification script — deliberately HTTP-reachable per README Step 3 (before Step 4's lockdown); `.htaccess` does NOT block `/private/` (see `fixes/fix_log.md` F001); protected instead by a `?token=` check via `hash_equals()`. Directory listing still disabled globally via `Options -Indexes`. |

---

## Session Rules
- Token type: PHP session ID (server-side session store)
- Token expiry: session cookie, invalidated on logout; idle timeout to be enforced via
  `session.gc_maxlifetime` (see backlog T037 — session hardening)
- Refresh strategy: not applicable (session-based, not token refresh)
- Logout behavior: `session_destroy()` + session cookie cleared server-side (`logout.php`/equivalent action)
- Session ID must be regenerated on login (`session_regenerate_id(true)`) to prevent session fixation

---

## Auth Rules
- Never expose internal user IDs or department IDs in URLs beyond the slug (use `department_id`
  only server-side; public-facing identifiers are the `dept-slug` and ticket `id`)
- Every ticket query for an agent role must filter by `department_id` at the SQL layer, not just
  hide UI elements — isolation must survive a direct URL/ID guess
- Rate-limit ticket submission via the burst limiter/escalating cooldown (already in scope)
- Password hashing via `password_hash()` (bcrypt/argon2 default), verified with `password_verify()`
- CSRF tokens required on all state-changing POST actions (login, ticket actions, admin actions) — backlog T035
