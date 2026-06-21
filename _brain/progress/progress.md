# PROJECT PROGRESS
> Full task breakdown from setup to production. One task executed at a time.
> Status: [ ] = pending | [x] = done | [~] = in progress | [!] = blocked

---

## PHASE 0 — PROJECT SETUP
**Goal:** Functional skeleton with all dependencies installed and configured.

- [x] P0-01 — Install Laravel 11 via Composer, configure `.env` for MySQL
  - Installed: Laravel Framework 13.16.1 (latest stable), PHP 8.3.30, Composer 2.10.1 via Laragon
  - DB_CONNECTION=mysql, DB_DATABASE=elts_db configured in .env and .env.example
  - Note: PHP zip + fileinfo extensions enabled in Laragon php.ini
- [x] P0-02 — Install and configure Inertia.js (server-side adapter)
- [x] P0-03 — Install React 18 + TypeScript + Vite, configure tsconfig
- [x] P0-04 — Install and configure Tailwind CSS with custom design tokens (colors, fonts)
- [x] P0-05 — Install spatie/laravel-permission and publish config
- [x] P0-06 — Install spatie/laravel-activitylog and publish config
- [x] P0-07 — Install barryvdh/laravel-dompdf
  - Installed: barryvdh/laravel-dompdf v3.1.2 (dompdf/dompdf v3.1.5)
  - Config published to config/dompdf.php, enable_font_subsetting set to true
  - storage/fonts/ directory created with .gitkeep; font cache files gitignored
- [x] P0-08 — Install maatwebsite/excel
  - Installed: maatwebsite/excel v3.1.69 (phpoffice/phpspreadsheet v1.30.5)
  - Config published to config/excel.php
  - PDF driver set to DOMPDF (already installed), export properties seeded with APP_NAME
- [x] P0-09 — Install webklex/laravel-imap
  - Installed: webklex/laravel-imap v6.2.0 (webklex/php-imap v6.2.0)
  - Config published to config/imap.php; soft_fail set to true (resilient polling)
  - IMAP env keys added to .env and .env.example (IMAP_HOST, PORT, ENCRYPTION, USERNAME, PASSWORD)
- [x] P0-10 — Install pragmarx/google2fa-laravel for TOTP 2FA
  - Installed: pragmarx/google2fa-laravel v3.0.1 + pragmarx/google2fa v8.0.3
  - Also installed: bacon/bacon-qr-code v3.1.1 (SVG QR code backend)
  - Config published to config/google2fa.php; otp_secret_column → two_factor_secret, forbid_old_passwords → true
  - OTP env keys added to .env and .env.example
- [x] P0-11 — Install knuckleswtf/scribe for API docs
  - Installed: knuckleswtf/scribe v5.11.0 (dev dependency)
  - Config published to config/scribe.php
  - Auth: Bearer token enabled + default=true (all endpoints authenticated by default)
  - Example languages: bash, javascript, php, python
  - ELTS description + intro text configured; SCRIBE_AUTH_KEY env key added
- [x] P0-12 — Install Pest PHP testing framework
  - Installed: pestphp/pest v4.7.3 + pestphp/pest-plugin-laravel v4.1.0
  - phpunit downgraded one patch: 12.5.30 → 12.5.29 (required for pest v4.7.3 compatibility)
  - Created tests/Pest.php: Feature tests use TestCase + RefreshDatabase; actingAsRole() helper defined
  - Example tests converted to Pest syntax; 2/2 tests pass
- [x] P0-13 — Create base AppLayout.tsx and AuthLayout.tsx with sidebar + topbar
  - Installed: @heroicons/react (Heroicons v2 for sidebar + topbar icons)
  - Created: Layouts/AppLayout.tsx — sidebar + topbar shell, flash toast, localStorage sidebar-collapsed state
  - Created: Layouts/Sidebar.tsx — role-filtered nav groups, collapsed/expanded modes, availability dot
  - Created: Layouts/Topbar.tsx — search input, notifications bell, user dropdown (profile, security, sign out)
  - Created: Layouts/AuthLayout.tsx — centered card with logo, flash toast, copyright footer
  - Build: 601 modules, 0 errors
- [x] P0-14 — Create base UI component library: Button, Input, Modal, Badge, Dropdown, Table, Card
  - Components/UI/Button.tsx — 4 variants (primary/secondary/danger/ghost), 3 sizes, loading spinner
  - Components/UI/Input.tsx — label, error, hint, prefix/suffix icon, forwardRef
  - Components/UI/Badge.tsx — 6 variants + priority shorthand (critical/high/medium/low) with dot
  - Components/UI/Card.tsx — optional header/footer slots, padding toggle
  - Components/UI/Modal.tsx — portal, ESC key, backdrop click, body scroll lock, 4 sizes
  - Components/UI/Dropdown.tsx — outside-click close, separator support, danger items, align + width props
  - Components/UI/Table.tsx — generic <T>, sortable headers, loading/empty states, row click
  - Components/UI/index.ts — barrel export for all components
  - Build: 0 errors
