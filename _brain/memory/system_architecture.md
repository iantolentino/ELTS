# SYSTEM ARCHITECTURE
> Technical blueprint for the Enterprise Support Ticketing System.

---

## STACK OVERVIEW

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Laravel | 11.x |
| Language (Backend) | PHP | 8.3 |
| Frontend Framework | React | 18.x |
| Language (Frontend) | TypeScript | 5.x |
| Full-stack Bridge | Inertia.js | 1.x |
| Database | MySQL | 8.x |
| Queue Driver | Laravel Queue (database) | — |
| Email | Laravel Mail + SMTP | — |
| Scheduler | Laravel Scheduler + cPanel Cron | — |
| File Storage | Local disk (cPanel) | — |
| Charts | Recharts | 2.x |
| PDF Export | barryvdh/laravel-dompdf | 2.x |
| Rich Text Editor | Tiptap | 2.x |
| Auth | Laravel Sanctum (web) + API tokens | — |
| 2FA | pragmarx/google2fa-laravel | — |
| Roles & Permissions | spatie/laravel-permission | 6.x |
| Activity Log | spatie/laravel-activitylog | 4.x |
| Excel Export | maatwebsite/excel | 3.x |
| IMAP (email-to-ticket) | webklex/laravel-imap | 5.x |
| API Docs | knuckleswtf/scribe | 4.x |
| Testing | Pest PHP | 2.x |

---

## ARCHITECTURAL PATTERNS

- **Repository Pattern** — all database queries go through repository interfaces
- **Service Layer** — business logic lives in Service classes, not controllers
- **Policy Classes** — all authorization via Laravel Policies
- **Form Request Classes** — all validation in dedicated Request classes
- **DTOs (Data Transfer Objects)** — typed data passing between layers
- **Jobs / Queues** — all email sending, SLA checks, scheduled reports run async
- **Events & Listeners** — ticket lifecycle events fire domain events (TicketCreated, TicketResolved, etc.)
- **Observers** — Model observers for audit logging (auto-capture all model changes)

---

## DIRECTORY STRUCTURE

