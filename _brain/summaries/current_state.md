# CURRENT STATE

> The AI reads this file at the start of every EXECUTION_MODE session.
> Update this file at the end of every session — before stopping.

---

## System State
SYSTEM_GENERATION complete — ready for EXECUTION_MODE

## Current Phase
MVP

## Last Completed Task
T054 — Multi-department tickets (full shared ownership)
Completed: 2026-07-21 — **Phase 11 (Gap Closure & Extensions, T049–T054) is now fully complete.**
Only Phase 9 (Deploy: T038 finalize config docs, T039 cPanel verification pass) and the
still-BLOCKED T040 remain of the original MVP backlog.

## Next Task
T038 — Finalize config.php deploy instructions
Depends on: T002 (COMPLETE)

## Active Blockers
T040 (ELTS repo wipe + push) is BLOCKED pending a fresh, explicit user confirmation at the time
it's actually run — not blocking any other task in the meantime.

## Session Notes
- MTS spec (README.md + database.sql) confirmed 2026-07-19 and written verbatim to project
  root; full context in `memory/app_context.md` and `memory/system_architecture.md`.
- Frontend decision: PHP-rendered views + Tailwind/shadcn-style components, NOT a React/Vite SPA —
  see `decisions/decision_log.md` [STACK] and `decisions/rejected_options.md`.
- Legacy SQLite prototype archived to `_brain/staging/legacy-sqlite-prototype/` (not deleted,
  available for reference) — not part of the new build.
- Project root is inside `htdocs` (`c:\xampp\htdocs\ticketing-app`), reachable locally at
  `http://localhost/ticketing-app/` — use this to smoke-test each task as it's built.
- Full 40-task dependency-ordered backlog is in `progress/backlog.md`, with per-task acceptance
  criteria under "Task Detail". Work strictly one task at a time per `tasks/task_rules.md`.
- `db_backup/backup_policy.md` intentionally left open (`R001` in backlog) — spec didn't define a
  cadence, do not assume one.
- T002 added a `.gitignore` (excludes `config.php`) and `config.example.php` as the committed
  placeholder template — `config.php` on disk holds real local XAMPP defaults (`root`/blank
  password/`ticketing_app` DB) per `security/secrets_policy.md`.
- **F001 (see `fixes/fix_log.md`)**: `/private/` is NOT Apache-blocked — README Step 3 requires
  browsing to `migration-command.php` before Step 4 locks anything down. Access control for that
  script is a `?token=` check against `MIGRATION_CHECK_TOKEN` (in `config.php`), not `.htaccess`.
  Any future file placed in `/private/` needs its own auth check — the directory itself is only
  protected from listing (`Options -Indexes`), not from direct requests.
- Local MySQL DB `ticketing_app` now exists (XAMPP) with `database.sql` imported — 12/12 tables
  verified live via `/private/migration-command.php?token=local-dev-check`. Reusable for smoke-testing every subsequent task at `http://localhost/ticketing-app/`.
- App shell now exists: `index.php` (router) → `auth.php` (session/login/guards) →
  `controllers/{public,admin,department}_controller.php` → `views/layout.php` (`renderPage()`,
  `send404()`, `send403()`) → `assets/app.css` (shadcn-style static CSS, no build step). Later
  tasks extend these files rather than replacing them.
- Local-only seed data in `ticketing_app` (not in `database.sql`, dev DB only — recreate if the DB
  is ever dropped): departments `it` (id 1) / `hr` (id 2); users `super@example.com` / superadmin
  `Sup3rSecret!`; `itagent@example.com` / agent (dept 1) `AgentPass1!`; `hragent@example.com` /
  agent (dept 2) `HrPass1!` (added during T015 to test cross-department rejection). 30 extra IT
  tickets seeded during T011 for pagination testing (31 IT tickets total).
- Phase 2 (T009–T017) built out the full ticket lifecycle in `controllers/public_controller.php`
  (submit + status lookup) and `controllers/department_controller.php` (dashboard, detail, status
  transitions, reassignment, notes, attachments) — all directly on `dbFetchAll`/`dbInsert`/`dbUpdate`
  from `db.php`, no ORM layer.
