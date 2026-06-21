# PROJECT PROGRESS
> Full task breakdown from setup to production. One task executed at a time.
> Status: [ ] = pending | [x] = done | [~] = in progress | [!] = blocked

---

## PHASE 0 — PROJECT SETUP
**Goal:** Functional skeleton with all dependencies installed and configured.

- [ ] P0-01 — Install Laravel 11 via Composer, configure `.env` for MySQL
- [ ] P0-02 — Install and configure Inertia.js (server-side adapter)
- [ ] P0-03 — Install React 18 + TypeScript + Vite, configure tsconfig
- [ ] P0-04 — Install and configure Tailwind CSS with custom design tokens (colors, fonts)
- [ ] P0-05 — Install spatie/laravel-permission and publish config
- [ ] P0-06 — Install spatie/laravel-activitylog and publish config
- [ ] P0-07 — Install barryvdh/laravel-dompdf
- [ ] P0-08 — Install maatwebsite/excel
- [ ] P0-09 — Install webklex/laravel-imap
- [ ] P0-10 — Install pragmarx/google2fa-laravel for TOTP 2FA
- [ ] P0-11 — Install knuckleswtf/scribe for API docs
- [ ] P0-12 — Install Pest PHP testing framework
- [ ] P0-13 — Create base AppLayout.tsx and AuthLayout.tsx with sidebar + topbar
- [ ] P0-14 — Create base UI component library: Button, Input, Modal, Badge, Dropdown, Table, Card
- [ ] P0-15 — Set up queue database tables (`php artisan queue:table`)
- [ ] P0-16 — Configure cPanel cron job for Laravel Scheduler (every minute)
- [ ] P0-17 — Set up `config/ticketing.php` with app-wide defaults

---

## PHASE 1 — AUTHENTICATION & USER MANAGEMENT
**Goal:** All roles can log in, register (clients), and manage their accounts.

- [ ] P1-01 — Create `users` table migration with all fields (name, email, password, role, availability_status, is_vip, 2fa_secret, etc.)
- [ ] P1-02 — Create `teams` and `departments` table migrations
- [ ] P1-03 — Seed roles and permissions via RolesAndPermissionsSeeder
- [ ] P1-04 — Build login page (AuthLayout, email + password form, remember me)
- [ ] P1-05 — Build client registration page with email verification
- [ ] P1-06 — Build forgot password / reset password flow
- [ ] P1-07 — Build 2FA setup page (QR code, TOTP verification)
- [ ] P1-08 — Build 2FA challenge page (shown on login if 2FA enabled)
- [ ] P1-09 — Build user profile page (name, avatar, password change, 2FA toggle)
- [ ] P1-10 — Build Admin: User list page (sortable, filterable, paginated)
- [ ] P1-11 — Build Admin: Create / edit user form (role, team, department assignment)
- [ ] P1-12 — Build Admin: Agent availability status toggle (Online/Busy/Away/Offline)
- [ ] P1-13 — Build Admin: Team management page (create, edit, assign agents)
- [ ] P1-14 — Build Admin: Department management page
- [ ] P1-15 — Build Admin: Role permissions editor (granular permission matrix UI)
- [ ] P1-16 — Build login history page (admin view all, user view own)
- [ ] P1-17 — Build active sessions page with force-logout capability
- [ ] P1-18 — Unit tests: UserService, registration, login, 2FA

---

## PHASE 2 — TICKET CORE
**Goal:** Full ticket CRUD with all metadata, custom fields, and bulk actions.

- [ ] P2-01 — Migrations: tickets, ticket_replies, ticket_notes, ticket_statuses, ticket_categories, ticket_tags, ticket_tag_pivot, ticket_watchers, ticket_attachments
- [ ] P2-02 — Migrations: custom_fields, custom_field_values, ticket_templates
- [ ] P2-03 — Seed default statuses: Open, In Progress, On Hold, Resolved, Closed
- [ ] P2-04 — Build TicketService with create/update/close/delete/merge methods
- [ ] P2-05 — Build Ticket index page: list view with filters (status, priority, category, assignee, date range), search, sort, pagination
- [ ] P2-06 — Build Ticket show page: full thread view (replies + notes interleaved), activity timeline sidebar
- [ ] P2-07 — Build Ticket create form: subject, description (Tiptap), category, priority, custom fields, attachments, assignee
- [ ] P2-08 — Build Ticket reply form: WYSIWYG editor (Tiptap), file attach, CC/BCC, canned response selector
- [ ] P2-09 — Build Internal note form: same editor but marked private, not visible to client
- [ ] P2-10 — Build ticket status change controls (drag-to-status or dropdown)
- [ ] P2-11 — Build ticket priority change control
- [ ] P2-12 — Build ticket assignment control (assign to agent, team)
- [ ] P2-13 — Build tag management: add/remove tags on ticket, tag CRUD in settings
- [ ] P2-14 — Build ticket watcher subscribe/unsubscribe
- [ ] P2-15 — Build bulk actions: select multiple tickets → assign / close / change status / tag / delete
- [ ] P2-16 — Build ticket merge UI (select target ticket, confirm, preserve thread)
- [ ] P2-17 — Build parent-child ticket linking UI
- [ ] P2-18 — Build Admin: Custom status management (create, edit, reorder, set color)
- [ ] P2-19 — Build Admin: Category & subcategory management (tree editor)
- [ ] P2-20 — Build Admin: Custom field management (define fields per category)
- [ ] P2-21 — Build Admin: Ticket template management
- [ ] P2-22 — Build file attachment upload (drag-drop, preview, size limit enforcement)
- [ ] P2-23 — Build @mention autocomplete in Tiptap editor
- [ ] P2-24 — Build activity timeline component (full diff view of all ticket changes)
- [ ] P2-25 — Feature tests: ticket CRUD, reply, note, bulk actions

