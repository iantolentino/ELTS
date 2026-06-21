# ACTUAL TIMELINE
> Optimized AI-assisted development plan. Internal use only.
> Based on: Senior-level engineering, enterprise scope, AI-assisted development speed.

---

## SUMMARY

| Phase | Description | Duration |
|---|---|---|
| Phase 0 | Project Setup | 1–2 days |
| Phase 1 | Auth & User Management | 3–4 days |
| Phase 2 | Ticket Core | 5–6 days |
| Phase 3 | Email Integration | 2–3 days |
| Phase 4 | SLA Management | 2–3 days |
| Phase 5 | Automation & Workflows | 3–4 days |
| Phase 6 | Canned Responses | 1 day |
| Phase 7 | Reports & Analytics | 4–5 days |
| Phase 8 | Knowledge Base | 2–3 days |
| Phase 9 | CSAT + NPS | 1–2 days |
| Phase 10 | Asset Management | 2–3 days |
| Phase 11 | Audit Logs | 1–2 days |
| Phase 12 | Notifications | 2–3 days |
| Phase 13 | REST API + Webhooks | 2–3 days |
| Phase 14 | System Settings | 2–3 days |
| Phase 15 | Client Portal | 2–3 days |
| Phase 16 | Testing & QA | 3–5 days |
| Phase 17 | Deployment | 1–2 days |
| **TOTAL** | | **~8–10 weeks** |

---

## WEEK-BY-WEEK BREAKDOWN

### Week 1 — Foundation
**Days 1–2:** Phase 0 — Project Setup
- Laravel 11 install, Inertia + React + TypeScript configured
- Tailwind CSS with design tokens
- All Composer + NPM packages installed
- Base layouts (AppLayout, AuthLayout) and UI component library

**Days 3–5:** Phase 1 — Auth & User Management (start)
- Database migrations for users, teams, departments
- Roles and permissions seeded
- Login, register, forgot password flows
- 2FA setup and challenge flows

**Days 6–7:** Phase 1 continued
- User management pages (list, create, edit)
- Team and department management
- Role permissions editor
- Login history and session management

---

### Week 2 — Ticket Core
**Days 1–3:** Phase 2 — Ticket Core (Part 1)
- All ticket-related migrations
- TicketService with CRUD
- Ticket index page with filters, search, sort
- Ticket show page with thread view
- Ticket create form with custom fields

**Days 4–7:** Phase 2 — Ticket Core (Part 2)
- Reply and internal note forms (Tiptap)
- Status, priority, assignment controls
- Tag management, bulk actions, ticket merging
- Custom status/category/field management in Admin
- File attachment upload
- Activity timeline component

---

### Week 3 — Email + SLA
**Days 1–3:** Phase 3 — Email Integration
- Mailbox model and IMAP polling service
- ProcessIncomingEmail job
- Outgoing email templates and jobs
- Mailbox management page

**Days 4–7:** Phase 4 — SLA Management
- SLA migrations and SLAService
- SLA tracking on ticket (breach alerts)
- SLA pause/resume
- Business hours and holiday calendar management
- SLA policy management UI

---

### Week 4 — Automation + Canned Responses
**Days 1–4:** Phase 5 — Automation & Workflows
- AutomationService with rule evaluation
- RunAutomationRules job
- All action handlers
- Rule builder UI (visual if/then editor)
- Round-robin and skill-based assignment

**Days 5–5:** Phase 6 — Canned Responses
- Canned response CRUD
- Selector in Tiptap editor
- Variable substitution

**Days 6–7:** Buffer / catch-up / polish

---

### Week 5 — Reports & Analytics
**Days 1–5:** Phase 7 — Reports & Analytics
- ReportService with all metric methods
- Executive dashboard with KPI cards
- Ticket volume, SLA, agent performance charts
- Custom report builder UI
- PDF and Excel/CSV export
- Scheduled report configuration and job

**Days 6–7:** Phase 8 — Knowledge Base (start)
- KB migrations
- Public index and article view pages

---

### Week 6 — KB + CSAT + Assets
**Days 1–2:** Phase 8 — Knowledge Base (finish)
- Admin article editor and category management
- Full-text search
- Suggested articles on ticket create

**Days 3–4:** Phase 9 — CSAT + NPS
- Survey jobs and token-based response pages
- Dashboard integration

**Days 5–7:** Phase 10 — Asset Management
- Asset CRUD, assignment, ticket linking
- Lifecycle tracking

---

### Week 7 — Audit + Notifications + API
**Days 1–2:** Phase 11 — Audit Logs
- Activity log configuration on all models
- Audit log viewer and export

**Days 3–4:** Phase 12 — Notifications
- In-app notification center
- Notification wiring for all events
- Notification preferences page

**Days 5–7:** Phase 13 — REST API + Webhooks
- API key management
- v1 API controllers
- Webhook configuration and WebhookService
- Scribe API documentation

---

### Week 8 — Settings + Client Portal
**Days 1–3:** Phase 14 — System Settings
- General settings (branding, logo)
- Email settings, mailbox management
- Security and retention settings

**Days 4–7:** Phase 15 — Client Portal
- Client-only layout and pages
- My tickets, submit ticket, ticket detail
- KB access from portal

---

### Weeks 9–10 — QA + Deployment
**Days 1–5:** Phase 16 — Testing & QA
- Feature tests: all critical flows
- Unit tests: all services
- Security tests: RBAC, API auth, uploads

**Days 6–7:** Phase 17 — Deployment
- Production .env setup
- cPanel upload, migration, cron configuration
- Smoke testing all paths in production

---

## NOTES
- Timeline assumes AI-assisted development with uninterrupted work sessions
- Complex UI tasks (automation rule builder, custom report builder) may need an extra day
- Email integration complexity depends on hosting provider's IMAP reliability
- Testing phase can be parallelized with feature development (write tests alongside features)
