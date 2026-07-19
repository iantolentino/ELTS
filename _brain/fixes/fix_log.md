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

---

## Usage Rule

- Skim the table only. Open a detail file ONLY if its title matches the current problem.
- If no match exists, proceed with normal debugging, then add a new row here before stopping.
- Keep "Root Cause" to one line — that line is what future AI sessions scan for a match.