- **Resolution summary (T014) has no dedicated `tickets` column** — `database.sql` is the user's
  exact spec and doesn't have one. Stored as an `audit_logs` row instead
  (`action_type = 'RESOLUTION_SUMMARY'`). T033 (report export) must read it from there — see
  `decisions/decision_log.md` [ARCH].
- **T008 correction**: an earlier verification pass for T008 checked HTTP status codes only, which
  don't distinguish "authenticated, viewing real content" from "not logged in, showing the login
  form" (both are 200). Re-verified by response body during T012 — the underlying guard was
  correct all along, only that one piece of evidence was weak. Going forward, always assert on
  response **content**, not just status code, when testing authenticated views.
- Attachment security model (T017): `uploads/` has `Require all denied` in `.htaccess` — files are
  never reachable by direct URL, only through the ticket route's `?download=<id>` handler, which
  re-checks the attachment belongs to the exact ticket already isolation-checked in that request.
  Stored filenames are always server-generated random hex, never the user-supplied name.
- Every Phase 2 task was verified against the real local stack (XAMPP Apache + MySQL), not just
  read for correctness — curl-based request/response checks, `diff` on downloaded file bytes, and
  direct MySQL queries to confirm `status_history`/`audit_logs` rows.
- **Standing rule from F002 (system_cache timezone bug)**: never compute a timestamp with PHP's
  `date()`/`time()` and compare it against MySQL's `NOW()` — this box's PHP default timezone and
  MySQL server timezone are hours apart. Always do time arithmetic inside the SQL query itself
  (`DATE_ADD(NOW(), INTERVAL ...)`) when it has to line up with a MySQL-side comparison. Applied
  in both `cache.php` (T018) and the SLA deadline insert (T020).
- `cache.php`'s `cacheRemember()` is the shared caching primitive — reuse it for any future
  aggregate/expensive query rather than writing a new ad hoc cache mechanism.
- `department_controller.php`'s `IS_OVERDUE_SQL` constant is the canonical overdue check — reuse
  it (not a hand-rolled condition) anywhere else overdue status needs to be read (e.g. T024 super
  admin dashboard, T032/T033 exports).
- Test data note: ticket #36 ("Server down", urgent priority) was created during T020 testing and
  is currently `closed` with a resolution summary — harmless, real seed-adjacent data.
- `spam_limiter.php` (T021/T022) is the shared rate-limit gate — `checkSpamLimiter($email)`, called
  from `handleTicketSubmission()` only after normal field validation passes. Reuse this for any
  other future public-facing write endpoint that needs the same protection.
- `controllers/admin_controller.php` now has real content (Service Status Hub CRUD), not just the
  login-gated placeholder — future admin features (T025–T029, T032, T033) extend this same file/route.
- Test data left in `ticketing_app`: `service_status` has "Email Service" (down, currently hidden)
  and "Web Portal" (operational, visible) rows from T023 testing — harmless, can be cleared or kept.
- `burst@example.com`'s spam_trackers/test tickets were cleaned up after T021/T022 testing (no
  lingering 24h lockout left behind).
- **Testing gotcha (Git Bash / MSYS on this Windows box)**: any Bash-tool argument that *starts
  with* `/word` — including a `curl -w` format string like `"/hr/ -> %{http_code}\n"`, not just
  file paths or URLs — can get silently auto-converted to a Windows path (e.g.
  `C:/Program Files/Git/hr/...`), corrupting the output and embedded `\n` escapes. This looked
  exactly like a real session/auth bug during T025 testing and cost real time to rule out. Fix:
  never start a `-w`/diagnostic string with `/`; prefix with a label instead (e.g.
  `"hr_status=%{http_code}\n"`). Setting `MSYS_NO_PATHCONV=1` is NOT a safe blanket fix — it
  breaks `/tmp/...`-style cookie-jar file arguments instead. When a curl-based test result looks
  contradictory or impossible, suspect this before suspecting the app.