- [x] P0-15 — Set up queue database tables (`php artisan queue:table`)
  - Laravel 13 default migration already includes: jobs, job_batches, failed_jobs (0001_01_01_000002)
  - Ran php artisan migrate: all 7 migrations applied successfully to elts_db
  - Tables now in DB: users, cache, jobs, job_batches, failed_jobs, permissions, roles, activity_log
  - Queue driver confirmed: database (QUEUE_CONNECTION=database in .env)
- [x] P0-16 — Configure cPanel cron job for Laravel Scheduler (every minute)
  - routes/console.php updated: activitylog:clean scheduled daily; Phase 3–7 jobs stubbed as comments
  - php artisan schedule:list confirms: activitylog:clean registered (0 0 * * *)
  - deployment.md Step 5 updated: scheduler cron + queue:work cron (--stop-when-empty --max-time=55 --tries=3)
  - new-machine-setup.md updated: queue:work added to daily workflow (terminal 3)
  - Note: cPanel cron is configured at deploy time (Phase 17) — documented, not yet active
- [x] P0-17 — Set up `config/ticketing.php` with app-wide defaults
  - Created config/ticketing.php: 8 sections — tickets, sla, email, satisfaction, security, portal, kb, pagination
  - All values env()-backed so they can be pre-configured without a DB row
  - Env keys added to .env and .env.example (ticket, SLA, CSAT/NPS, security, portal settings)
  - Verified: config('ticketing.tickets.number_prefix') = "TKT" ✓

---

## PHASE 1 — AUTHENTICATION & USER MANAGEMENT
**Goal:** All roles can log in, register (clients), and manage their accounts.

- [x] P1-01 — Create `users` table migration with all fields (name, email, password, role, availability_status, is_vip, 2fa_secret, etc.)
  - Created: 2026_06_21_100000_add_elts_fields_to_users_table.php (ALTER TABLE migration)
  - Adds 14 ELTS-specific columns: phone, avatar, job_title, timezone, locale, availability_status, is_vip, is_active, two_factor_secret, two_factor_confirmed_at, last_login_at, last_login_ip, team_id, department_id
  - Indices: availability_status, is_active, team_id, department_id
  - FK constraints for team_id/department_id deferred to P1-02 (teams/departments table not yet created)
  - User model updated: MustVerifyEmail added, all fields in $fillable, is_active + last_login_at casts added
  - Migration verified: all 22 columns present in users table
- [x] P1-02 — Create `teams` and `departments` table migrations
  - Created: 2026_06_21_110000_create_departments_table.php (name, description, is_active)
  - Created: 2026_06_21_110001_create_teams_table.php (name, description, department_id FK, is_active)
  - Created: 2026_06_21_110002_add_user_team_department_foreign_keys.php (FK constraints on users.team_id + users.department_id → nullOnDelete)
  - Models created: app/Models/Department.php, app/Models/Team.php (with relationships)
  - User model updated: team() and department() BelongsTo relationships added
  - All 3 migrations applied successfully
- [x] P1-03 — Seed roles and permissions via RolesAndPermissionsSeeder
  - Created: database/seeders/RolesAndPermissionsSeeder.php
  - 60 permissions across 10 modules: tickets(13), users(5), teams(4), departments(4), sla(4), automation(2), reports(3), kb(5), assets(5), audit(2), settings(6), canned_responses(3), notifications(2), api(2)
  - 5 roles created: super_admin(60), admin(60), supervisor(30), agent(15), client(7)
  - DatabaseSeeder updated to call RolesAndPermissionsSeeder first
  - Seeder is idempotent via firstOrCreate + syncPermissions
- [x] P1-04 — Build login page (AuthLayout, email + password form, remember me)
  - Backend: LoginRequest (validation + rate limiting using ticketing.security config), AuthService (attempt, redirectPath, logout), AuthController (showLogin, login, logout)
  - Routes: GET / and GET /login → showLogin (guest), POST /login → login (guest), POST /logout → logout (auth), GET /dashboard → placeholder (auth)
  - Frontend: Pages/Auth/Login.tsx — email field, password with show/hide toggle, remember me checkbox, forgot password link, register link
  - Pages/Dashboard/Index.tsx — placeholder for post-login redirect (real dashboard in Phase 7)
  - Build: 0 errors, 940 modules, Login-*.js 8.53 kB
- [x] P1-05 — Build client registration page with email verification
  - RegisterRequest: name/email/password/confirmation + Password::min(8)->letters()->numbers()
  - AuthService::register(): create user, assign client role, fire Registered event (triggers verification email), login
  - RegisterController: show (checks portal.registration_enabled config), store
  - VerifyEmailController: notice (redirect if already verified), verify (EmailVerificationRequest::fulfill)
  - EmailVerificationNotificationController: resend with throttle:6,1
  - Routes: GET/POST /register (guest), GET /email/verify (auth), GET /email/verify/{id}/{hash} (signed), POST /email/verification-notification (throttle), /dashboard moved behind verified middleware
  - Pages/Auth/Register.tsx: name, email, password+toggle, confirm password+toggle
  - Pages/Auth/VerifyEmail.tsx: email notice, resend button, Inertia logout
  - Build: 0 errors, 942 modules
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
- Phase: 1 — IN PROGRESS
- Last completed task: P1-05 — Build client registration page with email verification
- Next task: P1-06 — Build forgot password / reset password flow
