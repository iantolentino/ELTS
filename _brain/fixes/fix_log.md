# FIX LOG

> Read this file FIRST before debugging anything. It is the entire memory of every bug this
> repo has already solved. Most entries should need nothing more than this table.

---

## Format

```
| ID   | Title                        | Category  | Root Cause (1 line)          | Detail File          | Date       | Status |
|------|------------------------------|-----------|-------------------------------|-----------------------|------------|--------|
| F001 | [Short bug description]     | WEB       | [One-line cause]              | inline / F001-slug.md | YYYY-MM-DD | FIXED  |
```

Categories: `WEB` | `BACKEND` | `DB` | `AUTH` | `BUILD` | `DEPLOY` | `AUTOMATION` | `CLI` | `INFRA` | `OTHER`

Status: `FIXED` | `WORKAROUND` (not a real fix, revisit) | `SUPERSEDED` (see linked replacement)

---

## Log

| ID | Title | Category | Root Cause (1 line) | Detail File | Date | Status |
|----|-------|----------|----------------------|-------------|------|--------|
| F001 | `/private/` blanket-blocked before migration-command.php could be built | DEPLOY | T004's `.htaccess` used `Require all denied` on `/private/`, contradicting README Step 3 which requires browsing to `migration-command.php` before Step 4 locks anything down | inline | 2026-07-19 | FIXED |
| F002 | `system_cache` never hit — every call recomputed | DB | `cacheRemember()` computed `expires_at` with PHP's `date()` (default/UTC timezone) but compared it against MySQL's `NOW()` (server-local timezone, several hours apart on this box), so every stored row already looked expired | inline | 2026-07-19 | FIXED |
| F003 | Every admin "Edit" button's `onclick` prefill was silently truncated | WEB | `onclick="..."` is HTML-attribute-delimited by `"`, but the JS inside was built with `json_encode()` (which wraps values in literal, unescaped `"`) concatenated straight into the attribute with no `htmlspecialchars()` — the first `"` from `json_encode` closed the attribute early, truncating the handler to an invalid partial assignment | F003-onclick-json-encode-escaping.md | 2026-07-20 | FIXED |
| F004 | Department dashboard/ticket-detail 500'd after T054 (multi-department tickets) | DB | Reused the same named placeholder (`:dept_id`) twice in one SQL string across 3 queries — `db.php`'s PDO connection has `EMULATE_PREPARES=false`, and MySQL's native prepared-statement protocol needs one bound value per placeholder *occurrence*, not per name, so a repeated name throws `SQLSTATE[HY093]: Invalid parameter number` | inline | 2026-07-21 | FIXED |
| F005 | Department dashboard 500'd twice more right after F004's fix (T049) | DB | Adding `LEFT JOIN users u` to the dashboard ticket-list and CSV-export queries (for the new "Assigned To" column) made `created_at`/`updated_at` AND `department_id` ambiguous — `users` has its own copies of all three — MySQL error 1052, one column at a time as each got fixed. `tickets.*`-style aliasing avoids this everywhere else in the app (e.g. handleDepartmentTicket's `SELECT t.*`); these queries listed columns individually instead and had to have every colliding one qualified by hand | inline | 2026-07-21 | FIXED |
| F006 | New analytics dashboard (T055-T059/T060) 500'd on first load: `department_id` ambiguous | DB | Same class as F004/F005, third occurrence — `analytics.php`'s `fetchRecentTickets()` LEFT JOINs `users` (own `department_id`) and selected the bare column name; separately, `admin_controller.php`'s cross-department `$where` built `department_id = :dept_id` unqualified and got reused by the same joined query. Both fixed by qualifying as `tickets.department_id`. Caught by a Playwright smoke pass before being reported live — see `_brain/summaries/current_state.md` for the standing rule this establishes: qualify every column by hand whenever a `$where`/`SELECT` fragment built for an unjoined query gets reused inside one that joins `users` or another table sharing column names | inline | 2026-07-21 | FIXED |

---

## Usage Rule

- Skim the table only. Open a detail file ONLY if its title matches the current problem.
- If no match exists, proceed with normal debugging, then add a new row here before stopping.
- Keep "Root Cause" to one line — that line is what future AI sessions scan for a match.
