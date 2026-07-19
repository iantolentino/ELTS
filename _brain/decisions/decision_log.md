# DECISION LOG

> Record every architecture, stack, or scope decision made after CONFIRMATION_LOCK.
> This prevents the AI from re-opening settled decisions in future sessions.

---

## Format

```
[TYPE] → [Decision made]
Impact: low | medium | high
Reason: [One-line justification]
Date: [YYYY-MM-DD]
```

Types: ARCH | STACK | SCOPE | SECURITY | PERFORMANCE | UX

---

## Decisions

[ARCH] → Modular monolith with a single centralized front controller (`index.php`) handling all routing
Impact: high
Reason: Matches README's "Centralized Controller" architecture; simplest to deploy and reason about on shared cPanel hosting; strict department isolation is easiest to enforce with one routing chokepoint
Date: 2026-07-19

[STACK] → Frontend is PHP server-rendered views styled with Tailwind CSS in shadcn's visual style — not a React/Vite/Shadcn SPA
Impact: high
Reason: The README's "lightweight PHP backend... cPanel environments" framing conflicts with a literal Vite/React build pipeline on shared hosting; server-rendered PHP delivers the same visual system without a Node runtime dependency. Confirmed with user 2026-07-19. See `decisions/rejected_options.md`.
Date: 2026-07-19

[SCOPE] → Legacy SQLite prototype (config.php, db.php, dashboard.php, etc.) archived to `_brain/staging/legacy-sqlite-prototype/` and removed from project root; not carried forward into MTS v2.0
Impact: medium
Reason: Prototype's own README.txt states it exists only to test flow/design "before deciding what to carry into ELTS"; MTS v2.0 spec targets MySQL/PDO, not SQLite — clean break avoids mixing schemas
Date: 2026-07-19

[STACK] → Shadcn-style visual system implemented as a small hand-authored static CSS file (`assets/app.css`), not the Tailwind Play CDN and not a Tailwind build step
Impact: medium
Reason: Play CDN is explicitly unsuitable for production per Tailwind's own docs (runtime JIT compile, no purging); a Node build step was already rejected in the earlier React/Vite decision. A static CSS file delivers the same shadcn-inspired visual language (cards, buttons, badges, form fields) with zero build tooling and zero runtime cost — extended incrementally as later tasks need more components.
Date: 2026-07-19

[STACK] → `assets/app.css` uses shadcn/ui's actual default color tokens (OKLCH, neutral/zinc theme) as CSS custom properties, including light + `prefers-color-scheme: dark` variants — not an arbitrary hand-picked palette
Impact: low
Reason: User explicitly asked for shadcn's coloring (https://ui.shadcn.com/docs/theming). Token values fetched live from that page 2026-07-19 rather than recalled, since shadcn's defaults migrated to OKLCH in recent versions. Status badges (open/on-hold/closed/cancelled) are tinted from shadcn's own `--chart-1..5` tokens via `color-mix()` rather than inventing separate hex colors, keeping every color in the app traceable to the same token set.
Date: 2026-07-19

[ARCH] → Base URL computed at runtime from `dirname($_SERVER['SCRIPT_NAME'])` (`index.php`), not hardcoded
Impact: medium
Reason: Project must work both at a production domain root and in a local subfolder (XAMPP's `/ticketing-app/`) without code changes between environments — all internal links/assets go through a `url()` helper built on this.
Date: 2026-07-19

[ARCH] → Mandatory resolution summary (T014) is stored as an `audit_logs` row (`action_type = 'RESOLUTION_SUMMARY'`, `new_value` = the summary text), not a new `tickets` column
Impact: medium
Reason: `database.sql` is the user's exact, finalized spec and has no dedicated column for this — the `tickets` table only has `description` (the original problem statement, which shouldn't be overwritten/appended to) and no `resolution_summary` field. Rather than silently modifying the given schema, the summary is written to `audit_logs`, which already exists specifically to record "what changed and why" per ticket and needs no schema change. Retrieval for exports (T033): `SELECT new_value FROM audit_logs WHERE ticket_id = ? AND action_type = 'RESOLUTION_SUMMARY' ORDER BY timestamp DESC LIMIT 1`.
Date: 2026-07-19

[ARCH] → SLA deadline duration by priority (T020): urgent=4h, high=8h, med=24h, low=72h from ticket creation time
Impact: medium
Reason: Neither README nor database.sql define SLA durations — the schema has `sla_deadline`/`is_overdue` columns but no policy. These are common, defensible ticketing-industry defaults, computed in `SLA_HOURS_BY_PRIORITY` (public_controller.php) at submission time. Easy to change in one place; flagged here so it's understood as a stand-in default, not a requirement from the spec.
Date: 2026-07-19

[ARCH] → `is_overdue` is computed live via SQL (`sla_deadline < NOW() AND status NOT IN ('closed','cancelled')`) wherever displayed, not maintained by a background job against the stored column
Impact: low
Reason: No cron/scheduler infrastructure exists in this project, and inventing one wasn't in scope for T020. The acceptance criteria explicitly allows "on read" computation as an alternative to a scheduled recompute. All SLA-timing computation is done in MySQL, not PHP, to avoid a repeat of F002's PHP/MySQL timezone mismatch.
Date: 2026-07-19

[ARCH] → "View As" session-start events (T025) are logged to a flat file (`logs/audit-system.log`), not the `audit_logs` table
Impact: low
Reason: `audit_logs.ticket_id` is `NOT NULL` — a View-As event isn't tied to any ticket, so there is no honest row to write (picking an arbitrary ticket_id would misattribute the event). `logs/` gets the same protection model as `uploads/`: `Require all denied`, no direct HTTP access, only readable server-side.
Date: 2026-07-19

[ARCH] → User "deactivation" (T029) revokes login by overwriting `password_hash` with an unusable sentinel value (`DEACTIVATED:<random hex>`), not a status column
Impact: medium
Reason: `users` has no active/inactive/deleted column in `database.sql`. Deleting the row instead would null out their `tickets.assigned_to` and `audit_logs.actor_id` via the FKs (`ON DELETE SET NULL`), losing real accountability history — worse than keeping the row. The sentinel never matches `password_verify()` (not a valid bcrypt/argon2 hash), so login is fully blocked, while name/email/history stay intact everywhere they're referenced. The `DEACTIVATED:` prefix is also used to render a "deactivated" badge in the admin user list. Reactivating = setting a new real password, which naturally overwrites the sentinel.
Date: 2026-07-19

[DEPLOY] → Wiping and replacing the contents of github.com/iantolentino/ELTS.git is deferred until MTS v2.0 application code exists and is verified locally (backlog task T040)
Impact: high
Reason: Clearing a remote repo's history/contents is destructive and hard to reverse; doing it before any code exists would leave the remote empty for no benefit. Confirmed with user 2026-07-19 — requires its own separate confirmation at execution time regardless of backlog order.
Date: 2026-07-19

---
