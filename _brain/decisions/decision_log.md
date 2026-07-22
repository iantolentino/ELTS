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

[SCOPE] → Legacy SQLite prototype (config.php, db.php, dashboard.php, etc.) archived to `_brain/staging/legacy-sqlite-prototype/` and removed from project root; not carried forward into MTS
Impact: medium
Reason: Prototype's own README.txt states it exists only to test flow/design "before deciding what to carry into ELTS"; MTS spec targets MySQL/PDO, not SQLite — clean break avoids mixing schemas
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

[ARCH] → Added `team_leader_name` and `client_name` (both `VARCHAR(150) NOT NULL`) to `tickets`, the first change to `database.sql` since it was locked as spec
Impact: medium
Reason: Direct user request — both fields required on the public ticket submission form. Confirmed with the user first (which form, required-vs-optional) since every prior session treated `database.sql` as fixed and routed around it instead of altering it (e.g. resolution summary → `audit_logs`, not a `tickets` column). Live `ticketing_app.tickets` altered with a temporary `DEFAULT ''`, existing rows backfilled to `'Unspecified'`, then the default dropped — final live schema matches `database.sql` exactly (`NOT NULL`, no default). Wired into the public form (both required, standard trim+length validation), `renderTicketDetail()`, and the T032/T033 CSV/print report (`fetchReportTickets()` + both output functions) so the new required data isn't collected and then invisible everywhere else.
Date: 2026-07-20

[SCOPE] → Opened Phase 10 (Trackr Design & Feature Port, T041–T048), diverging from Phase 9 (Deploy, T038–T040) which was next in line
Impact: high
Reason: Direct user request — port the design (sidebar nav, department-picker portal) and re-implement missing functionality (FAQ, request types, comments, requester accounts, tags) from `github.com/iantolentino/ticketing-system.git` ("Trackr"). That repo is Next.js/Prisma/PostgreSQL — a different stack from ELTS's locked PHP/MySQL architecture ([STACK] above — no React/Vite SPA), so this is a re-implementation, not a code merge; cloned read-only to `_brain/staging/` for reference only, not part of the runtime. User was shown a split (design-only vs. design+all features vs. pick specific features) and explicitly chose the full scope. Deploy (T038–T040) resumes after Phase 10, or whenever the user redirects back to it.
Date: 2026-07-20

[DEPLOY] → github.com/iantolentino/ELTS.git main was force-pushed with this MTS (PHP-vanilla) build, overwriting a separate, pre-existing Laravel application that lived there (composer.lock, app/Models, database/migrations, tests/, its own _brain/)
Impact: high
Reason: User explicitly re-confirmed after being shown the conflict in detail (Laravel app contents listed) — this was NOT the original general backlog approval, a fresh confirmation was obtained specifically for this action per governance/rules.md. Previous Laravel HEAD was `6a3caaa0eb6bac2f7b7cc5b0e11f6c329ea77642` — no longer on any branch, but the commit is not immediately garbage-collected and is recoverable by SHA if ever needed (`git fetch origin 6a3caaa...` won't work post-GC-window; keep this SHA on record regardless).
Date: 2026-07-19
Impact: high
Reason: Clearing a remote repo's history/contents is destructive and hard to reverse; doing it before any code exists would leave the remote empty for no benefit. Confirmed with user 2026-07-19 — requires its own separate confirmation at execution time regardless of backlog order.
Date: 2026-07-19

[SCOPE] → Opened Phase 12 (Dashboard Analytics & Reporting, T055–T065), a large unconfirmed batch request executed under Auto Mode rather than routed through CONFIRMATION_LOCK
Impact: high
Reason: Direct, detailed user request (dashboard stat cards, ticket-created/status/priority charts, recent activity, superadmin cross-department dashboard, per-department free filtering, report stat cards, per-department Report tab, department description, superadmin-only agent KPIs) plus an explicit instruction to cross-check `github.com/James-push/ticketing-system.git` for anything missed. That repo turned out to be the same Next.js/Prisma/PostgreSQL codebase already used for Phase 10 ("Trackr" — `iantolentino/ticketing-system` forked from it; confirmed via identical README and a `Sidebar.tsx` comment linking back to it), so its dashboard/stats-API source was read directly for the exact card set, SLA bucket definitions, and chart choices, then reproduced in hand-rolled PHP/CSS/SVG (`analytics.php`) per the existing no-framework-bloat [STACK] decision — not a code port, same rule as Phase 10.
Date: 2026-07-21

[ARCH] → Added `departments.description TEXT NULL`, the second live change to `database.sql` since it was locked as spec (after `team_leader_name`/`client_name` above)
Impact: low
Reason: T064 — direct user request ("when we add new department in requestors view the need to see some description that superadmin can edit"). Nullable with no default, so every existing department silently falls back to the prior generic portal-picker text until a superadmin fills one in — no backfill needed, unlike the `NOT NULL` team_leader_name/client_name addition.
Date: 2026-07-21

---