---

## PHASE 3 — EMAIL INTEGRATION
**Goal:** Bidirectional email — incoming creates tickets, outgoing notifies users.

- [ ] P3-01 — Migration: mailboxes, incoming_emails tables
- [ ] P3-02 — Build Mailbox model and MailboxService (IMAP poll via webklex)
- [ ] P3-03 — Build ProcessIncomingEmail job (parse email → create ticket or append reply)
- [ ] P3-04 — Schedule ProcessIncomingEmail every 2 minutes in Kernel.php
- [ ] P3-05 — Build outgoing email templates (Blade): ticket_created, reply_received, ticket_resolved, ticket_closed, ticket_assigned
- [ ] P3-06 — Build SendTicketEmail job (queued, dispatched on ticket events)
- [ ] P3-07 — Wire events: TicketCreated → SendTicketEmail, TicketReplied → SendTicketEmail, etc.
- [ ] P3-08 — Build Admin: Mailbox management page (add IMAP credentials, test connection, enable/disable)
- [ ] P3-09 — Build Admin: Email template editor (customize subject + body per event type)
- [ ] P3-10 — Build email bounce/failure detection and log to `incoming_emails.status`
- [ ] P3-11 — Build CC/BCC on ticket replies (store + include in outgoing email)
- [ ] P3-12 — Feature tests: incoming email parsing, outgoing email dispatch

---

## PHASE 4 — SLA MANAGEMENT
**Goal:** Configurable SLA policies with real-time tracking and breach alerts.

- [ ] P4-01 — Migrations: sla_policies, sla_records, business_hours, holidays
- [ ] P4-02 — Build SLAService: calculate due times respecting business hours + holidays
- [ ] P4-03 — Build SLARecord creation on ticket open (first_response_due, resolution_due)
- [ ] P4-04 — Build CheckSLABreaches job (scheduled every 5 min, marks breached=true, fires event)
- [ ] P4-05 — Build SLABreached event + listener (sends in-app + email alert)
- [ ] P4-06 — Build SLA pause/resume on ticket (sets paused_at, adjusts due times on resume)
- [ ] P4-07 — Build SLA status badge on ticket (Green / Yellow warning / Red breached)
- [ ] P4-08 — Build Admin: SLA policy management page (create, edit, assign to priority/tier)
- [ ] P4-09 — Build Admin: Business hours configuration (per team, day-of-week schedule)
- [ ] P4-10 — Build Admin: Holiday calendar management
- [ ] P4-11 — Feature tests: SLA calculation, breach detection, pause/resume

---

## PHASE 5 — AUTOMATION & WORKFLOWS
**Goal:** Visual rule builder that auto-handles tickets based on configurable conditions.

- [ ] P5-01 — Migrations: automation_rules, automation_conditions, automation_actions
- [ ] P5-02 — Build AutomationService: evaluate rules against ticket on create/update events
- [ ] P5-03 — Build RunAutomationRules job (queued, triggered by ticket events)
- [ ] P5-04 — Implement action handlers: assign, tag, change priority, change status, send notification, escalate, close
- [ ] P5-05 — Build Admin: Automation rule list page
- [ ] P5-06 — Build Admin: Rule builder UI (visual if/then editor with condition + action blocks)
- [ ] P5-07 — Build round-robin assignment logic in AutomationService
- [ ] P5-08 — Build skill-based routing (tag-to-agent-skill matching)
- [ ] P5-09 — Build auto-close stale tickets command (configurable days in settings)
- [ ] P5-10 — Feature tests: rule evaluation, all action types, round-robin

