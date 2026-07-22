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

## Phase 10 — Trackr Design & Feature Port (user request, 2026-07-20)

Source: `github.com/iantolentino/ticketing-system.git` ("Trackr" — Next.js/Prisma/PostgreSQL,
cloned read-only to `_brain/staging/` for reference, not part of this repo's runtime). Different
stack — this is a re-implementation in PHP/MySQL matching ELTS's existing architecture
(`decisions/decision_log.md` [STACK]), not a code merge. User confirmed full scope: design port
+ all missing functionality, not just the pieces called out first (sidebar nav, department-picker
landing page).

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T041 | Left sidebar navigation (agent + admin), replacing top nav bar       | HIGH     | none       | PENDING |
| T042 | Public portal redesign — department-picker card grid + search        | HIGH     | none       | PENDING |
| T043 | Dark/light theme toggle                                              | MEDIUM   | T041       | PENDING |
| T044 | Per-department FAQ items                                             | MEDIUM   | T028       | PENDING |
| T045 | Configurable Request Types per department with dynamic custom fields | HIGH     | T028       | PENDING |
| T046 | Threaded ticket comments visible to requester + agent                | MEDIUM   | none       | PENDING |
| T047 | Requester self-service accounts / "My Requests" login                | HIGH     | none       | PENDING |
| T048 | Free-form ticket tags                                                | LOW      | none       | PENDING |

### T041 — Left sidebar navigation
Priority: HIGH · Phase: Trackr Port · Depends On: none · Status: COMPLETE
Description: Replace the current top-bar nav (admin shell's button row, department dashboard's
plain header) with a fixed left sidebar matching Trackr's `Sidebar.tsx`: logo mark, icon+label nav
items with active state, ticket-count badge, bottom section with a link back to the public portal,
and a user row (initials avatar + name/email + dropdown for logout). Applies to both the
department-agent shell and the admin shell — same visual language, different nav item sets (each
already has its own route/section list).
Acceptance Criteria:
- [x] All existing routes/sections still reachable, nothing removed — this is a layout change, not
      a feature change
- [x] Active nav item visually distinguished
- [x] Sidebar present on every authenticated page (department + admin), not just the dashboard
- [x] No horizontal overflow/overlap at common desktop widths
Output: New shared sidebar-shell renderer + updated `.container`/layout CSS.
Notes: New `renderSidebarShell()` in `views/layout.php`, shared by both `renderAdminShell()`
(admin_controller.php) and new `renderDepartmentShell()` (department_controller.php) — same shell,
different nav item arrays. Also fixed the user's original bug report along the way: T041's earlier
full-width `.container` change (`width:100%`, no cap) wasn't literal DOM overlap, it was every
input/table stretching edge-to-edge on a wide screen (confirmed via a screenshot the user shared)
— `.container` now uses `max-width:1200px` instead, so the sidebar/page structure still spans the
full desktop but content stays readable. Also fixed a stray extra `}` in `assets/app.css`'s
pre-existing `.dark` block (unrelated latent bug, harmless but fixed while in the file) and added
a `--sidebar-bg` dark-mode token for T043. Hit and fixed a real bug during this task: nav icons
were passed as HTML numeric entities (e.g. `&#11040;`) then run through `htmlspecialchars()` in
`renderSidebarShell()`, double-escaping them into literal visible text that visually collided with
the label text — switched to real UTF-8 glyphs (⬡ ◆ ◎ ▦ ▤ ⊙) instead, which `htmlspecialchars()`
passes through untouched. Verified visually: cloned a local Playwright + Chrome script (dev-browser
CLI's daemon wouldn't start in this environment; global `playwright` package was already installed,
just needed `NODE_PATH` pointing at the global `node_modules`) and screenshotted every admin
section, the department dashboard (with the new Team Leader/Client columns visible), a ticket
detail page, and the department KB page — no overlap, no console/page errors on any of them.

### T042 — Public portal redesign
Priority: HIGH · Phase: Trackr Port · Depends On: none · Status: COMPLETE
Description: Replace the home page's plain `<select>` department field with a searchable card grid
(one card per department: color accent, name, description) matching Trackr's `PortalClient.tsx` —
selecting a department leads into the existing submit-ticket flow (T009) pre-selected to that
department, not a new form.
Acceptance Criteria:
- [x] Card grid lists all departments, client-side search filters by name/description
- [x] Selecting a department pre-fills/locks the department on the existing submission form
- [x] Existing status-lookup flow (T010) still reachable from the same page
Output: Redesigned public home page.
Notes: `handlePublicHome()` now derives `$selectedDept` from `?dept=` (portal card click) OR from
`$old['department_id']` on a failed submit retry (so a validation error never bounces the
requestor back to the picker mid-fill). `renderHomeContent()` dispatches to
`renderDepartmentPicker()` (card grid + live client-side search, no page reload — matches
Trackr's instant-filter feel) or `renderTicketSubmissionForm()` (department locked via hidden
input + "Change department" link, not a re-selectable `<select>`) accordingly;
`renderStatusLookupCard()` extracted and always shown on both. Card accent colors come from a
fixed palette indexed by department id, not a new `departments.color` schema column — purely
cosmetic, didn't justify another `database.sql` change on top of this session's other one.
Verified live: picker renders all 3 seeded departments, search filters correctly (tested "fin" →
only Finance), clicking a card locks the form to that department, a validation error keeps the
lock (didn't fall back to the picker), and a full submission through the locked form correctly
stored `department_id`/`team_leader_name`/`client_name` — no console/page errors.

### T043 — Dark/light theme toggle
Priority: MEDIUM · Phase: Trackr Port · Depends On: T041 (sidebar hosts the toggle) · Status: COMPLETE
Description: `assets/app.css` already has `.dark` tokens defined but intentionally unused (light
mode forced regardless of OS preference, per existing comment in the CSS). Add a real toggle.
Acceptance Criteria:
- [x] Toggle switches the `.dark` class app-wide and persists across requests (cookie or session)
- [x] Default remains light mode for a first-time visitor (no behavior change without an explicit
      toggle click) — this is additive, not a reversal of the earlier "no auto dark mode" decision
Output: Theme toggle wired into the sidebar + persistence mechanism.
Notes: `?toggle_theme=1` handled once in `index.php` before routing (same pattern as T025's
`exit_view_as`) — flips a `mts_theme` cookie (1yr, `HttpOnly`, `SameSite=Lax`, `Secure` when
HTTPS, same conditional pattern as T037) and redirects back to the exact current path+query with
only `toggle_theme` stripped, rather than trusting the `Referer` header. `renderPage()` in
`views/layout.php` reads the cookie and adds `class="dark"` to `<html>` — default (no cookie) is
still always light, satisfying the earlier "never auto dark mode" comment already in `app.css`.
Toggle control lives in `renderSidebarShell()`'s bottom section (sun/moon icon + "Light
mode"/"Dark mode" label reflecting current state), so it's on every authenticated page
automatically — not added to the public portal, matching Trackr's own placement (sidebar-only).
Verified live: clicking the toggle switches instantly, a full page reload keeps `dark` on
`<html>`'s class list (cookie persistence confirmed via `document.documentElement.className`),
toggling back removes it — no console/page errors.

### T044 — Per-department FAQ items
Priority: MEDIUM · Phase: Trackr Port · Depends On: T028 (departments exist) · Status: COMPLETE
Description: New `faq_items` table (question, answer, order, department_id), admin CRUD (superadmin
+ department agents, same permission split as T034's Knowledge Base — confirm at execution time if
this repo wants the same split or something different), public-facing display on the portal/
department page from T042.
Acceptance Criteria:
- [x] FAQ items scoped by department, orderable
- [x] Publicly visible (no login) on that department's portal entry
- [x] Admin/agent CRUD, same isolation model as T034
Output: `faq_items` table + CRUD + public display.
Notes: New `faq_items` table (`question`, `answer`, `sort_order`, `department_id NOT NULL`,
`ON DELETE CASCADE`) added to `database.sql` and the live DB — reused the same split as T034
without re-asking (task note said "confirm if ambiguous"; T034's precedent — agents own-department,
superadmin any-department — was the obvious default here, no new ambiguity to resolve). Agent side:
`/{dept}/faq` route + `handleDepartmentFaq()`/`applySaveFaqItem()`/`handleDeleteFaqItem()` in
`department_controller.php`, new sidebar nav item. Admin side: `faq` section in
`admin_controller.php`, same shape as `kb`. Public side: `public_controller.php`'s
`handlePublicHome()` fetches `faq_items` for the selected department only (empty array for the
picker view, no wasted query) and `renderFaqAccordion()` renders them as native `<details>`
elements (no JS needed for expand/collapse) above the locked submission form — renders nothing at
all when a department has zero FAQ items, not an empty card. Verified live end-to-end: IT agent
creates an item, it immediately appears on the public portal for `?dept=1`; HR agent's
cross-department delete attempt on it is a no-op (item still exists after); superadmin sees it in
the admin FAQ section.

### T045 — Configurable Request Types per department
Priority: HIGH · Phase: Trackr Port · Depends On: T028 · Status: COMPLETE
Description: New `request_types` + `request_type_fields` tables (per-department named request
types, e.g. "Password Reset", each with an ordered set of custom fields: text/textarea/select/
number/date/boolean, required flag). Public submission form (T009) selects a request type after
department, then renders that type's custom fields; submitted values stored against the ticket.
Acceptance Criteria:
- [x] Admin/agent CRUD for request types + their fields, scoped by department
- [x] Public submission form dynamically renders the selected type's fields, enforcing `required`
- [x] Submitted custom field values are retrievable on the ticket detail view
Output: New schema + admin CRUD + dynamic public form + ticket detail display.
Notes: New `request_types` (department_id, name, icon, sort_order) and `request_type_fields`
(request_type_id, label, field_key, field_type enum, is_required, field_options newline-list,
sort_order, `UNIQUE(request_type_id, field_key)`) tables, created before `tickets` in
`database.sql` since `tickets` gained `request_type_id` (FK, `ON DELETE SET NULL`) and
`custom_fields JSON` columns. `request_types.icon` DEFAULT is ASCII (`'#'`), not the emoji Trackr
uses — this Windows box's shell/mysql-CLI pipeline silently mangled multi-byte SQL `DEFAULT`
literals to `?` even with `--default-character-set=utf8mb4` set (verified via `HEX()` — genuinely
wrong bytes, not just a terminal display issue). The app supplies the emoji default in PHP instead
(`'🎫'` in `applySaveRequestType()`/`applySaveRequestTypeAdmin()`), which works correctly because
PHP source is UTF-8 and `db.php`'s PDO connection already uses `DB_CHARSET=utf8mb4` — confirmed via
the same `HEX()` check on an app-inserted row. CRUD: department-agent side at
`/{dept}/request-types` (`handleDepartmentRequestTypes()` + nested per-type field management, same
department-agent authorship model as KB/FAQ); admin side at `admin/?section=types` (unscoped,
department picker on the type form). Every field mutation re-verifies the field belongs to a type
in-scope via a JOIN back to `request_types`, not just the field id alone. Public flow: selecting a
department with request types configured shows a type picker (`renderRequestTypePicker()`, same
card-grid pattern as T042) before the form; a department with zero types skips straight to the
plain form (backward compatible, matches T009's original behavior exactly). Dynamic fields render
per `field_type` (text/textarea/number/date/select/boolean) named `cf_{field_key}` to avoid any
collision with the static field names; `handleTicketSubmission()` validates required/number/select
constraints server-side and stores values as a `custom_fields` JSON blob. Ticket detail view
resolves `custom_fields` keys back to their field labels via `request_type_fields` for display.
Verified live end-to-end: created a request type with a required text field and a select field via
the IT agent UI, confirmed the public form is gated behind the type picker, missing the required
field is rejected with the right message, a full submission stores correct JSON
(`{"asset_tag":"LAP-4471","priority_level":"High"}`), and the ticket detail page correctly
resolves and displays both under a new "Request Details" section.

### T046 — Threaded ticket comments (requester + agent)
Priority: MEDIUM · Phase: Trackr Port · Depends On: none · Status: COMPLETE
Description: A comment thread visible to both the requester and assigned agent(s) — distinct from
T016's internal notes (agent-only). Requester has no account/session (until T047), so posting as
requester must be reachable from the existing email+ticket-id status-lookup flow (T010).
Acceptance Criteria:
- [x] Comments show author (agent name, or "Requester") and timestamp, chronological
- [x] Requester can post via the status-lookup page (re-verified by email+ticket-id, same guard as
      T010's lookup itself — no new way to probe other people's tickets)
- [x] Agent can post from the ticket detail view
Output: New comments table + display/post on both the status-lookup and ticket-detail views.
Notes: New `ticket_comments` table (`author_type` enum agent/requester, `agent_id` nullable FK,
`author_name` captured at post time rather than joined — the requester has no account row to join
to). Shared logic in new `comments.php` (`applyAddComment()`, `renderCommentList()`), required
once in `index.php`, since both `department_controller.php` and `public_controller.php` need it —
neither controller owns this concern alone. Agent side: new "Comments" section on the ticket
detail view (`intent=add_comment`), explicitly labeled "Visible to the requester too — not
internal" right next to the pre-existing Internal Notes section so agents don't confuse the two.
Requester side: `public_controller.php`'s status-lookup result (T010) now shows the thread plus a
reply form; posting (`intent=add_requester_comment`) re-runs the exact same
`handleStatusLookup()` ticket_id+email guard before accepting the comment — a mismatched email is
rejected with the same "No matching ticket found" message as a failed lookup, not a distinct error
that would leak whether the ticket_id exists. No redirect after posting (unlike ticket submission)
— carrying the requestor's email forward via a redirect URL would put it in the query string,
browser history, and referrer headers. Verified live end-to-end: agent posts a comment, requester
looks up the ticket and sees it, requester replies, agent sees the reply on the ticket detail page,
and a reply attempt with the wrong email is rejected with zero rows written.

### T047 — Requester self-service accounts ("My Requests")
Priority: HIGH · Phase: Trackr Port · Depends On: none · Status: COMPLETE
Description: Optional real accounts for requesters (register/login), listing all their submitted
tickets in one place — an alternative to the existing per-ticket email+ID lookup (T010), not a
replacement for it (anonymous submission must keep working).
Acceptance Criteria:
- [x] Requester can register (email+password) and log in
- [x] "My Requests" lists every ticket tied to that account's email
- [x] Anonymous submission (T009) and anonymous status lookup (T010) remain fully functional,
      unauthenticated — confirm at execution time whether new tickets from a logged-in requester
      auto-link to their account or still require the manual T010 lookup for older ones
Output: Requester auth (register/login/logout) + "My Requests" list view.
Notes: Resolved the "confirm at execution time" question without needing to ask — new
`requester_accounts` table (email+password only, no FK to tickets) is deliberately keyed by email
alone; "My Requests" is just `WHERE requestor_email = :account_email`, so every ticket ever
submitted under that email — before or after registering — shows up automatically with zero
linking step, and T009/T010's anonymous paths are completely untouched either way. New
`requester_auth.php` (session helpers, namespaced `$_SESSION['requester_*']` — fully separate from
the agent/admin session in `auth.php`, so nothing here can collide with or grant department/admin
access) and `controllers/requester_controller.php` (routes: `/account/login`, `/account/register`,
`/account/logout`, `/account/my-requests`, `/account/ticket/{id}`). `/account/ticket/{id}`
guards by `requestor_email = account email` — same isolation shape as T010's lookup and T046's
comment guard, reuses `comments.php`'s `applyAddComment()`/`renderCommentList()` directly rather
than duplicating the reply UI a third time. Added `account` to the reserved-department-slug check
in `applySaveDepartment()` (alongside the existing `admin`) so a future department can never
collide with this route. Small "Sign in / register" or "My Requests (email)" link added to the top
of the public portal page — the app has no persistent public header to put a full nav in.
Verified live end-to-end: registered an account, submitted a ticket under that email, confirmed it
appeared in My Requests with no extra step; opened the ticket, replied as the requester (via
`comments.php`, same as T046); confirmed a second registered account gets 404 trying to view the
first account's ticket by guessing its id.

### T048 — Free-form ticket tags
Priority: LOW · Phase: Trackr Port · Depends On: none · Status: COMPLETE
Description: Add a `tags` capability to tickets (e.g. a `ticket_tags` join table — MySQL has no
native array column like Trackr's Postgres `String[]`), agent-editable, filterable on the
department dashboard.
Acceptance Criteria:
- [x] Agent can add/remove free-form tags on a ticket
- [x] Tags shown on ticket detail and (if screen space allows) the dashboard list
- [x] Dashboard filterable by tag (nice-to-have, confirm priority at execution time — this is LOW,
      don't gold-plate it)
Output: New `ticket_tags` table + tag UI on ticket detail/dashboard.
Notes: Deliberately scoped down per the acceptance criteria's own "don't gold-plate it" — new
`ticket_tags` table (`UNIQUE(ticket_id, tag)`, `ON DELETE CASCADE`), add/remove UI on the ticket
detail page only (`intent=add_tag`/`remove_tag` in `handleDepartmentTicket()`), rendered as small
removable badges under the status/priority row. Duplicate tags are a silent no-op (`INSERT IGNORE`
against the unique key), not an error. Did NOT add a dashboard tags column or dashboard tag filter
— the task explicitly marked both nice-to-have and warned against gold-plating a LOW-priority
item, and the dashboard table is already at 8 columns (id/subject/status/priority/requestor/team
leader/client/created) after T042's earlier additions. Verified live: added a tag, confirmed a
duplicate add is silently ignored (still one row), removed it, confirmed the row is gone.

**This closes Phase 10 (Trackr Design & Feature Port) — T041 through T048 all COMPLETE.**

## Phase 11 — Gap Closure & Extensions (user request, 2026-07-21)

Source: user's own MTS spec notes (routing matrix + feature list) compared against the live app,
plus follow-on feature requests made in the same conversation. Confirmed with the user: claiming
sets a new `in_progress` status (not just assignment); presence is passive (updated on every
authenticated request, no JS heartbeat); auto-assignment set to least-loaded agent; multi-department
tickets are FULL shared ownership (both departments' agents can fully manage it, and each side can
see the ticket was submitted to more than one department).

| ID   | Task                                                              | Priority | Depends On | Status  |
|------|--------------------------------------------------------------------|----------|------------|---------|
| T049 | Atomic ticket claim + new `in_progress` status                      | HIGH     | none       | COMPLETE |
| T050 | Agent presence (passive, updated on every authenticated request)     | MEDIUM   | none       | COMPLETE |
| T051 | Per-department auto-assignment (least-loaded agent)                  | MEDIUM   | T049       | COMPLETE |
| T052 | Public FAQ search on the landing page (before picking a department)  | LOW      | T044       | COMPLETE |
| T053 | Optional budget/cost field on public submission form                 | LOW      | none       | COMPLETE |
| T054 | Multi-department tickets (full shared ownership)                     | HIGH     | none       | COMPLETE |

### T049 — Atomic ticket claim + `in_progress` status
`VALID_TICKET_STATUSES`/`STATUS_TRANSITIONS`/`tickets.status` enum all gained `in_progress`
(claimed/actively worked, distinct from unclaimed `open`). New `applyClaimTicket()` in
`department_controller.php`: race-safe via `UPDATE tickets SET assigned_to=:agent, status=
'in_progress' WHERE id=:id AND assigned_to IS NULL` — the initial `SELECT` before it is only for
a friendlier early-exit message, the real collision detection is `rowCount() === 0` on the UPDATE
itself. "Claim" button on the dashboard list (unassigned rows only) and ticket detail page; a
collision shows "This ticket was already claimed by another agent." (dashboard: via a
`claim_error` query-param banner; detail page: inline). New `.badge-in-progress` CSS.

### T050 — Agent presence (passive)
`auth.php`'s `currentUser()` calls new `updateUserPresence()` on every authenticated request —
sets `is_online=1, last_seen_at=NOW()`. Deliberately MySQL's `NOW()`, not PHP's `date()`/`time()`
(see F002) — `last_seen_at` is later compared against `NOW()` again when computing "online", so
both sides of that comparison must share a clock. Nothing ever sets `is_online` back to 0, so the
admin Users list (`renderUsersSection()`) computes "online" live as `last_seen_at > NOW() -
INTERVAL 5 MINUTE` rather than trusting the stored flag as permanent.

### T051 — Auto-assignment
New `departments.auto_assign_enabled` column + admin Departments CRUD checkbox. New
`applyAutoAssignIfEnabled()`, called right after a new ticket insert in
`handleTicketSubmission()`. Least-loaded, not round-robin: picks the eligible agent
(`can_accept_tickets=1`) with the fewest currently open/in_progress/on-hold tickets — self-corrects
if one agent falls behind, rather than blindly rotating regardless of load. No eligible agent =
ticket stays open/unassigned, same as auto-assign being off. Sets status to `in_progress` (same
effect as a manual claim); `actor_id` is NULL in the audit row since it's automated.

### T052 — Public FAQ search
New `renderFaqSearchBox()` on the landing page (before picking a department), plain GET form
(`?faq_search=`), searches `faq_items.question`/`.answer` across every department at once —
distinct from T044's per-department FAQ accordion, which only appears after a department is
chosen. Chose FAQ (not the agent-internal Knowledge Base from T034) as the public-facing search
target since KB content is written by agents for agents and may not be appropriate for a public
audience — flagged this judgment call rather than silently assuming either way.

### T053 — Optional budget/cost field
`tickets.budget_amount DECIMAL(12,2) NULL`. Optional field on the public submission form
(`renderBudgetField()`), validated server-side as a non-negative number only when actually filled
in. Shown on the ticket detail table when present.

### T054 — Multi-department tickets (full shared ownership)
New `ticket_departments` table — holds only the *additional* departments beyond the primary
`tickets.department_id` (not a duplicate of it); "all departments for a ticket" is always
`department_id` UNION this table, the same `EXISTS`-based `$where` clause reused across the
dashboard list, stats cache, CSV export, and ticket-detail isolation check so it can't drift.
Public submission form gained an optional multi-select checkbox list
(`renderAdditionalDepartmentsField()`) for departments beyond the primary one already locked in
via the T042 picker. Both departments' agents get full read/write access (dashboard, status,
reassignment, comments, everything) — reassignment's eligible-agent dropdown stays scoped to
whichever department's view you're reassigning from, so an IT agent viewing a shared IT+HR ticket
still only sees IT agents in their dropdown (matches how department-scoped UI already worked
everywhere else, not a new concept). Both sides see an "also: <dept>" badge — on the dashboard row
and the ticket detail header — confirmed via the user's own follow-up ask ("I want them to see
that the user selected them both").

**Two real bugs found and fixed during T049/T054's implementation — see F004/F005 in
`fixes/fix_log.md`**: (1) reusing the same named SQL placeholder twice in one query string breaks
under this app's non-emulated PDO prepares (`SQLSTATE[HY093]`); (2) adding `LEFT JOIN users` to
queries that referenced `created_at`/`updated_at`/`department_id` unqualified made those columns
ambiguous, since `users` has its own copies of all three (`SQLSTATE[42S22]` / MySQL 1052). Both
classes are worth checking for by hand any time a query gains a new JOIN or a repeated
condition — grep for `OR EXISTS` / repeated `:name` and repeated bare column names is the fastest
way to catch these before they ship.

**This closes Phase 11 (Gap Closure & Extensions) — T049 through T054 all COMPLETE.**

## Phase 12 — Dashboard Analytics & Reporting (user request, 2026-07-21)

Cross-checked against `github.com/James-push/ticketing-system` (the Next.js/Prisma reference
already used for Phase 10 — same repo `iantolentino/ticketing-system` forked from; identical
`src/app/(dashboard)/dashboard/page.tsx`, `src/app/api/tickets/stats/route.ts`). Card set, chart
choices (7D/30D/3M/6M/1Y ticket-created line, status pie, priority bar, recent tickets), and SLA
bucket definitions (onTrack/breached/completed/breachedClosed) were read directly from that
reference and reproduced with hand-rolled CSS/SVG (`analytics.php`) instead of Recharts — matches
the existing no-framework-bloat precedent (`decisions/decision_log.md` [STACK]).

| ID   | Task                                                                  | Priority | Depends On | Status  |
|------|------------------------------------------------------------------------|----------|------------|---------|
| T055 | Shared `analytics.php` — stat-card math (Resolved/Critical/SLA×4)      | HIGH     | none       | COMPLETE |
| T056 | Tickets Created chart (7D/30D/3M/6M/custom date-range picker)          | HIGH     | T055       | COMPLETE |
| T057 | By Status pie chart                                                    | MEDIUM   | T055       | COMPLETE |
| T058 | By Priority bar chart                                                  | MEDIUM   | T055       | COMPLETE |
| T059 | Recent Tickets / latest-activity panel                                 | MEDIUM   | T055       | COMPLETE |
| T060 | Superadmin cross-department "All Tickets" dashboard + dept/priority filters | HIGH | T055  | COMPLETE |
| T061 | Department dashboard free-form filtering (priority, assignee, keyword search) | MEDIUM | none | COMPLETE |
| T062 | Admin Reports section gains the same 6 stat cards                      | MEDIUM   | T055       | COMPLETE |
| T063 | Per-department "Report" sidebar tab (scoped reuse of admin Reports)    | MEDIUM   | T055       | COMPLETE |
| T064 | `departments.description` — superadmin-editable, shown on portal picker | LOW     | none       | COMPLETE |
| T065 | Per-agent KPI table ("Team KPIs"), superadmin-only                     | LOW      | none       | COMPLETE |

### T055-T059 — `analytics.php`
One new shared module, required by `index.php` after the controllers. `computeTicketStats()` runs
a single `SUM(CASE...)`-style aggregate query (not 8 separate ones) for: open, in_progress,
resolved (`status='closed'`), critical (`priority='urgent'` AND still active), and the 4 SLA
buckets — on-track/breached mirror the existing live-computed `IS_OVERDUE_SQL` logic, while
completed/breached-closed compare a closed ticket's `updated_at` (this schema's only proxy for
"when it closed" — no dedicated `closed_at` column) against `sla_deadline`. Every function takes a
caller-supplied `$whereSql`/`$params` fragment scoped by the caller (one department, or `'1=1'`
for "all tickets") — `analytics.php` itself never decides who can see what. Charts are hand-rolled:
CSS `conic-gradient` donut for status, flex-box columns for priority, inline SVG `<polyline>` for
the tickets-created line — no charting library. Date-range state lives in `range`/`range_from`/
`range_to` query params, deliberately separate from `from`/`to` (used by the Reports date filter on
the same page in some views) and `status`/`page` (dashboard filters) so the controls never collide.

### T060 — Superadmin "All Tickets" dashboard
New `admin_controller.php` section (`?section=tickets`). Superadmin (outside View-As) already
passes `requireDepartmentAccess()` for every department, so ticket rows link straight into
`department_controller.php`'s own `/{dept}/ticket/{id}` detail page — no separate admin-side ticket
viewer needed. Filters: department, priority, status, additive.

### T061 — Department dashboard free-form filtering
Extends the existing status filter (T011) with priority, assigned-agent (including "Unassigned"),
and a keyword search across subject/description/requestor/client/team-leader (`LIKE`). All filters
are additive and preserved across pagination, CSV export, and the chart-range toggle. The 6
analytics stat cards and 3 charts intentionally read from `$baseWhere` (department scope only, no
filters) so they always describe "this department," not "this filtered view" — the table below is
the only thing narrowed by the filter form.

### T062-T063 — Reports
Admin Reports (`?section=reports`) gained the same `renderStatCardsHtml()` block, scoped to the
report's own date-range/department/status filters. The new per-department "Report" sidebar tab
(`/{dept}/report`) reuses `admin_controller.php`'s `getReportFilters()` /  `fetchReportTickets()` /
`exportTicketsReportCsv()` / `renderTicketsReportPrintView()` wholesale — `department_id` is forced
to the current department server-side regardless of query string, so the scope can't be widened by
a tampered URL.

### T064 — Department description
`departments.description TEXT NULL`, migrated live (`ALTER TABLE`) and in `database.sql`. Editable
via the existing Admin > Departments form; shown on the public portal's department-picker card,
falling back to the old generic "Submit a request to this department." line when unset.

### T065 — Team KPIs
New superadmin-only admin section (`?section=team`). One aggregate query across `users`/`tickets`
per agent: total assigned, active, closed, currently-breached, average resolution hours (closed
tickets only, `TIMESTAMPDIFF(HOUR, created_at, updated_at)`). Reachable only through
`handleAdminRoute()` (already gated on `requireSuperadmin()`), and there is no equivalent link
anywhere in `department_controller.php`'s agent-facing sidebar — hidden from agents by
construction, not just by convention, matching the user's explicit "hide this for now only show to
superadmin."

**F006 (see `fixes/fix_log.md`)** — the same ambiguous-column class as F004/F005 hit a third time:
`analytics.php`'s `fetchRecentTickets()` joins `users`, so its `department_id` had to be qualified
as `tickets.department_id`; the superadmin ticket filter's `$where` had the same issue since it got
reused inside that same joined query. Caught by a Playwright smoke pass before shipping.

**This closes Phase 12 — T055 through T065 all COMPLETE.**

## Phase 13 — Requester Identity Follow-ups (user request, 2026-07-21)

| ID   | Task                                                                  | Priority | Depends On | Status  |
|------|------------------------------------------------------------------------|----------|------------|---------|
| T066 | Requester display name derived from email local-part                  | LOW      | none       | COMPLETE |
| T067 | SSO deployment-only groundwork (config flag, allow-list, hook)        | MEDIUM   | none       | COMPLETE |

### T066
`deriveNameFromEmail()` (`requester_auth.php`) — strips a `+tag`, splits the local-part on
`.`/`-`/`_`, title-cases each word (`jane.doe+support@x.com` → `Jane Doe`), falls back to the raw
email if nothing alphabetic survives (e.g. a numeric-only address). Applied at the two places a
requester-submitted "name" is actually shown: the stored `ticket_comments.author_name` for
requester replies (`requester_controller.php`'s `handleRequesterTicket()` — previously the raw
email), and the "Logged in as" greeting on My Requests.

### T067
Per the DEFERRED COMPLEXITY RULE — no IdP/protocol is implemented (none was specified), only the
contract deployment will plug a real one into. `config.php`/`config.example.php` gained
`SSO_ENABLED` (false by default) and `SSO_EMAIL_SERVER_VAR`. New `sso.php`: `ssoAuthenticatedEmail()`
is the one placeholder function deployment must replace (currently reads a single `$_SERVER` var as
a stand-in for "however the chosen IdP proves who's logged in" — e.g. a reverse-proxy header from
mod_auth_openidc/mod_shib); `isEmailSsoAllowed()` against the new `sso_allowed_emails` table (empty
until deployment populates it) is real and already works. `requesterCurrentUser()`
(`requester_auth.php`) checks the SSO hook first, before the normal session — with `SSO_ENABLED`
false (today's default) `ssoAuthenticatedEmail()` always returns null, so this is a zero-behavior-
change no-op today, confirmed via the full Playwright smoke pass re-run after wiring it in. Once
enabled and populated, an allow-listed SSO-verified email becomes a valid "My Requests" identity
directly (`id` null, keyed by `email` — every existing call site already reads `->email`, not
`->id`) with no T047 register/login step, per the user's explicit ask ("they just need to have
their email").

**This closes Phase 13 — T066 and T067 COMPLETE.**

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
Priority: HIGH · Phase: MVP · Depends On: T013, T015, T016 · Status: COMPLETE
Description: One shared function writing to `audit_logs` (ticket_id, actor_id, action_type,
old_value, new_value), called from every mutating action built so far.
Acceptance Criteria:
- [x] T013 (status), T015 (reassign), T016 (notes) each call this helper — no direct inserts elsewhere
- [x] `actor_id` is NULL only for genuinely automated changes (e.g. SLA auto-flagging)
Output: Shared audit helper + call sites wired in.
Notes: New `audit.php` (`writeAuditLog(ticketId, actorId, actionType, oldValue, newValue)`),
required in `index.php` alongside `db.php`. Status transitions now also write a `STATUS_CHANGE`
audit_logs row (previously only the terminal `RESOLUTION_SUMMARY` was logged on close) — the
schema's own `action_type` comment in `database.sql` lists `STATUS_CHANGE` as expected, and T031
(audit trail viewer) needs an actor for status changes, which `status_history` doesn't carry.
Notes (T016) now also log `NOTE_ADDED`. Verified live against the local stack: logged in as
`itagent@example.com`, ran status change → reassign → note → close-with-summary on a scratch
ticket, confirmed all 5 expected `audit_logs` rows (`STATUS_CHANGE` x2, `REASSIGN`, `NOTE_ADDED`,
`RESOLUTION_SUMMARY`) with correct `actor_id`/old/new values, then deleted the scratch ticket
(cascades cleaned up audit_logs/status_history/internal_notes).

### T031 — Audit trail viewer
Priority: MEDIUM · Phase: MVP · Depends On: T030 · Status: COMPLETE
Description: Chronological audit_logs display on the ticket detail view (T012).
Acceptance Criteria:
- [x] Shows actor, action type, old→new value, timestamp, newest first
- [x] Respects department isolation (same guard as T012)
Output: Audit trail section on ticket detail.
Notes: `handleDepartmentTicket()` fetches `audit_logs LEFT JOIN users` (LEFT JOIN so a NULL
`actor_id` — automated changes — still renders, as "System", not silently dropped), scoped by
`ticket_id` on the same `$ticket` row already confirmed to belong to the agent's department, so
it inherits T012's isolation guard rather than re-checking it. Ordered `timestamp DESC, id DESC` —
the tiebreak matters because same-second writes (e.g. `STATUS_CHANGE` + `RESOLUTION_SUMMARY` on
close) would otherwise sort arbitrarily. New `renderAuditTrailSection()` in
`department_controller.php`, replacing the placeholder note left in T030. Verified live: closed
ticket shows both rows newest-first with correct actor; cross-department ticket view still 404s;
a ticket with no audit rows renders "No audit history yet." instead of an empty table; adding a
note + reassigning live-updates the trail correctly.

### T032 — CSV export
Priority: MEDIUM · Phase: MVP · Depends On: T024 · Status: COMPLETE
Description: Superadmin-only CSV export of tickets (filterable), matching the legacy prototype's
`export_csv.php` capability but against the new MySQL schema.
Acceptance Criteria:
- [x] Export respects any applied filters (department/status/date range)
- [x] Restricted to superadmin
Output: CSV export handler.
Notes: Built together with T033 as one "Reports" admin section (new `reports` entry in
`ADMIN_SECTIONS`) — CSV export, print view, and the in-app filter/preview all share one filter
parser (`getReportFilters()`) and one query (`fetchReportTickets()`) in `admin_controller.php`,
so the three can't drift out of sync. `?section=reports&format=csv` streams the CSV;
`department_id`/`status`/`from`/`to` filters read from `$_GET`, malformed/missing dates fall back
to "this month to today" (legacy `export_csv.php`'s default). Superadmin gate is inherited from
`handleAdminRoute()`'s existing `requireSuperadmin()` check, which runs before the section is even
read — verified live that an agent session gets 403 and an anonymous request gets the login form
(200 HTML, not a CSV) rather than the export. See T033 notes for the shared query/verification.

### T033 — Print/PDF report export
Priority: MEDIUM · Phase: MVP · Depends On: T014 · Status: COMPLETE
Description: Print-friendly report view (browser "Print to PDF") injecting the mandatory
resolution summary, matching legacy `report.php`'s approach.
Acceptance Criteria:
- [x] Resolution summary appears in the exported report when present
- [x] Layout is print-friendly (no nav chrome in the printed output)
Output: Report/print view.
Notes: `?section=reports&format=print` renders `renderTicketsReportPrintView()` via `renderPage()`
directly (NOT `renderAdminShell()`), so there's no admin nav in the output — verified live by
diffing the HTML for admin-shell markers (none present). `fetchReportTickets()`'s
`resolution_summary` column is a correlated subquery against `audit_logs` for the latest
`action_type = 'RESOLUTION_SUMMARY'` row per ticket (per the T014 decision that the summary lives
in `audit_logs`, not a `tickets` column — see `decisions/decision_log.md` [ARCH]); shows "—" when
absent. Verified live end-to-end: filtered a date range containing both closed test tickets (#4,
#8), confirmed both CSV and print output carried the correct resolution summary text pulled from
`audit_logs`, department/status filters narrowed results correctly (10 → 4 for dept, 10 → 2 for
status=closed), and the print page's on-screen "Print / Save as PDF" button is CSS-hidden
(`.no-print`) at print time.

### T034 — Knowledge base CRUD
Priority: LOW · Phase: MVP · Depends On: T028 · Status: COMPLETE
Description: Per-department knowledge base articles (`knowledge_base` table).
Acceptance Criteria:
- [x] Articles scoped/filterable by department
- [x] Agents can view; only superadmin (or department agents, per final call at execution time) can author — confirm exact write-permission at execution time if ambiguous, don't assume
Output: Knowledge base list/detail + admin CRUD.
Notes: Asked the user at execution time per the acceptance criteria's own instruction — answer:
department agents author for their own department, superadmin can author/move articles across any
department. Two parallel implementations sharing the same `knowledge_base` table:
`handleDepartmentKb()`/`applySaveKbArticle()`/`handleDeleteKbArticle()` in
`department_controller.php` (new `/{dept}/kb` route, linked from the dashboard header) lock every
read/write to the route's own `$dept['id']`, re-checked on every save/delete — an agent can never
touch another department's articles even by guessing an id. `applySaveKbArticleAdmin()`/
`handleDeleteKbArticleAdmin()`/`renderKbSection()` in `admin_controller.php` (new `kb` entry in
`ADMIN_SECTIONS`) give superadmin an unscoped view across all departments with a department
picker on the save form. Function names deliberately kept separate per side (not shared) since
the department-agent version has hard isolation baked into every query and the admin version
doesn't. Delete uses the existing T027 two-step confirmation pattern on both sides. Verified live:
IT agent creates/edits their own article; HR agent's cross-department delete attempt on it 404s
silently (article untouched); superadmin sees both departments' articles, edits and moves one
between departments, and deletes another via the confirm-then-delete flow; a non-superadmin agent
hitting `/admin/?section=kb` gets 403.

**This closes Phase 7 (Reporting) — T032 through T034 all COMPLETE.**

### T035 — CSRF protection sweep
Priority: HIGH · Phase: MVP · Depends On: all forms/actions above exist · Status: COMPLETE
Description: Add CSRF tokens to every state-changing form/POST action across the app.
Acceptance Criteria:
- [x] Every POST handler validates a per-session CSRF token before acting
- [x] Token mismatch is rejected, not silently ignored
Output: CSRF helper + token checks applied app-wide.
Notes: New `csrf.php` (`csrfToken()`, `csrfField()`, `verifyCsrfToken()`, `enforceCsrfOnPost()`).
Enforcement is centralized — `enforceCsrfOnPost()` runs once in `index.php` before any routing
dispatch, for every POST on every route, rather than being swept into each of the ~13 POST
handlers individually (can't be forgotten by a future handler). `csrfField()` (hidden input) added
to all 20 `<form method="post">` blocks across `auth.php`, `views/layout.php` (confirmation
modal), and all three controllers, including the login form itself (the session — and its token —
exists before authentication). `hash_equals()` used for constant-time comparison. Verified live:
POST with no token → 403; POST with wrong token → 403; POST with the real token scraped from the
just-rendered page → succeeds (tested on public ticket submission and an authenticated agent
action). A mismatch renders `send403()`, never silently passes through.

### T036 — Input validation/sanitization sweep
Priority: HIGH · Phase: MVP · Depends On: all forms/actions above exist · Status: COMPLETE
Description: Audit every entry point (public forms, agent actions, admin actions) for missing
server-side validation, output escaping (XSS), and confirm PDO prepared statements are used
everywhere (no exceptions).
Acceptance Criteria:
- [x] No raw SQL string interpolation found anywhere in the codebase
- [x] All user-supplied output is escaped on render (`htmlspecialchars` or equivalent)
- [x] Every form validates required/typed fields server-side
Output: Sweep findings fixed in place; log any fix in `fixes/fix_log.md` if a real bug was found.
Notes: SQL audit — every `dbQuery`/`dbFetch*` call uses named placeholders; the only inline
string-built SQL (dashboard's `$where`/`LIMIT`/`OFFSET`, the T032/033 report's `$where`, migration
check's table-name loop) is built from fixed literals/allowlists/verified-int casts, never raw
request input, each already commented as such. **Found and fixed a real bug: F003** — every admin
"Edit" button's `onclick` JS prefill was silently truncated by the HTML parser, because
`json_encode()`'s own unescaped double-quotes collided with the `onclick="..."` attribute's
delimiter with no `htmlspecialchars()` around the whole thing. Fixed across all 6 occurrences
(Departments, Users, Settings, Service Status, both KB sections) by building the JS into a local
variable and passing the whole thing through `htmlspecialchars()` once. See
`fixes/F003-onclick-json-encode-escaping.md` — this was never caught by HTTP-level curl testing;
only found by reading raw HTML during this audit. Validation audit — every mutating handler
already validates required/typed fields (confirmed by re-reading each one); no gaps found beyond
F003.

### T037 — Session hardening
Priority: HIGH · Phase: MVP · Depends On: T007 · Status: COMPLETE
Description: Regenerate session ID on login (already required by T007 — verify), set secure/
httponly cookie flags, add an idle timeout.
Acceptance Criteria:
- [x] Session cookie is `HttpOnly`; `Secure` flag set when served over HTTPS
- [x] Idle session expires after a defined timeout and forces re-login
Output: Session config hardening in `config.php`/session bootstrap.
Notes: `session_regenerate_id(true)` on login already existed (T007) — confirmed still present.
Added to `config.php`/`config.example.php`'s session bootstrap: `session.cookie_samesite=Lax`
(defense-in-depth alongside T035's CSRF tokens) and a conditional `session.cookie_secure=1` only
when `$_SERVER['HTTPS']` is actually set — forcing it unconditionally would silently break login
on plain-HTTP local dev. New `SESSION_IDLE_TIMEOUT_SECONDS` (1800 = 30 min) constant; `auth.php`'s
`currentUser()` now force-logs-out (`logoutUser()`) a session whose `last_activity` is older than
that, refreshing `last_activity` on every authenticated request otherwise; `loginUser()` sets it
on login. Comparison uses PHP's own `time()` on both sides (never MySQL's `NOW()`), so the F002
PHP/MySQL timezone drift doesn't apply here. Verified: cookie response header shows `HttpOnly;
SameSite=Lax` (no `Secure` on this HTTP dev box, as designed); a mocked idle session (`time() -
last_activity` past the threshold) correctly returns `null` from `currentUser()` and clears
`$_SESSION`, while a fresh session passes through unaffected.

**This closes Phase 8 (Security Hardening) — T035 through T037 all COMPLETE.**

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
