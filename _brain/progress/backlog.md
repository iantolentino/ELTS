# BACKLOG

> Tasks are ordered by dependency. Do not execute a task until all dependencies are COMPLETE.
> Confirmed 2026-07-19 from the MTS spec (`README.md` + `database.sql`). One task per AI
> session — see `tasks/task_rules.md`. Full templates for each task type: `tasks/task_templates.md`.

---

## Phase 0 — MVP: Foundation

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T001 | Archive legacy SQLite prototype, clean project root                | HIGH     | none       | COMPLETE |
| T002 | `config.php` — DB credentials, feature flags, upload allow-list    | HIGH     | T001       | COMPLETE |
| T003 | `db.php` — PDO connection + prepared-statement query helpers       | HIGH     | T002       | COMPLETE |
| T004 | `.htaccess` — clean URLs, no directory listing, gzip (see F001 re: `/private/`) | HIGH | T001 | COMPLETE |
| T005 | `/private/migration-command.php` — schema/connectivity check       | MEDIUM   | T002, T003 | COMPLETE |

## Phase 1 — MVP: Routing & Auth

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T006 | Centralized `index.php` router (`/`, `/admin/`, `/{dept}/`, `/{dept}/ticket/{id}`) | HIGH | T003, T004 | COMPLETE |
| T007 | Login/logout + session auth + password hashing                     | HIGH     | T003, T006 | COMPLETE |
| T008 | Department-isolation enforcement (agents hard-scoped to `department_id`) | HIGH | T007       | COMPLETE |

## Phase 2 — MVP: Ticketing Engine

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T009 | Public ticket submission form                                      | HIGH     | T006, T003 | COMPLETE |
| T010 | Public ticket status lookup                                        | MEDIUM   | T006, T003 | COMPLETE |
| T011 | Paginated department dashboard (`LIMIT 25 OFFSET`)                 | HIGH     | T008       | COMPLETE |
| T012 | Ticket detail view                                                  | HIGH     | T011       | COMPLETE |
| T013 | Status transitions + `status_history` logging                      | HIGH     | T012       | COMPLETE |
| T014 | Mandatory resolution summary gate on ticket close                  | HIGH     | T013       | COMPLETE |
| T015 | Ticket reassignment (`assigned_to`)                                 | MEDIUM   | T012       | COMPLETE |
| T016 | Internal notes (agent-only)                                         | MEDIUM   | T012       | COMPLETE |
| T017 | File attachment upload/download                                     | MEDIUM   | T012       | COMPLETE |

## Phase 3 — MVP: Performance

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T018 | `system_cache` read/write helper (60s TTL)                         | HIGH     | T003       | COMPLETE |
| T019 | Cached dashboard stats / SLA tallies                                | MEDIUM   | T011, T018 | COMPLETE |
| T020 | SLA deadline calculation + `is_overdue` flagging                    | MEDIUM   | T013       | PENDING |

## Phase 4 — MVP: Spam & Resilience

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T021 | Burst limiter (`spam_trackers`, 10 tickets / 5 min)                 | HIGH     | T009       | PENDING |
| T022 | Escalating cooldown (30m → 1h → 24h tiers)                          | HIGH     | T021       | PENDING |
| T023 | Service Status Hub (public banner + admin management)               | LOW      | T006       | PENDING |

## Phase 5 — MVP: Super Admin

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T024 | Super admin dashboard (cross-department overview)                   | HIGH     | T019       | PENDING |
| T025 | "View As" mode                                                      | MEDIUM   | T024, T008 | PENDING |
| T026 | Feature-flag command center (`settings` table UI)                   | MEDIUM   | T024       | PENDING |
| T027 | Destructive-action confirmation modals                              | MEDIUM   | T024       | PENDING |
| T028 | Department CRUD                                                     | MEDIUM   | T024       | PENDING |
| T029 | User/agent CRUD (incl. `can_accept_tickets`, presence/`is_online`)  | MEDIUM   | T024, T007 | PENDING |

## Phase 6 — MVP: Accountability

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T030 | Central `audit_logs` write helper, wired into every mutating action | HIGH    | T013, T015, T016 | PENDING |
| T031 | Audit trail viewer on ticket detail                                  | MEDIUM   | T030       | PENDING |

## Phase 7 — MVP: Reporting

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T032 | CSV export (super admin)                                            | MEDIUM   | T024       | PENDING |
| T033 | Print/PDF report export (injects resolution summary)                | MEDIUM   | T014       | PENDING |
| T034 | Knowledge base CRUD (per department)                                 | LOW      | T028       | PENDING |

## Phase 8 — MVP: Security Hardening

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T035 | CSRF protection sweep across all state-changing forms/actions       | HIGH     | T009–T034 (all forms exist) | PENDING |
| T036 | Input validation/sanitization sweep across all entry points          | HIGH     | T009–T034  | PENDING |
| T037 | Session hardening (regenerate ID on login, secure cookies, idle timeout) | HIGH  | T007       | PENDING |

## Phase 9 — MVP: Deploy

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T038 | Finalize `config.php` deploy instructions + `config.example.php`    | MEDIUM   | T002       | PENDING |
| T039 | cPanel verification pass via `/private/migration-command.php`        | HIGH     | T005, T035, T036, T037 | PENDING |
| T040 | **Connect to `github.com/iantolentino/ELTS.git`, wipe remote contents, push MTS** | HIGH | T039 (all above COMPLETE) | BLOCKED — requires fresh explicit user confirmation at execution time, see `decisions/decision_log.md` [DEPLOY] |

## Research

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| R001 | Decide DB backup cadence/policy (spec is silent — do not assume)    | LOW      | none       | PENDING |

## Phase 2 — Scale Prep (Deferred)

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| S001 | Real email delivery (SMTP/API) replacing any log-based stub          | LOW      | T009       | DEFERRED |
| S002 | Keyset/cursor pagination (replace `OFFSET`) if ticket volume grows large | LOW  | T011       | DEFERRED |
| S003 | Active `system_cache` invalidation on write (vs. TTL-only expiry)    | LOW      | T018       | DEFERRED |

## Phase 3 — Scaling

| ID   | Task                  | Priority | Depends On | Status  |
|------|-----------------------|----------|------------|---------|

---

