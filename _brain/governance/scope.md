# SCOPE DEFINITION

> Written and locked during CONFIRMATION_LOCK.
> Scope changes must go through the change control process in `governance/rules.md`.

---

## In Scope — MVP
Features confirmed and approved 2026-07-19 (source: user-provided MTS v2.0 README + database.sql):

- [ ] Centralized single-controller routing (`index.php`) with clean URLs
- [ ] Strict department isolation for agents
- [ ] Session-based auth (superadmin / agent roles), password hashing
- [ ] Public ticket submission + status lookup (no auth)
- [ ] Paginated department dashboards (`LIMIT 25 OFFSET`)
- [ ] Ticket detail view, status transitions, `status_history` logging
- [ ] Mandatory resolution summary gate on ticket close
- [ ] Reassignment, internal notes, file attachments
- [ ] `system_cache` read-through cache (60s TTL) for dashboard/SLA aggregates
- [ ] SLA deadline tracking + `is_overdue` flagging
- [ ] Burst limiter (10 tickets/5min) + escalating cooldown (30m→1h→24h)
- [ ] Service Status Hub (public banner + admin management)
- [ ] Super admin dashboard, "View As" mode, feature-flag command center
- [ ] Destructive-action confirmation modals
- [ ] Department CRUD, user/agent CRUD (incl. presence/`is_online`)
- [ ] Immutable audit logging (`audit_logs`) on every reassignment/status/note change
- [ ] CSV export, print/PDF report export (with resolution summary injected)
- [ ] Knowledge base CRUD (per-department articles)
- [ ] CSRF protection, input validation, session hardening
- [ ] cPanel deployment path: `config.php` + `database.sql` import + `/private/migration-command.php` + `.htaccess`

Full atomic breakdown with dependencies: `progress/backlog.md`.

---

## Deferred — Phase 2 (Scale Prep)
Planned but not built in MVP:

- [ ] Email delivery integration (real SMTP/API) — legacy prototype only stubbed this to a log file; not in the confirmed MTS v2.0 spec, revisit if required
- [ ] Keyset/cursor pagination — only needed if a department's ticket volume grows an order of magnitude beyond current `OFFSET` pagination's comfortable range
- [ ] Active cache invalidation on write (vs. current TTL-only expiry for `system_cache`)
- [ ] DB backup cadence / policy — spec is silent on this; logged as research task `R001` rather than assumed (see `progress/backlog.md`)

---

## Explicitly Rejected
Will not be built — reasons logged in `decisions/rejected_options.md`:

- React + Vite + Shadcn UI single-page frontend — conflicts with the plain cPanel/LAMP shared-hosting deploy target; replaced with PHP-rendered views using Tailwind CSS in shadcn's visual style, no Node build step

---

## Scope Change Protocol
If the user requests a scope change during EXECUTION_MODE:

1. Stop the current task
2. Log the change request in `decisions/decision_log.md`
3. Update `progress/backlog.md` with new or removed tasks
4. Update `timelines/actual_timeline.md`
5. Resume from the next appropriate task

No scope change takes effect until it is written to this file and backlog.md.