---

## PHASE 6 — CANNED RESPONSES
**Goal:** Agents can save and reuse reply templates.

- [ ] P6-01 — Migration: canned_responses table (title, body, scope: global/team/personal)
- [ ] P6-02 — Build CannedResponse CRUD (admin: global/team, agent: personal)
- [ ] P6-03 — Build canned response selector in Tiptap editor (search + insert)
- [ ] P6-04 — Variable support in canned responses: {{client_name}}, {{ticket_id}}, {{agent_name}}

---

## PHASE 7 — REPORTS & ANALYTICS
**Goal:** Rich dashboard + custom report builder + scheduled exports.

- [ ] P7-01 — Build ReportService with all metric calculation methods
- [ ] P7-02 — Build main dashboard page: KPI cards (open tickets, avg resolution time, SLA compliance %, CSAT score)
- [ ] P7-03 — Build ticket volume trend chart (line chart, daily/weekly/monthly toggle)
- [ ] P7-04 — Build first response time chart (bar chart per agent/team)
- [ ] P7-05 — Build SLA compliance gauge chart
- [ ] P7-06 — Build agent performance scorecard table (tickets handled, avg resolution, CSAT, SLA compliance)
- [ ] P7-07 — Build team comparison bar chart
- [ ] P7-08 — Build ticket breakdown charts (by priority, by status, by category — pie/donut)
- [ ] P7-09 — Build custom report builder page (metric selector, date range, group by, filter)
- [ ] P7-10 — Build PDF export (DomPDF — dashboard snapshot + custom report)
- [ ] P7-11 — Build Excel/CSV export (maatwebsite/excel)
- [ ] P7-12 — Build scheduled report configuration (pick report, schedule, recipient emails)
- [ ] P7-13 — Build GenerateScheduledReport job (render + attach + email)
- [ ] P7-14 — Feature tests: metric calculations, export generation

---

## PHASE 8 — KNOWLEDGE BASE
**Goal:** Self-service Help Center with article management and ticket suggestions.

- [ ] P8-01 — Migrations: knowledge_categories, knowledge_articles tables
- [ ] P8-02 — Build public Knowledge Base index page (categories, search, no login required)
- [ ] P8-03 — Build public article view page (full content, feedback buttons)
- [ ] P8-04 — Build Admin: article editor (Tiptap, category assign, public/private toggle, publish/draft)
- [ ] P8-05 — Build Admin: KB category management
- [ ] P8-06 — Build article full-text search (MySQL FULLTEXT index)
- [ ] P8-07 — Build suggested articles on ticket create form (keyword match to article titles)
- [ ] P8-08 — Build article feedback endpoint (helpful / not helpful vote)

---

## PHASE 9 — CUSTOMER SATISFACTION (CSAT + NPS)
**Goal:** Automated satisfaction measurement tied to ticket lifecycle.

- [ ] P9-01 — Migrations: csat_surveys, nps_surveys tables
- [ ] P9-02 — Build SendCSATSurvey job (dispatched with 1hr delay on ticket resolved)
- [ ] P9-03 — Build CSAT response page (public, no login — token-based URL)
- [ ] P9-04 — Build NPS survey email + response page (periodic, token-based)
- [ ] P9-05 — Build CSAT/NPS metrics on dashboard (avg score, trend chart)
- [ ] P9-06 — Build CSAT per-agent and per-team breakdown table

---

## PHASE 10 — ASSET MANAGEMENT
**Goal:** Asset inventory with ticket linking and lifecycle tracking.

- [ ] P10-01 — Migrations: assets, asset_assignments tables
- [ ] P10-02 — Build Asset list page (searchable, filterable by type/status/assignee)
- [ ] P10-03 — Build Asset show page (details, assignment history, linked tickets)
- [ ] P10-04 — Build Asset create/edit form
- [ ] P10-05 — Build asset assignment to user (with history log)
- [ ] P10-06 — Build asset-ticket linking on ticket create/edit form
- [ ] P10-07 — Build asset lifecycle status management (purchased/in-use/maintenance/retired)

---

## PHASE 11 — AUDIT LOGS
**Goal:** Complete tamper-evident audit trail across all system actions.

- [ ] P11-01 — Configure spatie/laravel-activitylog on all key models via Observers
- [ ] P11-02 — Build Admin: Audit log viewer page (filterable by user, action, model, date range)
- [ ] P11-03 — Build ticket change history diff viewer (before/after per field)
- [ ] P11-04 — Build login history viewer (admin: all users, user: own)
- [ ] P11-05 — Build audit log export (CSV/PDF)
- [ ] P11-06 — Build Admin: Data retention policy settings (archive/delete logs after X days)