- **T030 (central audit log helper)**: new `audit.php` → `writeAuditLog($ticketId, $actorId,
  $actionType, $oldValue, $newValue)`, required in `index.php` right after `db.php`. Every
  mutating ticket action funnels through it now — `applyStatusTransition()`,
  `applyReassignment()`, `applyAddNote()` in `department_controller.php` — no more direct
  `dbInsert('audit_logs', ...)` calls anywhere else. Status transitions now log a `STATUS_CHANGE`
  row on every change (not just the terminal `RESOLUTION_SUMMARY` on close as before) — needed
  because `status_history` has no `actor_id` column and T031's audit trail viewer needs one. Notes
  now log `NOTE_ADDED`. Any future mutating action (e.g. attachment upload) should call
  `writeAuditLog()` too rather than inserting directly.
- **This XAMPP box's `config.php` and `ticketing_app` DB were missing** when this session started
  (gitignored/local-only, not restored from a prior session) — recreated per the documented
  fresh-clone steps (`config.example.php` → `config.php`, `root`/blank password, `database.sql`
  imported) to smoke-test T030. Re-seeded only `departments` (`it`/`hr`) and the three documented
  test users (`super@example.com`, `itagent@example.com`, `hragent@example.com` — same passwords
  as before). **No ticket data was reseeded** — the previously-noted "31 IT tickets", ticket #36,
  and service_status test rows from earlier sessions no longer exist on this box; create fresh
  scratch data as needed for future smoke tests, same as T030's test ticket (created, exercised,
  then deleted — cascades clean up its audit_logs/status_history/internal_notes rows).