```
ticketing-system/
├── app/
│   ├── Console/
│   │   └── Commands/           # Artisan commands (SLA check, email poll, etc.)
│   ├── Events/                 # Domain events (TicketCreated, SLABreached, etc.)
│   ├── Exceptions/             # Custom exception handlers
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/           # Login, register, 2FA, password reset
│   │   │   ├── Tickets/        # Ticket CRUD, replies, notes, attachments
│   │   │   ├── Users/          # User management, roles, teams
│   │   │   ├── SLA/            # SLA policies, business hours, holidays
│   │   │   ├── Automation/     # Rule builder, triggers, actions
│   │   │   ├── Reports/        # Dashboard, charts, custom reports, exports
│   │   │   ├── KnowledgeBase/  # Articles, categories, search
│   │   │   ├── Assets/         # Asset CRUD, assignment, lifecycle
│   │   │   ├── Notifications/  # In-app, email, push preferences
│   │   │   ├── Audit/          # Log viewer, export
│   │   │   ├── Settings/       # System settings, branding, mailboxes
│   │   │   └── API/            # REST API controllers (versioned: v1/)
│   │   ├── Middleware/         # Auth, role guards, API key auth, rate limiting
│   │   └── Requests/           # Form Request validation classes (one per action)
│   ├── Jobs/
│   │   ├── SendTicketEmail.php
│   │   ├── CheckSLABreaches.php
│   │   ├── ProcessIncomingEmail.php
│   │   ├── RunAutomationRules.php
│   │   ├── GenerateScheduledReport.php
│   │   └── SendCSATSurvey.php
│   ├── Listeners/              # Event listeners (log, notify, trigger automation)
│   ├── Models/
│   │   ├── User.php
│   │   ├── Team.php
│   │   ├── Department.php
│   │   ├── Ticket.php
│   │   ├── TicketReply.php
│   │   ├── TicketNote.php      # Internal note (separate from reply)
│   │   ├── TicketStatus.php    # Custom statuses
│   │   ├── TicketCategory.php
│   │   ├── TicketTag.php
│   │   ├── TicketAttachment.php
│   │   ├── TicketWatcher.php
│   │   ├── CustomField.php
│   │   ├── CustomFieldValue.php
│   │   ├── SLAPolicy.php
│   │   ├── SLARecord.php       # Per-ticket SLA tracking
│   │   ├── BusinessHour.php
│   │   ├── Holiday.php
│   │   ├── AutomationRule.php
│   │   ├── AutomationCondition.php
│   │   ├── AutomationAction.php
│   │   ├── CannedResponse.php
│   │   ├── KnowledgeArticle.php
│   │   ├── KnowledgeCategory.php
│   │   ├── Asset.php
│   │   ├── AssetAssignment.php
│   │   ├── Mailbox.php
│   │   ├── IncomingEmail.php
│   │   ├── CSATSurvey.php
│   │   ├── NPSSurvey.php
│   │   ├── AuditLog.php
│   │   ├── Notification.php
│   │   ├── ApiKey.php
│   │   ├── Webhook.php
│   │   └── Setting.php
│   ├── Observers/              # Auto audit logging on all models
│   ├── Policies/               # One policy per model
│   ├── Repositories/
│   │   ├── Contracts/          # Interfaces
│   │   └── Eloquent/           # Implementations
│   └── Services/
│       ├── TicketService.php
│       ├── SLAService.php
│       ├── AutomationService.php
│       ├── EmailService.php
│       ├── ReportService.php
│       ├── NotificationService.php
│       ├── AuditService.php
│       └── WebhookService.php
│
├── database/
│   ├── migrations/             # One migration per table, ordered
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RolesAndPermissionsSeeder.php
│       ├── DefaultStatusesSeeder.php
│       └── DemoDataSeeder.php
│
├── resources/
│   ├── js/
│   │   ├── Components/
│   │   │   ├── ui/             # Base UI: Button, Input, Modal, Badge, etc.
│   │   │   ├── tickets/        # TicketCard, TicketList, TicketForm, etc.
│   │   │   ├── charts/         # Chart wrappers around Recharts
│   │   │   ├── editor/         # Tiptap rich text editor wrapper
│   │   │   └── layout/         # Sidebar, Topbar, Breadcrumb, Notification bell
│   │   ├── Layouts/
│   │   │   ├── AppLayout.tsx   # Authenticated layout (sidebar + topbar)
│   │   │   └── AuthLayout.tsx  # Login/register layout
│   │   ├── Pages/
│   │   │   ├── Auth/           # Login, Register, ForgotPassword, 2FA
│   │   │   ├── Dashboard/      # Main KPI dashboard
│   │   │   ├── Tickets/        # Index, Show, Create, Edit
│   │   │   ├── Users/          # Index, Show, Create, Edit
│   │   │   ├── Teams/          # Team management
│   │   │   ├── SLA/            # Policies, business hours, holidays
│   │   │   ├── Automation/     # Rule builder UI
│   │   │   ├── Reports/        # Dashboard, custom builder, exports
│   │   │   ├── KnowledgeBase/  # Article list, show, editor
│   │   │   ├── Assets/         # Asset inventory, show, assign
│   │   │   ├── Settings/       # System settings, branding, mailboxes
│   │   │   ├── Audit/          # Log viewer
│   │   │   └── ClientPortal/   # Client-only ticket views
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions
│   │   └── types/              # TypeScript type definitions
│   └── views/
│       ├── app.blade.php       # Inertia root template
│       └── emails/             # Laravel Blade email templates
│
├── routes/
│   ├── web.php                 # All Inertia (web) routes
│   └── api.php                 # REST API routes (v1/)
│
├── tests/
│   ├── Feature/                # Pest feature tests (HTTP, DB)
│   └── Unit/                   # Pest unit tests (Services, Repositories)
│
└── config/
    └── ticketing.php           # App-specific config (SLA defaults, limits, etc.)
```

