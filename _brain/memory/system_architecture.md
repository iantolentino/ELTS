# SYSTEM ARCHITECTURE

> Confirmed 2026-07-19. Updated only when architecture decisions change (see `decisions/decision_log.md`).

---

## Architecture Pattern
Modular Monolith with a **Centralized Controller** — a single `index.php` at project root handles
every incoming request and routes it internally. No microservices, no separate API layer.

## Layer Map
| Layer      | Technology | Responsibility                                                    |
|------------|------------|--------------------------------------------------------------------|
| Frontend   | PHP server-rendered views + Tailwind CSS (shadcn-style components) | Render HTML directly from PHP, no client-side framework |
| Backend    | PHP 8.x, hand-rolled router in `index.php` | Route clean URLs, enforce auth + department isolation, dispatch to controllers/actions |
| Database   | MySQL 8.0+ via PDO (prepared statements only) | Persistent storage — tickets, users, departments, audit trail |
| Cache      | `system_cache` MySQL table (60s TTL) | Read-through cache for expensive aggregate stats (dashboard tallies, SLA counts) |
| Queue      | none | Not needed at current scale |
| Auth       | PHP session (`$_SESSION`), `role` enum, `password_hash()` | Login/logout, role-based access, department scoping |

## Data Flow
Browser request → `.htaccess` rewrites clean URL → `index.php` front controller parses path
(`/`, `/admin/`, `/{dept-slug}/`, `/{dept-slug}/ticket/{id}`) → auth/session check → department
isolation check (agents hard-scoped to their `department_id`) → dispatch to the matching
controller/action → PDO model layer queries MySQL, checking `system_cache` first for expensive
aggregates → controller renders a PHP view (Tailwind/shadcn-style markup) → HTML response.

Every mutating action (status change, reassignment, note edit) also writes to `audit_logs` /
`status_history` synchronously in the same request — audit logging is not deferred or async.

## External Integrations
None at MVP. Email notifications are referenced by the legacy prototype's `notifyEmail()` stub
pattern but are not yet part of the MTS v2.0 confirmed scope — revisit if/when required.

## Scaling Strategy
- `LIMIT`/`OFFSET` pagination capped at 25 rows per dashboard page
- Compound indexes on `tickets(department_id, status)`, `tickets(requestor_email)`,
  `audit_logs(ticket_id)`, `users(email, role)`, `spam_trackers(requestor_email, next_allowed_at)`
- `system_cache` table absorbs repeated reads of heavy aggregate queries (60s TTL)
- Escalating cooldown (30m → 1h → 24h) blunts spam/bot load before it reaches the DB

## Known Risks
- `OFFSET`-based pagination gets linearly slower as ticket count grows very large (tens of
  thousands+ rows per department) — acceptable at current expected scale, revisit with
  keyset/cursor pagination if a department's ticket volume grows an order of magnitude
- Session-based auth assumes a single app server (fine for one cPanel host); would need a shared
  session store or sticky sessions if ever load-balanced across multiple servers
- `system_cache` is invalidated only by TTL expiry (no explicit invalidation on write) — stats can
  be up to 60s stale by design; acceptable per spec, but a hard requirement for "always fresh"
  numbers would need active invalidation instead

## Architecture Decisions
See: `decisions/decision_log.md`
