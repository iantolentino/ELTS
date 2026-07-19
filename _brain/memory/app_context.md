# APP CONTEXT

> Confirmed during CONFIRMATION_LOCK 2026-07-19. This is the locked spec — do not re-open without
> going through `governance/rules.md` § Change Control.

---

## Project Name
Modular Ticketing System (MTS) — repo name `ELTS` (github.com/iantolentino/ELTS)

## Project Type
Internal enterprise ticketing / helpdesk web app (multi-department, multi-tenant within one org)

## Domain
Multi-department internal support ticketing (e.g. IT, HR, Installation/Repair) for an
organization running on shared cPanel/cloud hosting.

## Target Users
- **Requestors** (public, unauthenticated): submit tickets, look up status by ticket ID/email
- **Agents**: department-scoped staff who accept, work, and resolve tickets in their own
  department only — cannot see other departments' data
- **Super Admins**: cross-department oversight, "View As" impersonation, feature flags, user/dept
  management, exports, destructive actions (archiving)

## Core Workflow
1. Requestor submits a ticket via the public portal (subject, description, department, optional
   supplier name) — subject to burst-limiter/cooldown checks
2. Ticket routes to the target department's agent dashboard (paginated, 25/page)
3. An agent accepts/assigns the ticket, works it, optionally adds internal notes and attachments
4. Agent transitions status (open → on-hold → closed/cancelled); every transition is logged to
   `status_history` and `audit_logs`
5. Agent cannot close/resolve without entering a mandatory resolution summary
6. Resolution summary is injected into CSV/print exports
7. Super admin can audit any ticket's full history, reassign across agents, or "View As" an agent
   to diagnose issues without their password

## Key Features (MVP) — all CORE (see `governance/scope.md` for classification)
- [ ] Centralized single-controller routing with clean URLs + strict department isolation
- [ ] Paginated dashboards (LIMIT/OFFSET, 25/page) + `system_cache` (60s TTL) for heavy stats
- [ ] Compound-indexed schema (already defined in `database.sql`)
- [ ] Super Admin "View As" mode
- [ ] Feature-flag command center (`settings` table, e.g. maintenance mode, upload allow-list)
- [ ] Destructive-action confirmation modals
- [ ] Burst limiter (10 tickets / 5 min) + escalating cooldown (30m → 1h → 24h)
- [ ] Public Service Status Hub banner
- [ ] Immutable audit logging on every reassignment/status/note change
- [ ] Mandatory resolution summary gate on ticket close
- [ ] Optional supplier-name linking on tickets

## Tech Stack
| Layer       | Technology |
|-------------|------------|
| Language    | PHP 8.x |
| Framework   | None — hand-rolled centralized front controller (no MVC framework) |
| Data access | PDO with prepared statements only (no raw query concatenation) |
| Database    | MySQL 8.0+ |
| Cache       | Native `system_cache` MySQL table (60s TTL), no external cache service |
| Auth        | PHP session-based auth, `role` enum (`superadmin` / `agent`), password hashing via `password_hash()`/`password_verify()` |
| Frontend    | PHP server-rendered views styled with Tailwind CSS using shadcn-style visual patterns — **no React, no Vite, no Node build step at runtime** (see `decisions/rejected_options.md`) |
| Hosting     | cPanel / shared LAMP hosting, also runnable locally under XAMPP (`c:\xampp\htdocs\ticketing-app`, reachable at `http://localhost/ticketing-app/`) |

## Expected Scale
Multi-department internal org tool — moderate concurrent users (tens to low hundreds), ticket
volume growing over time. Not hyperscale, but must not degrade as ticket count grows: pagination,
compound indexes, and the cache layer exist specifically to keep dashboards fast at scale.

## Hard Constraints
- Must deploy on plain shared cPanel/LAMP hosting — no Docker, no Node/Vite build step at runtime
- Strict department data isolation is non-negotiable — agents must never see cross-department data
- PDO prepared statements only — no raw SQL string interpolation anywhere
- Real DB credentials never committed to the repo (see `security/secrets_policy.md`)
- One atomic task executed per AI session — see `tasks/task_rules.md`

## Current Phase
MVP (SYSTEM_GENERATION complete 2026-07-19 — backlog ready, no application code written yet)