---

## PHASE 12 — NOTIFICATIONS
**Goal:** Multi-channel notifications with per-user preference control.

- [ ] P12-01 — Migration: notifications table (Laravel built-in)
- [ ] P12-02 — Build in-app notification center UI (bell icon, unread count, notification list, mark all read)
- [ ] P12-03 — Wire notifications: ticket assigned, reply received, @mention, SLA warning, SLA breach
- [ ] P12-04 — Build notification preferences page (user can toggle each event on/off per channel)
- [ ] P12-05 — Implement browser push notifications (Web Push API + service worker)

---

## PHASE 13 — REST API + WEBHOOKS
**Goal:** Full programmatic access for integrations.

- [ ] P13-01 — Build API key management page (generate, label, revoke, last-used timestamp)
- [ ] P13-02 — Build API authentication middleware (Bearer token → ApiKey lookup)
- [ ] P13-03 — Build v1 API controllers for: tickets, replies, users, teams, assets, reports
- [ ] P13-04 — Build API rate limiting middleware (60 req/min per key)
- [ ] P13-05 — Build webhook management page (create endpoint URL, select events, test ping)
- [ ] P13-06 — Build WebhookService (fire HTTP POST on ticket events with retry logic)
- [ ] P13-07 — Run Scribe to generate API documentation at `/docs`
- [ ] P13-08 — Feature tests: API auth, CRUD endpoints, webhook firing

---

## PHASE 14 — SYSTEM SETTINGS & CUSTOMIZATION
**Goal:** Full white-label + per-installation configuration.

- [ ] P14-01 — Migration: settings table (key-value with type casting)
- [ ] P14-02 — Build Admin: General settings page (company name, logo upload, favicon)
- [ ] P14-03 — Build Admin: Color/branding customization (primary color, accent — updates CSS variables)
- [ ] P14-04 — Build Admin: Email settings page (SMTP config, sender name, sender address)
- [ ] P14-05 — Build Admin: Mailbox management (IMAP credentials, poll interval)
- [ ] P14-06 — Build Admin: Ticket settings (default priority, auto-close days, max attachment size)
- [ ] P14-07 — Build Admin: Security settings (session lifetime, force 2FA for roles, password policy)
- [ ] P14-08 — Build Admin: Data retention settings

---

## PHASE 15 — CLIENT PORTAL
**Goal:** Clean, minimal portal for clients to manage their own tickets.

- [ ] P15-01 — Build client portal layout (separate from agent layout — simpler, branded)
- [ ] P15-02 — Build client: My Tickets page (own tickets only, status filter)
- [ ] P15-03 — Build client: Submit new ticket page (simplified form with custom fields)
- [ ] P15-04 — Build client: Ticket detail page (thread view, reply form, no internal notes)
- [ ] P15-05 — Build client: Knowledge Base access from portal
- [ ] P15-06 — Build client: Account settings (name, email, password, 2FA)

---

## PHASE 16 — TESTING & QA
**Goal:** Comprehensive test coverage before deployment.

- [ ] P16-01 — Feature tests: authentication flows (login, 2FA, password reset)
- [ ] P16-02 — Feature tests: ticket lifecycle (create → reply → resolve → close → CSAT)
- [ ] P16-03 — Feature tests: SLA calculation and breach detection
- [ ] P16-04 — Feature tests: automation rule evaluation
- [ ] P16-05 — Feature tests: email integration (incoming + outgoing)
- [ ] P16-06 — Feature tests: reports and exports
- [ ] P16-07 — Feature tests: REST API all endpoints
- [ ] P16-08 — Unit tests: SLAService, ReportService, AutomationService
- [ ] P16-09 — Security tests: role/permission enforcement, API auth, file upload validation

---

## PHASE 17 — DEPLOYMENT
**Goal:** Live on cPanel production environment.

- [ ] P17-01 — Configure production `.env` (DB, SMTP, queue, APP_URL)
- [ ] P17-02 — Upload files to cPanel via FTP/SSH, set correct permissions
- [ ] P17-03 — Run migrations and seeders on production
- [ ] P17-04 — Configure cPanel cron for Laravel Scheduler
- [ ] P17-05 — Configure queue worker (cPanel background process or cron fallback)
- [ ] P17-06 — Configure IMAP polling (verify mailbox connection)
- [ ] P17-07 — Run `php artisan config:cache`, `route:cache`, `view:cache`
- [ ] P17-08 — Verify SSL certificate active
- [ ] P17-09 — Smoke test all critical paths in production

---

## CURRENT STATUS
- Phase: 0 — NOT STARTED
- Last completed task: None
- Next task: P0-01
