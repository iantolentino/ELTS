# APPLICATION CONTEXT
> Source of truth for what this system is and what it does.

## System Name
Enterprise Support Ticketing System

## System Type
Web Application — Internal staff-facing + Client portal

## Domain
Customer Support / IT Helpdesk / Enterprise Operations

## Engineering Level
Senior-level — Repository pattern, Service layer, Policy classes, typed DTOs

## Scale
Enterprise — designed for multi-team, multi-department, high-volume usage

## Security
Strict — 2FA (TOTP), RBAC, full audit trail, session management, input sanitization

---

## TARGET USERS

| Role | Access Level | Description |
|---|---|---|
| Super Admin | Full | System config, branding, roles, all data, billing |
| Admin | High | Agents, teams, SLAs, automation, reports, settings |
| Supervisor | Medium-High | Team oversight, reports, escalations, ticket management |
| Agent | Medium | Ticket handling, replies, internal notes, canned responses |
| Client (End User) | Low | Submit tickets, view own tickets, use Knowledge Base |

---

## MODULES

### M01 — Core Ticket Management
- Create / update / close / delete tickets
- Priority: Critical / High / Medium / Low
- Custom ticket statuses (fully configurable workflow)
- Categories & subcategories (customizable)
- Custom fields per category (text, dropdown, date, checkbox, number)
- Ticket templates for common request types
- Parent-child ticket relationships
- Ticket merging (combine duplicates)
- Bulk actions: assign, close, tag, delete, change priority
- SLA tracking per ticket with breach warnings
- Ticket due dates and reminders
- Tags and labels
- Ticket watchers / subscribers

### M02 — Email Integration
- Incoming email → auto-creates ticket (mailbox polling via IMAP)
- Email reply → updates ticket thread
- Outgoing notifications for: open, update, resolved, closed events
- CC / BCC per ticket
- Custom HTML email templates per event type
- Multiple mailbox support (support@, billing@, hr@, etc.)
- Email bounce and failure detection + logging

### M03 — User & Role Management
- Roles: Super Admin / Admin / Supervisor / Agent / Client
- Granular permission control per role
- Team / Department management
- Agent availability status: Online / Busy / Away / Offline
- Agent workload visibility (count of open assigned tickets)
- Client portal (customers see own tickets only)
- VIP / priority customer flagging
- Two-Factor Authentication (TOTP — Google Authenticator compatible)
- Login history with IP addresses
- Session management (force logout, active sessions list)

### M04 — Communication & Collaboration
- Public replies (visible to customer)
- Internal notes (agents only — hidden from customer)
- @mention agents inside ticket threads
- Canned responses (saved quick-reply templates per team/global)
- Rich text editor (WYSIWYG — Tiptap)
- File attachments (images, PDFs, documents — size limits configurable)
- Full ticket activity timeline (every change logged with diff)
- Read receipts (track if customer viewed a reply)

### M05 — Automation & Workflows
- Rule-based automation engine: If [trigger + conditions] → Then [actions]
- Triggers: ticket created, updated, status changed, time-based
- Actions: assign, tag, change priority, send notification, escalate, close
- Auto-assignment strategies: round-robin / skill-based / team-based
- Business hours configuration per team
- Holiday calendar (SLA pauses on holidays)
- Auto-close stale resolved tickets after configurable days
- Auto-tagging rules

### M06 — SLA Management
- Multiple SLA policies (by priority, customer tier, department)
- Business-hours-based SLA time calculation
- SLA breach alerts (in-app + email — configurable thresholds)
- SLA pause / resume (waiting on customer response)
- SLA compliance reporting by agent / team / period

### M07 — Reports & Analytics
- Executive dashboard with live KPIs
- Ticket volume trends (daily / weekly / monthly)
- First response time and average resolution time
- SLA compliance rate
- Agent performance scorecards
- Team / department comparison
- Custom report builder (choose metrics + filters + date range)
- Scheduled reports (auto-email PDF on schedule)
- Export: PDF / Excel / CSV
- Chart types: line, bar, pie, donut, heatmap, gauge

### M08 — Knowledge Base / Help Center
- Article editor with categories (rich text — Tiptap)
- Public articles (visible without login)
- Private articles (internal agent-only guides)
- Full-text article search
- Suggested articles when customer opens a ticket (keyword match)
- Article feedback: helpful / not helpful ratings

### M09 — Customer Satisfaction
- CSAT survey auto-sent on ticket close (1–5 stars + optional comment)
- NPS (Net Promoter Score) periodic survey (0–10 scale)
- CSAT / NPS scores per agent / team / time period on dashboard
- Satisfaction trends chart

### M10 — Asset Management (Optional Module)
- Asset inventory (devices, software licenses, equipment)
- Asset assignment to specific users
- Asset-linked tickets (attach asset record to a ticket)
- Asset lifecycle tracking: purchased → in-use → maintenance → retired

### M11 — Audit Logs & Compliance
- Full system audit trail: who, what changed, from value, to value, when
- Agent activity logs
- Login / logout history with IP and user-agent
- Ticket change history (full diff view per field)
- Data retention policy settings (configurable per data type)
- Exportable logs: CSV / PDF

### M12 — Notifications
- In-app notification center (bell icon with unread count)
- Email notifications (configurable per event type per user)
- Browser push notifications
- SLA breach alerts
- @mention alerts
- Assignment alerts

### M13 — REST API + Webhooks
- Full REST API (CRUD on all primary entities)
- API key management: generate, revoke, list per user
- Webhook support: fire events to external URLs on ticket lifecycle events
- API documentation (auto-generated via Scribe or Swagger)
- See `integrations/guide.md` for future Slack / Teams integration

---

## DESIGN SYSTEM

| Property | Value |
|---|---|
| Style | Modern Corporate — clean, professional, data-dense |
| Inspiration | Linear.app sidebar navigation + Zendesk ticket layout |
| Primary Color | Deep Indigo (#4F46E5) |
| Accent Color | Emerald (#10B981) for success / resolved states |
| Danger Color | Rose (#F43F5E) for critical / breach states |
| Warning Color | Amber (#F59E0B) for SLA warnings |
| Background | Slate (#F8FAFC) light mode |
| Sidebar | White with subtle border, collapsible |
| Typography | Inter (system font stack fallback) |
| White-label | Logo, company name, colors all configurable per installation |