- **Mock data added at user request (2026-07-20, not a backlog task)**: a third department
  (`Finance`, slug `finance`) plus `financeagent@example.com` / `FinancePass1!`, and 10 tickets
  spread across IT/HR/Finance with varied status/priority/assignment (ticket #4 IT and #8 Finance
  closed with real resolution summaries; #3 and #9 have reassign/note activity) — ids are not
  contiguous from 1 because the T030 scratch ticket (id 1) was created and deleted first. This is
  standing local dev data, not scratch — leave in place unless a future task needs a clean slate.
- **Schema change (2026-07-20, not a backlog task)**: `tickets` gained `team_leader_name` and
  `client_name` (both `VARCHAR(150) NOT NULL`), added to `database.sql` and the live
  `ticketing_app` DB — see `decisions/decision_log.md` [ARCH] for the full reasoning (this is the
  first change to the previously-fixed `database.sql`). Both are required fields on the public
  submission form, shown on the agent ticket detail view, and included in the T032/T033 CSV/print
  report. Any future insert into `tickets` (raw SQL or otherwise) must supply both — they are
  `NOT NULL` with no default. Existing mock tickets (created before this change) were backfilled
  to `'Unspecified'`.
- **T031 (audit trail viewer)**: `handleDepartmentTicket()` now fetches `audit_logs LEFT JOIN
  users` (LEFT JOIN so a NULL `actor_id` still renders, as "System") scoped by the ticket already
  isolation-checked earlier in the same request, ordered `timestamp DESC, id DESC` — the id
  tiebreak matters because multi-row writes from the same request (e.g. T030's `STATUS_CHANGE` +
  `RESOLUTION_SUMMARY` on close) land in the same second. New `renderAuditTrailSection()` in
  `department_controller.php` replaces the placeholder note T030 left on the ticket detail page.
- **T032/T033 (reports)**: one "Reports" admin section (`ADMIN_SECTIONS['reports']`) backs CSV
  export, the print/PDF view, and an in-app filter/preview — all three call the same
  `getReportFilters()`/`fetchReportTickets()` in `admin_controller.php`, so they can't drift out
  of sync. `?section=reports&format=csv|print` bypass the admin shell entirely (`format=print`
  calls `renderPage()` directly, not `renderAdminShell()`, so there's no admin nav in the printed
  output). `resolution_summary` is a correlated subquery against `audit_logs` for the latest
  `RESOLUTION_SUMMARY` row per ticket (per T014's decision that it lives there, not in `tickets`).
- **T034 (knowledge base)**: two parallel implementations over the same `knowledge_base` table —
  after asking the user (KB CRUD's own acceptance criteria required confirming this, not
  assuming), the answer was department agents author for their own department, superadmin
  authors/moves across any department. Agent side: `/{dept}/kb` route + `handleDepartmentKb()` in
  `department_controller.php`, every query hard-scoped to that route's own department id. Admin
  side: new `kb` section in `admin_controller.php`, unscoped, with a department picker. Both use
  the T027 two-step delete confirmation. Function names are deliberately separate per side
  (`applySaveKbArticle()` vs `applySaveKbArticleAdmin()`, etc.) since the isolation shape differs
  enough not to share code.
- **Layout change, superseded**: an earlier `.container: width:100%` (uncapped) change caused the
  "everything stretched edge-to-edge" bug the user reported (confirmed via a screenshot they
  shared) — fixed by T041's `max-width:1200px`. See T041 below for the real story; the original
  uncapped version is gone.
- **Playwright/Chrome screenshot workflow discovered this session** (T041): `dev-browser` CLI is
  installed globally but its daemon wouldn't start in this environment. Fallback that works: the
  global `playwright` npm package (`C:\laragon\bin\nodejs\node-v22\node_modules`) + local Chrome
  (`C:\Program Files\Google\Chrome\Application\chrome.exe`), driven via a plain Node script with
  `NODE_PATH` set to that global `node_modules` dir (otherwise `require('playwright')` fails from
  any other working directory — scratchpad included). Reuse this for any future "verify in a
  browser" need on this box rather than re-discovering it.
- **T035 (CSRF)**: new `csrf.php`, enforced once app-wide in `index.php` (`enforceCsrfOnPost()`
  before routing) rather than per-handler — every POST on every route needs a valid
  `csrf_token` or gets 403. `csrfField()` added to all 20 forms across the app, including login.
- **T036 (validation/XSS sweep)**: found and fixed **F003** — every admin "Edit" button's onclick
  JS prefill was silently broken (see `fixes/F003-onclick-json-encode-escaping.md`). This was
  invisible to all the curl-based HTTP testing done throughout this session (status codes/redirects
  looked fine) — only surfaced by reading raw HTML during this audit. Worth remembering: curl
  testing verifies server-side behavior, not client-side JS/attribute correctness — a real browser
  check (or at minimum inspecting raw attribute output) is needed for anything building HTML
  attributes from dynamic values, especially `onclick`/`onchange` handlers built with
  `json_encode()`.
- **T037 (session hardening)**: `SESSION_IDLE_TIMEOUT_SECONDS` (1800s) in `config.php`/
  `config.example.php`; `auth.php`'s `currentUser()` force-logs-out anything older than that,
  refreshing `last_activity` on every authenticated request. `session.cookie_samesite=Lax` always
  set; `session.cookie_secure=1` only when `$_SERVER['HTTPS']` is present (unconditional would
  break login on this HTTP-only local box).
- **Phase 10 schema additions (2026-07-21)**: six new tables beyond what T044/T045/etc.'s own
  backlog notes already cover in detail — `faq_items`, `request_types`, `request_type_fields`,
  `ticket_comments`, `requester_accounts`, `ticket_tags` — plus `tickets` gained `request_type_id`
  and `custom_fields JSON`. All added to both `database.sql` (source of truth) and this box's live
  `ticketing_app` DB. A fresh clone/import now needs all of these; `database.sql` is current.
- **Emoji-in-SQL gotcha (T045)**: this Windows box's shell → `mysql -e "..."` CLI pipeline
  silently mangles multi-byte UTF-8 literals (e.g. emoji) in SQL text into `?`, even with
  `mysql --default-character-set=utf8mb4` set — confirmed via `SELECT HEX(...)`, not just a
  terminal-display issue, the stored bytes were actually wrong. Never put a literal emoji/
  multi-byte character directly in a `mysql -e` command on this box. Two safe alternatives used
  this session: (1) an ASCII SQL `DEFAULT` + the app supplies the real UTF-8 default in PHP at
  insert time (PHP source is UTF-8, `db.php`'s PDO connection is `utf8mb4` — that path is fine),
  or (2) values submitted through an actual HTTP request (also fine, same PDO path). Only raw
  shell/CLI arguments are the problem.
- **T042–T048 (Trackr port continued)**: see each task's own detailed notes in
  `progress/backlog.md` — portal redesign, theme toggle, FAQ, request types, comments, requester
  accounts, tags. All eight Phase 10 tasks verified live via a real Chromium browser (Playwright +
  local Chrome, see the T041 note above on how to drive one on this box) with zero console/page
  errors, not just curl-based HTTP checks — curl alone would have missed T041's onclick-escaping
  bug (F003) the way it already had for six prior admin sections.
- **Schema follow-through (2026-07-20)**: the `team_leader_name`/`client_name` fields added
  earlier this session are now also shown as columns in the department dashboard ticket list
  table (`renderDashboardContent()` in `department_controller.php`), per user request — not just
  the ticket detail view and reports.
- **Phase 10 reference material**: `github.com/iantolentino/ticketing-system.git` ("Trackr")
  cloned (git history stripped) to `_brain/staging/trackr-reference/` — read-only design/feature
  reference for T041–T048, not part of this repo's runtime, never `require`d by any PHP file.
  Different stack (Next.js/Prisma/Postgres) — every task in Phase 10 is a re-implementation in
  PHP/MySQL matching ELTS's own conventions, not a code port. Its `src/config/constants.ts` (nav
  items, icons, status/priority color tokens) and `src/components/layout/Sidebar.tsx` /
  `src/app/portal/PortalClient.tsx` are the two most-referenced files so far.
- **T041 (sidebar)**: new `renderSidebarShell()` in `views/layout.php`, shared by
  `renderAdminShell()` and new `renderDepartmentShell()`. Nav icons are plain UTF-8 glyphs (⬡ ◆ ◎
  ▦ ▤ ⊙), not HTML entities — `renderSidebarShell()` runs every icon through `htmlspecialchars()`
  same as every other field, so a numeric entity string would double-escape into visible garbage
  (this actually happened and was fixed — see backlog.md's T041 notes). Any future nav item added
  to `ADMIN_NAV_ICONS`/`DEPARTMENT_NAV_ICONS` must use a real character, not `&#...;`.
- **Phase 11 (2026-07-21, T049–T054) — gap closure against the user's own MTS spec notes**: see
  each task's detailed notes in `progress/backlog.md`. Headline additions: `in_progress` ticket
  status + atomic race-safe "Claim" button; passive agent presence (no heartbeat endpoint);
  per-department auto-assignment (least-loaded agent); cross-department public FAQ search;
  optional `budget_amount`; and full multi-department shared ownership via new
  `ticket_departments` (holds only departments *beyond* the primary `tickets.department_id`).
- **Two real bugs found mid-implementation — F004 and F005 in `fixes/fix_log.md`, read those
  before writing any new query that joins tables or reuses a condition**: (1) this app's PDO
  connection has `EMULATE_PREPARES=false`, so the same named placeholder (e.g. `:dept_id`) can
  never appear twice in one query string — use `:dept_id`/`:dept_id2` with the same bound value
  instead, or it throws `SQLSTATE[HY093]`. (2) adding a `LEFT JOIN` to a query that referenced
  `created_at`, `updated_at`, or `department_id` unqualified breaks it the moment the joined table
  also has a same-named column (`users` has all three) — MySQL 1052 "ambiguous column". Both bugs
  hit the exact same dashboard/CSV-export queries back to back while building T049/T054 — qualify
  every column explicitly (`tickets.foo`) the moment a query touches more than one table, don't
  wait for the error.
- **Along the way, several direct user requests outside the T-numbered backlog** (small enough
  not to warrant their own task IDs, but real behavior changes worth remembering): department
  dashboard table gained a Description column and clickable stat-tile quick-filters; per-department
  CSV export (`?format=csv` on the dashboard, respects the current status filter); **login is now
  rejected outright for an agent whose account belongs to a different department** than the one
  they're logging in on (`requireLogin()` in `auth.php` gained an optional `$requiredDepartmentId`
  — previously the credentials were accepted and only blocked one step later by
  `requireDepartmentAccess()`, which still left a live session established); and the anonymous
  "Check Ticket Status" card was **removed** from the public home page entirely (`handleStatusLookup()`
  and `renderStatusLookupCard()` deleted from `public_controller.php`) now that T047's account-based
  "My Requests" covers that need — anonymous ticket submission (T009) is untouched, but there is no
  longer an anonymous way to check status or reply without registering.

---

- **Git/remote now exists**: local repo initialized, committed, and force-pushed to
  `github.com/iantolentino/ELTS.git` (`main`) so work can continue from another device — done
  early/out of sequence at user request, see T040 in `progress/backlog.md` for the full context
  (including the prior Laravel app's now-overwritten HEAD SHA, kept on record there).
  `config.php` (real local creds) and `/uploads/`, `/logs/*.log` (runtime data) are gitignored —
  a fresh clone needs `config.example.php` copied to `config.php` and filled in before it runs.
  **Going forward**: commit + push at reasonable checkpoints (e.g., end of each phase) so a
  session on another device can `git pull` and resume from `_brain/summaries/current_state.md`
  rather than working from a stale snapshot.

---

## 2026-07-21 — Phase 12 (Dashboard Analytics & Reporting, T055–T065)

New `analytics.php` (required by `index.php` after the controllers) is the shared home for every
stat-card/chart/recent-tickets function — see `progress/backlog.md`'s Phase 12 section for the full
per-task breakdown. Used by: department dashboard (`department_controller.php`), the new
per-department Report tab, the new superadmin "All Tickets" cross-department dashboard, and the
admin Reports section. All hand-rolled (CSS `conic-gradient` pie, flex-box bars, inline SVG line
chart) — no JS charting library, matching the existing no-framework-bloat [STACK] decision.

- **F006** (third occurrence of the F004/F005 ambiguous-column class): `analytics.php`'s
  `fetchRecentTickets()` LEFT JOINs `users`, so its `department_id` had to be `tickets.`-qualified;
  the superadmin ticket filter's `$where` (admin_controller.php) had the same issue since that
  fragment gets reused inside the same joined query. **Standing rule this establishes**: the moment
  a `$where`/`SELECT` fragment built against a bare `tickets` query gets reused inside a query that
  joins `users` (or anything else sharing column names), qualify every touched column by hand —
  don't wait for MySQL 1052.
- Caught F006 via a Playwright smoke pass (screenshot + body-text scan for `Fatal error`/`Warning:`)
  across every new page *before* reporting done — this is now the standard verification pass for
  any dashboard/analytics work in this app, not just a one-off.
- `departments.description TEXT NULL` added live (`ALTER TABLE`, then `database.sql` updated to
  match) — second live schema change since `database.sql` was locked as spec (T053's
  `team_leader_name`/`client_name` was the first).
- Chart date-range state uses `range`/`range_from`/`range_to` query params, deliberately distinct
  from the Reports date filter's `from`/`to` and the dashboard's `status`/`page`, so none of the
  three collide when they appear on the same page.
- Login credentials used for this session's Playwright verification (already documented above):
  `itagent@example.com` / `AgentPass1!`, `super@example.com` / `Sup3rSecret!`.
## 2026-07-21 — Phase 13 (T066 requester name-from-email, T067 SSO groundwork)

Both closed out the two items left open from earlier in this same session:
- **T066**: `deriveNameFromEmail()` in `requester_auth.php`, applied to requester comment
  `author_name` and the My Requests greeting. Verified via Playwright (fresh registration →
  `jane.doe.<timestamp>@example.com` → "Jane Doe ...").
- **T067**: `sso.php` (new) + `SSO_ENABLED`/`SSO_EMAIL_SERVER_VAR` in `config.php`/
  `config.example.php` + `sso_allowed_emails` table (live-migrated and in `database.sql`).
  Deliberately inert today — `requesterCurrentUser()` checks the hook first but
  `ssoAuthenticatedEmail()` always returns null while `SSO_ENABLED` is false, confirmed by re-
  running the full dashboard Playwright smoke pass with the hook wired in (zero regressions).
  **What deployment still has to do**: replace `ssoAuthenticatedEmail()`'s body with whatever the
  chosen IdP integration actually looks like (a reverse-proxy header, a real OAuth/OIDC callback,
  etc.) and populate `sso_allowed_emails`. Nothing else in the app needs to change — every
  requester-facing call site already keys off `->email`, not `->id`.

## 2026-07-21 — Department Tickets Sidebar Split

User-requested UI change: the per-department ticket table/filter/export/claim surface moved out of
the department dashboard into a dedicated sidebar item, `Tickets`, at `/{dept}/tickets`.
Department dashboard now keeps the analytics/stat-card/charts/recent-activity surface only; ticket
detail pages highlight `Tickets` and their back link returns to `/{dept}/tickets`.

Last updated: 2026-07-21 (Department Tickets Sidebar Split)