---

## DATABASE — KEY TABLES

| Table | Purpose |
|---|---|
| users | All users (all roles stored here, role via spatie) |
| teams | Agent teams / departments |
| tickets | Core ticket records |
| ticket_replies | Public customer-visible replies |
| ticket_notes | Internal agent-only notes |
| ticket_statuses | Custom configurable statuses |
| ticket_categories | Category tree (parent_id for subcategories) |
| ticket_tags | Tag definitions |
| ticket_tag_pivot | Many-to-many: tickets ↔ tags |
| ticket_watchers | Users watching a ticket |
| ticket_attachments | File attachment records |
| custom_fields | Field definitions per category |
| custom_field_values | Field values per ticket |
| sla_policies | SLA policy definitions |
| sla_records | Per-ticket SLA tracking (first_response_due, resolution_due, breached) |
| business_hours | Business hours per team |
| holidays | Holiday dates for SLA pausing |
| automation_rules | Rule definitions |
| automation_conditions | Conditions per rule |
| automation_actions | Actions per rule |
| canned_responses | Saved reply templates |
| knowledge_categories | KB category tree |
| knowledge_articles | KB article content |
| assets | Asset inventory |
| asset_assignments | User ↔ asset assignments |
| mailboxes | IMAP mailbox configurations |
| incoming_emails | Raw incoming email log |
| csat_surveys | CSAT survey responses |
| nps_surveys | NPS survey responses |
| audit_logs | Full system audit trail (polymorphic) |
| notifications | In-app notification queue |
| api_keys | Per-user API key records |
| webhooks | Webhook endpoint configurations |
| settings | Key-value system settings |
| jobs | Laravel queue jobs table |
| failed_jobs | Failed queue jobs |

---

## QUEUE JOBS & SCHEDULES

| Job | Trigger | Queue |
|---|---|---|
| SendTicketEmail | Event: reply created, status changed | emails |
| ProcessIncomingEmail | Schedule: every 2 min | emails |
| CheckSLABreaches | Schedule: every 5 min | sla |
| RunAutomationRules | Event: ticket created/updated | automation |
| GenerateScheduledReport | Schedule: weekly/monthly per config | reports |
| SendCSATSurvey | Event: ticket resolved (delay 1hr) | emails |

---

## API DESIGN

- Base URL: `/api/v1/`
- Auth: Bearer token (API key) via `Authorization: Bearer {key}` header
- Format: JSON (snake_case keys)
- Versioned: `/v1/` prefix on all API routes
- Rate limited: 60 requests/minute per API key
- Documented: Scribe auto-generates `/docs` endpoint

### Core API Endpoints (subset)
```
GET    /api/v1/tickets
POST   /api/v1/tickets
GET    /api/v1/tickets/{id}
PUT    /api/v1/tickets/{id}
DELETE /api/v1/tickets/{id}
POST   /api/v1/tickets/{id}/replies
POST   /api/v1/tickets/{id}/notes
GET    /api/v1/users
GET    /api/v1/reports/summary
POST   /api/v1/webhooks
GET    /api/v1/knowledge-base/articles
```

---

## SECURITY ARCHITECTURE

- All routes protected by `auth` middleware
- Role checking via `spatie/laravel-permission` + Laravel Policies
- 2FA enforced for Admin and above roles
- API keys hashed in database (SHA-256)
- All file uploads: type validation, size limit, stored outside webroot
- CSRF protection on all web forms (Inertia handles automatically)
- SQL injection: Eloquent ORM (no raw queries unless parameterized)
- XSS: Inertia/React escapes by default; Tiptap sanitizes HTML output
- Rate limiting on login (5 attempts / 15 min lockout)
- Rate limiting on API (60 req/min)
- Session: HTTPOnly cookies, configurable lifetime, force-logout capability
