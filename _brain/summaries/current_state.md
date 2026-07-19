# CURRENT STATE

> The AI reads this file at the start of every EXECUTION_MODE session.
> Update this file at the end of every session — before stopping.

---

## System State
SYSTEM_GENERATION complete — ready for EXECUTION_MODE

## Current Phase
MVP

## Last Completed Task
T023 — Service Status Hub
Completed: 2026-07-19 — **Phase 4 (Spam & Resilience) is now fully complete (T021–T023)**

## Next Task
T024 — Super admin dashboard
Depends on: T019 (COMPLETE)

## Active Blockers
T040 (ELTS repo wipe + push) is BLOCKED pending a fresh, explicit user confirmation at the time
it's actually run — not blocking any other task in the meantime.

## Session Notes
- MTS v2.0 spec (README.md + database.sql) confirmed 2026-07-19 and written verbatim to project
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

---

Last updated: 2026-07-19