## Task Status Key
| Status      | Meaning                            |
|-------------|------------------------------------|
| PENDING     | Not started                        |
| IN_PROGRESS | Currently executing                |
| COMPLETE    | Done and usable                    |
| BLOCKED     | Waiting on dependency (or explicit re-confirmation, per T040) |
| DEFERRED    | Scoped for a later phase, not MVP  |
| REJECTED    | Will not implement — see decisions |

---

## Rejected Tasks
See: `decisions/rejected_options.md`

---

## Task Detail

Full detail for each MVP task (`Standard Feature Task` template from `tasks/task_templates.md`).
Bug-fix and research tasks use their own templates when opened.

### T001 — Archive legacy SQLite prototype, clean project root
Priority: HIGH · Phase: MVP · Depends On: none · Status: **COMPLETE**
Description: Move the SQLite prototype (`config.php`, `db.php`, `functions.php`, `style.css`,
`partials/`, all root `.php` pages, `README.txt`, `emails.log`, `data.sqlite`) into
`_brain/staging/legacy-sqlite-prototype/` so the MySQL/PDO rebuild starts from a clean root.
Acceptance Criteria:
- [x] Project root contains only `README.md`, `database.sql`, `_brain/`, and pre-existing pointer
      files (`.cursorrules`, `.windsurfrules`, `AGENTS.md`, `CLAUDE.md`, `.github/`)
- [x] Prototype fully preserved (not deleted) under `_brain/staging/legacy-sqlite-prototype/`
Output: Clean project root; archived prototype folder.

### T002 — `config.php`
Priority: HIGH · Phase: MVP · Depends On: T001 · Status: **COMPLETE**
Description: Root-level PHP config file defining DB connection constants (host/name/user/pass),
`MAINTENANCE_MODE` flag, and the allowed file-upload extension array, per README Step 1. Ship with
placeholder credentials only (see `security/secrets_policy.md`).
Acceptance Criteria:
- [x] Defines DB connection constants consumed by `db.php` (T003) — `DB_HOST`, `DB_NAME`,
      `DB_USER`, `DB_PASS`, `DB_CHARSET`
- [x] Defines `MAINTENANCE_MODE` boolean and `ALLOWED_UPLOAD_EXTENSIONS` array (+ `MAX_UPLOAD_SIZE_KB`)
- [x] `config.example.php` (committed, placeholder values) is the tracked template; `config.php`
      (local XAMPP defaults: `root`/blank password/`ticketing_app` DB) is gitignored via `.gitignore`
- [x] Session bootstrap (`session_start()` + `httponly`/strict-mode flags) included; full hardening
      (regenerate-on-login, idle timeout) deferred to T037 by design
Output: `config.php`, `config.example.php`, `.gitignore`.
Notes: DB name `ticketing_app` is a local-dev default — change freely, not a spec requirement.

### T003 — `db.php`
Priority: HIGH · Phase: MVP · Depends On: T002 · Status: **COMPLETE**
Description: PDO connection bootstrap and shared query-helper functions. All application code
must use these helpers with prepared statements — no raw string-concatenated SQL anywhere.
Acceptance Criteria:
- [x] PDO connection (`getDb()`, lazily instantiated singleton) uses constants from `config.php`,
      `ERRMODE_EXCEPTION` + `EMULATE_PREPARES = false` set
- [x] `dbQuery`/`dbFetchOne`/`dbFetchAll`/`dbInsert`/`dbUpdate`/`dbDelete` helpers exist, all
      parameterized, for reuse by every later task
- [x] No raw SQL interpolation of values possible via the helper API — `dbUpdate`/`dbDelete`
      callers must pass `whereSql` as named placeholders, not inline literals (documented inline)
- [x] Syntax-checked with `php -l` (no MySQL instance connected yet — full connectivity check is T005)
Output: `db.php`.

### T004 — `.htaccess`
Priority: HIGH · Phase: MVP · Depends On: T001 · Status: **COMPLETE**
Description: Apache config enforcing clean URLs through `index.php`, disabling directory listing,
and enabling Gzip/DEFLATE compression, per README Step 4.
Acceptance Criteria:
- [x] Requests to `/{anything}` route through `index.php` (mod_rewrite) — verified live (see T005)
- [x] `Options -Indexes` (no directory browsing), inherited by all subdirectories including `/private/`
- [x] `/private/` deliberately NOT Apache-blocked — see F001 below; protection moved to
      application-level token check in `migration-command.php` to match README Step 3's flow
- [x] Gzip/DEFLATE enabled for text/html/css/js/json/xml responses
Output: `.htaccess`.
**Correction (F001):** initial version used `Require all denied` on `/private/`, which would have
made T005's script unreachable per the README's own Step 3 instructions. Fixed same session —
see `fixes/fix_log.md` F001 and `security/auth_boundaries.md`.

### T005 — `/private/migration-command.php`
Priority: MEDIUM · Phase: MVP · Depends On: T002, T003 · Status: **COMPLETE**
Description: Browser-accessible script (protected by a shared token, not `.htaccess`) that
verifies DB connectivity and confirms every table from `database.sql` exists and is readable, per
README Step 3.
Acceptance Criteria:
- [x] Connects via `db.php`, reports pass/fail clearly (HTML report + correct HTTP status code)
- [x] Checks each of the 12 tables from `database.sql` exists and is readable
- [x] Fails loudly: HTTP 500 + red banner on DB/schema failure, HTTP 403 on missing/wrong
      `?token=` (checked via `hash_equals()` against `MIGRATION_CHECK_TOKEN`)
- [x] **Live-verified**: created local `ticketing_app` MySQL DB, imported `database.sql` (12
      tables), confirmed via `curl` through XAMPP Apache: no token → 403, wrong token → 403,
      correct token → 200 with all 12 tables + summary reporting OK
Output: `private/migration-command.php`; local `ticketing_app` DB now exists and matches schema.

### T006 — Centralized router (`index.php`)
Priority: HIGH · Phase: MVP · Depends On: T003, T004 · Status: **COMPLETE**
Description: Single front controller parsing the clean-URL path and dispatching to the correct
public/agent/admin handler. Implements the "Centralized Controller" architecture from the README.
Acceptance Criteria:
- [x] Routes `/`, `/admin/`, `/{dept-slug}/`, `/{dept-slug}/ticket/{id}` to distinct handlers
      (`controllers/public_controller.php`, `admin_controller.php`, `department_controller.php`)
- [x] Unknown routes return a proper 404 (`send404()` in `views/layout.php`), not a PHP error —
      verified for bad dept slug, extra admin segments, and non-numeric ticket ID
- [x] No direct `.php?dept=` style URLs required or exposed; `BASE_URL`/`url()` helper keeps links
      correct whether deployed at domain root or a subfolder
Output: `index.php`, `views/layout.php`, `controllers/{public,admin,department}_controller.php`,
`assets/app.css`.
**Live-verified** via `curl` through XAMPP Apache: `/` 200, `/admin/` 200, `/admin/x` 404, `/it/`
200, `/it/ticket/7` 200 (renders "Ticket #7 — IT Support"), `/it/ticket/x` 404, `/nope/` 404,
`/assets/app.css` 200 (static passthrough intact). Seeded two local-only test departments
(`it`, `hr`) directly in the dev DB for this — not part of `database.sql`, which stays pure DDL.

### T007 — Login/logout + session auth
Priority: HIGH · Phase: MVP · Depends On: T003, T006 · Status: **COMPLETE**
Description: Session-based authentication for `agent`/`superadmin` roles using `password_hash()`/
`password_verify()` against `users.password_hash`.
Acceptance Criteria:
- [x] Login validates credentials via prepared statement (`attemptLogin()` in `auth.php`), sets
      session on success
- [x] `session_regenerate_id(true)` called on successful login (`loginUser()`)
- [x] Logout destroys the session server-side (`logoutUser()` — clears `$_SESSION`, expires the
      cookie, calls `session_destroy()`)
- [x] Invalid credentials show one generic "Invalid email or password." message regardless of
      whether the email exists — no user-enumeration leak
Output: `auth.php` (shared `requireLogin()`/`handleLogoutIfRequested()`/login-form renderer, reused
by both `admin_controller.php` and `department_controller.php` — avoids duplicating the login flow
per area).
**Live-verified** with cookie-jar `curl` runs against both areas: login form shown when logged
out, wrong password rejected with the generic message, correct login redirects (302) and persists
across requests (including from `/it/` to `/it/ticket/5`), `?logout=1` clears the session. Seeded
two local-only test users (`super@example.com` / superadmin, `itagent@example.com` / IT agent) —
not part of `database.sql`, dev DB only.

### T008 — Department isolation enforcement
Priority: HIGH · Phase: MVP · Depends On: T007 · Status: **COMPLETE**
Description: Middleware/guard ensuring every agent-role request is scoped to their own
`users.department_id` at the query layer, not just hidden in the UI.
Acceptance Criteria:
- [x] Agent visiting another department's `/{dept-slug}/` path is denied — `requireDepartmentAccess()`
      in `auth.php`, renders 403 (`send403()`), not a redirect that could leak data mid-flow
- [x] Direct ticket-ID URL guesses outside the agent's department are denied — same guard applied
      in `handleDepartmentTicket()`
- [x] Superadmin bypasses the restriction by design (`role === 'superadmin'` short-circuits both
      `requireDepartmentAccess()` and the new `requireSuperadmin()` guard used on `/admin/`)
Output: `requireDepartmentAccess()` + `requireSuperadmin()` in `auth.php`, `send403()` in
`views/layout.php`, wired into `admin_controller.php` and `department_controller.php`.
**Live-verified**: IT agent → `/hr/` 403, `/hr/ticket/3` 403, `/it/` 200, `/admin/` 403 (agents
can't reach the admin area either — same underlying gap T008 was meant to close). Superadmin →
`/hr/`, `/it/`, `/admin/` all confirmed **by response body** ("Logged in as Super Admin
(superadmin)"), not status code alone — a login form also returns 200, so an initial status-only
check would have been inconclusive. Full cross-department bypass confirmed for real (re-verified
2026-07-19 during T012 after noticing the gap).

### T009 — Public ticket submission
Priority: HIGH · Phase: MVP · Depends On: T006, T003 · Status: **COMPLETE**
Description: Public form collecting `requestor_email`, `subject`, `description`, target
department, optional `supplier_name`, optional priority.
Acceptance Criteria:
- [x] Inserts a row into `tickets` via `dbInsert()` (prepared statement)
- [x] Required fields validated server-side (email format, non-empty subject/description,
      department must exist) — independent of any client-side `required` attributes
- [x] POST→redirect→GET on success (`/?submitted=<id>`) shows confirmation with the new ticket ID,
      also preventing duplicate submits on refresh
Output: `controllers/public_controller.php` (`handlePublicHome()`, `handleTicketSubmission()`,
`renderHomeContent()`).
**Live-verified**: invalid submission re-shows the form with all 4 expected field errors and
HTTP 200; two valid submissions correctly insert and redirect to `?submitted=1` / `?submitted=2`;
following the redirect shows "Ticket submitted ... #2" matching the actual inserted ID.
**Mid-task addition (user request):** `assets/app.css` now uses shadcn/ui's actual default OKLCH
color tokens (light + dark via `prefers-color-scheme`), fetched live from
ui.shadcn.com/docs/theming rather than an arbitrary palette — see `decisions/decision_log.md`.
Status badges tie back to shadcn's own `--chart-1..5` tokens.

### T010 — Public ticket status lookup
Priority: MEDIUM · Phase: MVP · Depends On: T006, T003 · Status: **COMPLETE**
Description: Public lookup by ticket ID + requestor email, returning status without exposing
internal notes/audit data.
Acceptance Criteria:
- [x] Requires both ticket ID and matching `requestor_email` in the same `WHERE` clause (no
      ID-only enumeration) — a right-ID/wrong-email guess gets the same generic "no match" message
      as a wrong ID, same anti-enumeration principle as T007's login error
- [x] Returns only public-safe fields (`id`, `subject`, `status`, `created_at`, `updated_at`) —
      `description`, internal notes, assignee, and audit data are never selected for this query
Output: `handleStatusLookup()` in `controllers/public_controller.php`, status section added to
`renderHomeContent()`, status badge classes (`badge-open` etc.) added in T009's shadcn-token pass.
**Live-verified**: wrong email for a real ticket ID → generic no-match message; correct
ID+email → shows `#1 — Printer not working`, `open` badge, submitted/updated timestamps; response
body confirmed to NOT contain the ticket's description text (0 matches).

### T011 — Paginated department dashboard
Priority: HIGH · Phase: MVP · Depends On: T008 · Status: **COMPLETE**
Description: Agent-facing list of the agent's department tickets, `LIMIT 25 OFFSET` pagination,
filterable by status/priority.
Acceptance Criteria:
- [x] Query filters `WHERE department_id = :dept_id [AND status = :status]`, matching
      `idx_tickets_dept_status`'s column order
- [x] Page size fixed at 25 (`DASHBOARD_PAGE_SIZE`), `?page=` drives `OFFSET`
- [x] Isolation from T008 enforced — dashboard query is scoped to the already-verified department,
      no cross-department leakage possible
Output: `handleDepartmentDashboard()` + `renderDashboardContent()` in `controllers/department_controller.php`.
**Note:** `LIMIT`/`OFFSET` are inlined as guaranteed-`(int)`-cast values, not bound params — with
`EMULATE_PREPARES=false` (T003), MySQL's native protocol rejects string-bound LIMIT/OFFSET, and
`dbFetchAll()`'s `execute(array)` always binds `PARAM_STR`. Explained inline in the code; every
actual data value (department, status) stays fully parameterized.
**Live-verified**: seeded 30 extra IT tickets (31 total) across all 4 statuses. Page 1 → exactly 25
rows, "Page 1 of 2 (31 tickets)"; page 2 → 6 rows; `?status=open` → exactly 8 rows; confirmed an
HR-department ticket never appears in the IT dashboard under any filter.

### T012 — Ticket detail view
Priority: HIGH · Phase: MVP · Depends On: T011 · Status: **COMPLETE**
Description: Full single-ticket view: core fields, assigned agent, supplier, SLA/overdue flag —
notes/attachments/history/audit sections added by later tasks (T016, T017, T031).
Acceptance Criteria:
- [x] Enforces same department-isolation guard as T008 (`requireLogin` + `requireDepartmentAccess`)
- [x] **Also enforces a stricter check T008 alone didn't cover**: the ticket fetch itself requires
      `t.department_id = :dept_id`, not just that the agent belongs to the URL's department — this
      closes an ID-mismatch gap (`/it/ticket/2` could otherwise have rendered an HR ticket if id 2
      happened to belong to HR, since the department slug alone doesn't guarantee the ticket does)
- [x] Displays all core `tickets` columns relevant to an agent: subject, status/priority badges,
      overdue flag, requestor, assigned agent (via `LEFT JOIN users`), supplier, created/updated,
      SLA deadline, full description
Output: `handleDepartmentTicket()` + `renderTicketDetail()` in `controllers/department_controller.php`.
**Live-verified**: IT agent on `/it/ticket/1` (real IT ticket) → 200 with correct subject/requestor;
IT agent on `/it/ticket/2` (id belongs to HR) → 404, not leaked; superadmin on `/hr/ticket/2` → 200
with correct HR content, confirming both the isolation fix and the cross-department bypass.

### T013 — Status transitions + `status_history`
Priority: HIGH · Phase: MVP · Depends On: T012 · Status: **COMPLETE**
Description: Change `tickets.status` (open/on-hold/closed/cancelled) and insert a matching row
into `status_history` on every transition.
Acceptance Criteria:
- [x] Every status change writes one `status_history` row (`status_from`, `status_to`) —
      `applyStatusTransition()` updates `tickets.status` and inserts the history row together
- [x] Invalid transitions rejected via an explicit `STATUS_TRANSITIONS` map (`closed`/`cancelled`
      are terminal — empty allowed-list — which covers same-status "closed → closed" as well as
      any transition out of a terminal state)
Output: `STATUS_TRANSITIONS` constant, `applyStatusTransition()`, status-change form in
`renderTicketDetail()`, all in `controllers/department_controller.php`. POST→redirect→GET on
success to avoid duplicate transitions on refresh.
**Live-verified**: `open→on-hold` succeeds, badge updates, `status_history` gets exactly one row;
`on-hold→on-hold` rejected with a clear inline error; after `on-hold→closed`, the status form
disappears entirely ("terminal state") and `closed→open` is rejected — final `status_history` has
exactly the two real transitions, nothing extra.

### T014 — Mandatory resolution summary gate
Priority: HIGH · Phase: MVP · Depends On: T013 · Status: **COMPLETE**
Description: Block the `closed` transition unless a non-empty resolution summary is supplied;
store it for reuse in exports (T033).
Acceptance Criteria:
- [x] Attempting to close without a summary is rejected with a clear message
      ("A resolution summary is required to close a ticket."), ticket status unchanged
- [x] Summary is persisted (`audit_logs`, `action_type = 'RESOLUTION_SUMMARY'`) and retrievable
      for CSV/print export (T033) — see `decisions/decision_log.md` [ARCH] for why it's not a new
      `tickets` column (schema is the user's exact spec, no such column exists)
Output: `applyStatusTransition()` extended with the gate, resolution-summary textarea added to the
status-change form in `renderTicketDetail()` (only shown when "closed" is a valid next status).
**Live-verified**: close attempt with empty summary → rejected, ticket stays `open`; close with a
real summary → succeeds, `audit_logs` row confirmed with the exact text; non-close transitions
(`open→on-hold`) confirmed unaffected — no summary required for those.

### T015 — Ticket reassignment
Priority: MEDIUM · Phase: MVP · Depends On: T012 · Status: **COMPLETE**
Description: Change `tickets.assigned_to`, restricted to agents within the ticket's department (or
superadmin).
Acceptance Criteria:
- [x] Cannot assign to a user outside the ticket's department — `applyReassignment()` requires
      the target to have `department_id = ticket's department AND role = 'agent'`, also rejecting
      non-agent roles (e.g. superadmin) as an assignment target
- [x] Writes `audit_logs` (`action_type = 'REASSIGN'`, `old_value`/`new_value` = prior/new
      `assigned_to`) — direct insert for now, T030 will consolidate every mutating action's audit
      write into one shared helper
Output: `applyReassignment()`, `renderAssignmentForm()` in `controllers/department_controller.php`.
Eligible-agent dropdown respects the existing `can_accept_tickets` flag.
**Live-verified**: assign to the one eligible IT agent → succeeds, `audit_logs` row shows
`NULL → 2`; assign to an HR agent (seeded for this test) → rejected, ticket unchanged; assign to
superadmin (wrong role) → rejected; unassign (empty value) → succeeds, `assigned_to` back to NULL.

### T016 — Internal notes
Priority: MEDIUM · Phase: MVP · Depends On: T012 · Status: **COMPLETE**
Description: Agent-only free-text notes attached to a ticket (`internal_notes`), never visible to
the public requestor.
Acceptance Criteria:
- [x] Notes never rendered on any public-facing view — structurally guaranteed, not just by
      omission: `controllers/public_controller.php` has zero references to `internal_notes`
      (confirmed via grep), so there's no code path that could leak them even by accident
- [x] Note author + timestamp recorded and displayed (`JOIN users` for `agent_name`, `created_at`)
Output: `applyAddNote()`, `renderNotesSection()` in `controllers/department_controller.php`.
**Live-verified**: note added → shows with "IT Agent — <timestamp>"; empty note → rejected;
legitimate public status lookup for the same ticket (correct ID + matching email, confirmed to
actually match and return ticket data) still shows zero occurrences of the note text.

### T017 — File attachments
Priority: MEDIUM · Phase: MVP · Depends On: T012 · Status: **COMPLETE**
Description: Upload/download files against a ticket, restricted to the extensions configured in
`config.php` (T002).
Acceptance Criteria:
- [x] Server-side extension allow-list check (`ALLOWED_UPLOAD_EXTENSIONS`) and size check
      (`MAX_UPLOAD_SIZE_KB`) — independent of the file input's client-side `accept=` (not set, so
      there's no client-side check to accidentally rely on)
- [x] `uploads/.htaccess` sets `Require all denied` on the whole directory — stronger than just
      disabling execution, since downloads must go through the PHP handler either way. Files are
      also stored under server-generated random names (`bin2hex(random_bytes(16))`), never the
      user-supplied filename, eliminating path-traversal/overwrite risk from the upload itself
- [x] Download (`?download=<id>` on the ticket route) re-checks `attachment.ticket_id = $ticketId`
      against the ticket already confirmed to belong to the agent's department earlier in the same
      request — same isolation guarantee as the ticket view itself, not a separate/weaker path
Output: `applyUploadAttachment()`, `streamAttachment()`, `renderAttachmentsSection()` in
`controllers/department_controller.php`; `uploads/.htaccess`.
**Live-verified**: `.pdf` upload succeeds and lists correctly (1 KB); `.exe` upload rejected by
extension; download through the app returns byte-identical content (`diff` clean); direct HTTP
access to the stored file's real path → 403 (both by literal path and by uploads-relative path);
requesting a real attachment ID against the *wrong* ticket ID → 404, not leaked.
**This closes Phase 2 (Ticketing Engine) — T009 through T017 all COMPLETE.**

### T018 — `system_cache` helper
Priority: HIGH · Phase: MVP · Depends On: T003 · Status: **COMPLETE**
Description: `get`/`set` helper reading/writing `system_cache` keyed by `cache_key`, honoring
`expires_at`, transparently falling back to a live query on miss/expiry.
Acceptance Criteria:
- [x] Cache hit returns without hitting the underlying aggregate query (`cacheRemember()`'s
      `$compute` callable is only invoked on miss/expiry)
- [x] Expired entries are treated as a miss and refreshed with the given TTL
Output: `cache.php` (`cacheRemember()`, `cacheForget()`), required from `index.php`.
**Bug caught and fixed (F002, see `fixes/fix_log.md`)**: first version compared a PHP-`date()`
computed `expires_at` against MySQL's `NOW()` — different timezones on this box meant every write
looked already-expired, so the cache never hit at all (3/3 calls recomputed in initial testing).
Fixed by computing expiry entirely inside MySQL (`DATE_ADD(NOW(), INTERVAL :ttl SECOND)`), keeping
both the write and the read on the same clock regardless of either side's timezone config.
**Live-verified** (scratch script, not part of the app): 3 calls within TTL → underlying compute
ran exactly once, all 3 results identical; after forcing `expires_at` into the past → compute ran
again and returned a genuinely new value.

### T019 — Cached dashboard stats
Priority: MEDIUM · Phase: MVP · Depends On: T011, T018 · Status: **COMPLETE**
Description: Aggregate SLA counts / status tallies for the dashboard overview, served through the
T018 cache helper.
Acceptance Criteria:
- [x] Aggregate queries only run on cache miss — per-department `GROUP BY status` query wrapped in
      `cacheRemember('dept_stats_{id}', 60, ...)`
- [x] Numbers match a direct query when cache is cold
Output: Status-count stat tiles added to `renderDashboardContent()` in `controllers/department_controller.php`.
**Live-verified, and more rigorously than "matches when cold"**: cold-cache numbers matched ground
truth exactly (5/9/10/7). Then inserted a ticket directly via SQL (bypassing the app) — the
dashboard kept showing the **stale** pre-insert count while still within the 60s TTL, proving a
real cache hit actually skipped the query (not just "happened to be correct"). After forcibly
expiring the cache row, the next load immediately reflected the true, updated count.

### T020 — SLA deadline + overdue flagging
Priority: MEDIUM · Phase: MVP · Depends On: T013 · Status: **COMPLETE**
Description: Compute/store `tickets.sla_deadline` and flip `is_overdue` once passed.
Acceptance Criteria:
- [x] `is_overdue` reflects `sla_deadline` accurately on read — computed live via SQL
      (`IS_OVERDUE_SQL`), not a stored column maintained by a background job (no scheduler exists
      in this project; see `decisions/decision_log.md` [ARCH])
- [x] Closed/cancelled tickets are excluded — built directly into the SQL condition
      (`status NOT IN ('closed','cancelled')`)
Output: `SLA_HOURS_BY_PRIORITY` + raw `DATE_ADD(NOW(), INTERVAL :sla_hours HOUR)` insert in
`controllers/public_controller.php` (T009's handler, extended); `IS_OVERDUE_SQL` constant used in
both the dashboard list and ticket-detail queries in `controllers/department_controller.php`.
**Note:** SLA-by-priority durations (urgent=4h/high=8h/med=24h/low=72h) are a documented default,
not a spec requirement — see decision log. All SLA timing computed in MySQL, not PHP, deliberately
avoiding a repeat of F002's timezone bug.
**Live-verified**: urgent-priority submission got `sla_deadline` exactly 4 hours after
`created_at` (`TIMESTAMPDIFF` confirmed); forcing a ticket's `sla_deadline` into the past while
`open` showed the "overdue" badge on both the detail view and the dashboard row; closing that same
ticket made the overdue badge disappear immediately (terminal-state exclusion confirmed live).
**This closes Phase 3 (Performance) — T018 through T020 all COMPLETE.**

### T021 — Burst limiter
Priority: HIGH · Phase: MVP · Depends On: T009 · Status: **COMPLETE**
Description: Track submissions per `requestor_email` in `spam_trackers`; block the 11th submission
within a rolling 5-minute window.
Acceptance Criteria:
- [x] 10 submissions in 5 minutes succeed; the 11th is rejected with a clear message
- [x] Window resets correctly after 5 minutes of inactivity (`in_window` computed via
      `last_request_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`, all in SQL)
Output: `checkSpamLimiter()` in `spam_limiter.php`, wired into `handleTicketSubmission()`
(only after normal field validation passes — no point rate-limiting input that'd be rejected
anyway, and it guarantees a sane email before using it as the `spam_trackers` key).
**Live-verified**: 10 rapid submissions as the same email all succeeded (10 tickets actually
inserted); the 11th was rejected with the exact message and the ticket was confirmed NOT inserted
(still 10 rows). Window-reset verified separately under T022 (same test run, since resetting the
window is what unblocks a locked-out email — see below).

### T022 — Escalating cooldown
Priority: HIGH · Phase: MVP · Depends On: T021 · Status: **COMPLETE**
Description: On burst-limit breach, advance `spam_trackers.violation_tier` and set
`next_allowed_at` per tier (30m → 1h → 24h).
Acceptance Criteria:
- [x] First breach locks 30 min, second 1 hr, third+ 24 hr, tier capped at 3 (not unbounded) —
      `COOLDOWN_MINUTES_BY_TIER` in `spam_limiter.php`
- [x] Locked requestor sees a distinct, clear message ("Too many ticket submissions. You can
      submit again in N minutes.") separate from the generic burst-limit message shown while
      still actively locked out ("...Please try again later.")
Output: Same `checkSpamLimiter()` as T021 — tier escalation and lockout are inseparable from
burst detection (both live in `spam_trackers`, same code path).
**Live-verified, full sequence**: breach 1 → tier 1, 30 min lockout; retried while still locked →
correctly blocked by the "already locked" path (tier unchanged, not a fresh breach); forced
expiry + retry → window reset confirmed (`request_count_last_5m` back to 1, not carried over from
12); breach 2 (after reset) → tier 2, 60 min; breach 3 → tier 3, 1440 min (24h); breach 4 → tier
stayed capped at 3, still 1440 min, confirmed not incrementing past the defined ceiling.
**This closes Phase 4's rate-limiting half — T023 (Service Status Hub) remains.**

### T023 — Service Status Hub
Priority: LOW · Phase: MVP · Depends On: T006 · Status: **COMPLETE**
Description: Public banner reading `service_status` where `is_visible_to_public = 1`; admin CRUD
for superadmins.
Acceptance Criteria:
- [x] Banner only shows entries marked public-visible AND non-`operational` (an "everything's
      fine" row has nothing worth alerting about — README frames this as an outage/degradation
      banner, not a general status page)
- [x] Superadmin can create/update/hide entries — "hide" is the same form's
      `is_visible_to_public` checkbox, not a separate action (matches the README's own
      "create/update/hide" wording rather than inventing a fourth CRUD verb)
Output: `applySaveServiceStatus()` + admin listing/form in `controllers/admin_controller.php`;
public banner rendering added to `renderHomeContent()` in `controllers/public_controller.php`;
`.badge-operational`/`.badge-degraded`/`.badge-down` added to `assets/app.css` (shadcn `--chart-2`
/`--chart-3`/`--destructive` tokens, not reused ticket-status badge classes — different domain
concept, kept visually distinct on purpose).
**Live-verified**: created a public "down" entry → banner shows system name, badge, and message;
created a public "operational" entry → correctly absent from the banner; unchecked visibility on
the "down" entry → banner goes empty; admin listing correctly labeled it "Hidden".
**This closes Phase 4 (Spam & Resilience) — T021 through T023 all COMPLETE.**

### T024 — Super admin dashboard
Priority: HIGH · Phase: MVP · Depends On: T019 · Status: **COMPLETE**
Description: Cross-department ticket overview and navigation hub for all super-admin-only tools.
Acceptance Criteria:
- [x] Shows tickets/stats across all departments — cached global status tallies
      (`cacheRemember('admin_global_stats', ...)`, same pattern as T019), gated by `requireSuperadmin()`
- [x] Links out to T025–T029, T032, T033 — tabbed nav (`ADMIN_SECTIONS`) for Dashboard/
      Departments/Users/Service Status/Settings; View As widget lives directly on the dashboard
Output: `controllers/admin_controller.php` restructured into a section router (`?section=`) with a
shared `renderAdminShell()` wrapper — T023's Service Status Hub moved under it unchanged.
**Live-verified**: dashboard stat tiles matched a direct `GROUP BY status` query exactly
(9/9/10/7); all 5 nav tabs render; Service Status section still fully functional after the move.

### T025 — "View As" mode
Priority: MEDIUM · Phase: MVP · Depends On: T024, T008 · Status: **COMPLETE**
Description: Superadmin selects an agent and views that agent's dashboard exactly as they'd see
it, without needing the agent's password.
Acceptance Criteria:
- [x] View-As session is clearly distinguishable — red banner on every page ("Viewing as X
      (read-only). Exit View As") rendered centrally in `renderPage()`, not per-controller
- [x] View-As grants read access matching the target agent's department scope, not broader —
      `requireDepartmentAccess()` checks `getViewAsContext()` FIRST; even a superadmin is denied
      any department other than the one being viewed as while active (verified: `/hr/` → 403
      while viewing as the IT agent, restored to 200 immediately after exiting)
- [x] Every View-As session start is logged (who viewed as whom, when) — `logSystemEvent()` to
      `logs/audit-system.log` (`Require all denied`, same access model as `uploads/`). Not
      `audit_logs` — that table's `ticket_id` is `NOT NULL` and this event isn't tied to any
      ticket; see `decisions/decision_log.md` [ARCH]. Also enforced: read-only — any mutating POST
      on a ticket while View-As is active is rejected with 403, checked once centrally rather than
      per-intent.
Output: `getViewAsContext()`/`startViewAs()`/`exitViewAs()`/`logSystemEvent()` in `auth.php`;
banner in `views/layout.php`; read-only POST block in `controllers/department_controller.php`;
entry widget on the admin dashboard; `?exit_view_as=1` handled centrally in `index.php`.
**Live-verified, full lifecycle** (after ruling out a false alarm — see Session Notes on Git
Bash/MSYS argument mangling): login → start View As IT Agent → redirect to `/it/` → banner shows
→ `/hr/` correctly 403 while active → exit → banner gone → `/hr/` back to 200 with real superadmin
content. Log entry confirmed with correct superadmin/agent/department IDs; direct HTTP access to
the log file confirmed blocked (403).

### T026 — Feature-flag command center
Priority: MEDIUM · Phase: MVP · Depends On: T024 · Status: **COMPLETE**
Description: Admin UI to toggle rows in `settings` (e.g. `MAINTENANCE_MODE`, upload allow-list)
without editing `config.php` directly.
Acceptance Criteria:
- [x] Toggling a flag takes effect on the next request without a code deploy — `isSettingEnabled()`/
      `getSettingValue()` in `settings_helper.php` query the `settings` table live, no caching
      (a stale cached flag would defeat the whole point)
- [x] Restricted to superadmin — lives under `/admin/`, same `requireSuperadmin()` gate as every
      other admin section
Output: `applySaveSetting()` + Settings tab in `controllers/admin_controller.php`; `maintenance_mode`
wired into `handlePublicHome()` as a real, demonstrable example — deliberately scoped to the public
portal only, not `/admin/`/department routes, so a superadmin flipping it on can't lock themselves
out of the one place that can turn it back off.
**Live-verified**: enabling `maintenance_mode` (with a custom message) immediately blocked the
public home page and showed the exact custom message, with zero code changes or restart; `/admin/`
stayed fully accessible throughout; disabling it restored the normal page on the very next
request. (One false start during testing: sending `is_enabled=` with an empty value isn't how a
real unchecked HTML checkbox behaves — browsers omit the field entirely — so the first "disable"
test looked like a bug until re-tested correctly; not an app defect.)

### T027 — Destructive-action confirmation modals
Priority: MEDIUM · Phase: MVP · Depends On: T024 · Status: **COMPLETE**
Description: Confirmation step required before any irreversible action (e.g. archiving tickets).
Acceptance Criteria:
- [x] Destructive actions are unreachable via a single click/request without confirmation —
      `renderConfirmation()` interstitial renders instead of executing on the first POST
- [x] Confirmation step is enforced server-side (`isConfirmed()` checks `$_POST['confirm'] === 'yes'`),
      not a JS `confirm()` a script could just skip
Output: `renderConfirmation()`/`isConfirmed()` in `views/layout.php` — reusable, not tied to any
one feature. First real consumer: T028's department deletion (below).

### T028 — Department CRUD
Priority: MEDIUM · Phase: MVP · Depends On: T024 · Status: **COMPLETE**
Description: Superadmin create/rename/remove departments (`departments` table), including slug
management used by routing (T006).
Acceptance Criteria:
- [x] Slug uniqueness enforced (excluding the row being edited, so saving a department without
      changing its own slug doesn't falsely trip the check); `admin` is additionally reserved
      since it would collide with the `/admin/` route in `index.php`
- [x] Removing a department doesn't orphan tickets silently — T027's confirmation screen states
      the exact affected ticket count before deleting ("N existing ticket(s)... will become
      unassigned, not deleted"), and the FK (`ON DELETE SET NULL`) does exactly that, verified live
Output: `applySaveDepartment()`, `handleDeleteDepartment()`, Departments tab in
`controllers/admin_controller.php`.
**Live-verified**: created "Finance"/`finance`; duplicate slug rejected; reserved `admin` slug
rejected; renamed in place without tripping its own uniqueness check; delete without `confirm=yes`
→ confirmation screen showing "1 existing ticket(s)", department NOT deleted; delete with
`confirm=yes` → department gone, the one ticket that belonged to it confirmed `department_id NULL`
(unassigned), not deleted. (Two test-methodology false alarms along the way — POSTing to `/admin/`
instead of the form's real `?section=departments` target, and an unescaped `"` in a grep pattern
against HTML-entity-encoded output — both ruled out as test artifacts, not app bugs.)

### T029 — User/agent CRUD
Priority: MEDIUM · Phase: MVP · Depends On: T024, T007 · Status: **COMPLETE**
Description: Superadmin create/edit/deactivate users, set role/department, toggle
`can_accept_tickets`; presence fields (`is_online`, `last_seen_at`) surfaced read-only.
Acceptance Criteria:
- [x] New agent accounts get a hashed password (`password_hash()`, verified live with
      `password_verify()`), correct role/department (agents require a valid department;
      superadmins are forced to `department_id = NULL`)
- [x] `can_accept_tickets = false` prevents self-assignment in T015's flow — verified by actually
      toggling it off and confirming the agent disappears from the reassignment dropdown on a
      real ticket, not just reading the query
Output: `applySaveUser()`, `handleDeactivateUser()`, Users tab in `controllers/admin_controller.php`.
"Deactivate" uses T027's confirmation pattern; "View As" buttons reuse T025's existing
`intent=start_view_as` handling verbatim — no duplicate logic for a second entry point.
**Live-verified**: created an agent, confirmed the stored hash actually verifies against the
plaintext password; duplicate email and missing-password-on-create both rejected; editing without
a password left the hash byte-for-byte unchanged; deactivation confirmation → real deactivation →
login attempt correctly fails with the same generic message as any bad credentials → user list
shows a "deactivated" badge and no longer offers a "View As" button for that row.
**This closes Phase 5 (Super Admin) — T024 through T029 all COMPLETE.**

### T030 — Central audit log helper
Priority: HIGH · Phase: MVP · Depends On: T013, T015, T016 · Status: PENDING
Description: One shared function writing to `audit_logs` (ticket_id, actor_id, action_type,
old_value, new_value), called from every mutating action built so far.
Acceptance Criteria:
- [ ] T013 (status), T015 (reassign), T016 (notes) each call this helper — no direct inserts elsewhere
- [ ] `actor_id` is NULL only for genuinely automated changes (e.g. SLA auto-flagging)
Output: Shared audit helper + call sites wired in.

### T031 — Audit trail viewer
Priority: MEDIUM · Phase: MVP · Depends On: T030 · Status: PENDING
Description: Chronological audit_logs display on the ticket detail view (T012).
Acceptance Criteria:
- [ ] Shows actor, action type, old→new value, timestamp, newest first
- [ ] Respects department isolation (same guard as T012)
Output: Audit trail section on ticket detail.

### T032 — CSV export
Priority: MEDIUM · Phase: MVP · Depends On: T024 · Status: PENDING
Description: Superadmin-only CSV export of tickets (filterable), matching the legacy prototype's
`export_csv.php` capability but against the new MySQL schema.
Acceptance Criteria:
- [ ] Export respects any applied filters (department/status/date range)
- [ ] Restricted to superadmin
Output: CSV export handler.

### T033 — Print/PDF report export
Priority: MEDIUM · Phase: MVP · Depends On: T014 · Status: PENDING
Description: Print-friendly report view (browser "Print to PDF") injecting the mandatory
resolution summary, matching legacy `report.php`'s approach.
Acceptance Criteria:
- [ ] Resolution summary appears in the exported report when present
- [ ] Layout is print-friendly (no nav chrome in the printed output)
Output: Report/print view.

### T034 — Knowledge base CRUD
Priority: LOW · Phase: MVP · Depends On: T028 · Status: PENDING
Description: Per-department knowledge base articles (`knowledge_base` table).
Acceptance Criteria:
- [ ] Articles scoped/filterable by department
- [ ] Agents can view; only superadmin (or department agents, per final call at execution time) can author — confirm exact write-permission at execution time if ambiguous, don't assume
Output: Knowledge base list/detail + admin CRUD.

### T035 — CSRF protection sweep
Priority: HIGH · Phase: MVP · Depends On: all forms/actions above exist · Status: PENDING
Description: Add CSRF tokens to every state-changing form/POST action across the app.
Acceptance Criteria:
- [ ] Every POST handler validates a per-session CSRF token before acting
- [ ] Token mismatch is rejected, not silently ignored
Output: CSRF helper + token checks applied app-wide.

### T036 — Input validation/sanitization sweep
Priority: HIGH · Phase: MVP · Depends On: all forms/actions above exist · Status: PENDING
Description: Audit every entry point (public forms, agent actions, admin actions) for missing
server-side validation, output escaping (XSS), and confirm PDO prepared statements are used
everywhere (no exceptions).
Acceptance Criteria:
- [ ] No raw SQL string interpolation found anywhere in the codebase
- [ ] All user-supplied output is escaped on render (`htmlspecialchars` or equivalent)
- [ ] Every form validates required/typed fields server-side
Output: Sweep findings fixed in place; log any fix in `fixes/fix_log.md` if a real bug was found.

### T037 — Session hardening
Priority: HIGH · Phase: MVP · Depends On: T007 · Status: PENDING
Description: Regenerate session ID on login (already required by T007 — verify), set secure/
httponly cookie flags, add an idle timeout.
Acceptance Criteria:
- [ ] Session cookie is `HttpOnly`; `Secure` flag set when served over HTTPS
- [ ] Idle session expires after a defined timeout and forces re-login
Output: Session config hardening in `config.php`/session bootstrap.

### T038 — Finalize `config.php` deploy instructions
Priority: MEDIUM · Phase: MVP · Depends On: T002 · Status: PENDING
Description: Ensure `config.php`/`config.example.php` and README Step 1 instructions are fully
consistent and accurate for a real cPanel deploy.
Acceptance Criteria:
- [ ] Following README Step 1 exactly results in a working config with no undocumented steps
Output: Finalized config + doc alignment.

### T039 — cPanel verification pass
Priority: HIGH · Phase: MVP · Depends On: T005, T035, T036, T037 · Status: PENDING
Description: Full run-through of the README Quick-Start deployment steps against a real (or
staging-equivalent) cPanel/MySQL environment, using `/private/migration-command.php` to confirm.
Acceptance Criteria:
- [ ] All health checks in `deployment/deployment.md` pass
Output: Verified deployable build.

### T040 — Connect to ELTS repo, wipe remote, push
Priority: HIGH · Phase: MVP · Depends On: T039 (all above COMPLETE) · Status: **DONE EARLY, OUT OF SEQUENCE**
Description: Initialize/point this project at `github.com/iantolentino/ELTS.git`, clear its
existing contents, and push the finished MTS build.
Acceptance Criteria:
- [x] User gave a fresh, explicit confirmation for this specific action — asked twice: once
      generally, then again after being shown that ELTS already contained a separate, substantial
      Laravel application (composer.lock, app/Models, database/migrations, tests/, its own
      _brain/), which this push overwrites. Confirmed "overwrite ELTS with MTS anyway" with
      that context in hand.
- [ ] **T039 verification was NOT done first** — executed early, out of the planned dependency
      order, at the user's explicit request ("commit all files... so I can continue on other
      device"). T005/T035/T036/T037 (migration check, CSRF, input-validation, session-hardening
      sweeps) are still PENDING. **What's on GitHub right now is a mid-build snapshot through
      Phase 5, not a verified deployable release.** Do not treat the push having happened as
      evidence T039 passed.
Output: git repo initialized locally (`git init`, branch `main`), committed (104 files), force-
pushed to `origin main` on `github.com/iantolentino/ELTS.git`, overwriting its previous HEAD.
**Previous Laravel HEAD SHA (for possible recovery): `6a3caaa0eb6bac2f7b7cc5b0e11f6c329ea77642`** —
no longer on any branch; not immediately garbage-collected but not guaranteed to survive
indefinitely either. Record this SHA anywhere durable if the Laravel app might ever be needed back.
See `decisions/decision_log.md` [DEPLOY] for the full record.

### R001 — Decide DB backup cadence/policy
Priority: LOW · Depends On: none · Status: PENDING
Question: What backup cadence/retention/restore procedure should `db_backup/backup_policy.md`
document? The MTS spec is silent on this.
Options:
- Option A: Rely on host's automated cPanel backups (if available on the target hosting plan)
- Option B: Scheduled `mysqldump` export via cron + off-site storage
Output: Log the accepted decision in `decisions/decision_log.md` and write
`db_backup/backup_policy.md` accordingly.
