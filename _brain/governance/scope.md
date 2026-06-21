# SCOPE
> Defines what is IN scope and OUT of scope for this project.

---

## IN SCOPE (must be built)

### Core System
- All 13 modules defined in `memory/app_context.md`
- Laravel 11 + React + TypeScript + Inertia.js + MySQL
- cPanel deployment

### Features
- Full ticket lifecycle management
- Email integration (incoming + outgoing)
- SLA management with business hours and holidays
- Automation rule engine
- Reports, analytics, and exports (PDF, Excel, CSV)
- Knowledge Base / Help Center
- CSAT + NPS surveys
- Asset management (optional module)
- Full audit trail
- REST API + Webhooks
- Client portal
- System customization (branding, statuses, fields, roles)
- 2FA authentication
- In-app, email, and browser push notifications

---

## OUT OF SCOPE (not to be built without explicit instruction)

### From Backlog (build later)
- Slack / Microsoft Teams live integration (guide.md exists, not implementation)
- Live chat widget
- AI-powered features (auto-categorization, suggested responses, sentiment)
- Multi-language / i18n
- Mobile app (React Native)
- Advanced cohort analytics
- Customer portal SSO (SAML, LDAP, OAuth)
- SLA customer tier management
- Ticket splitting
- White-label SaaS multi-tenancy
- Time tracking module
- Email scheduling (send-later)
- Dark mode

### Never in scope (out of domain)
- Billing / payment processing
- CRM (customer relationship management beyond ticket context)
- Project management (Gantt charts, sprints)
- HR management
- Inventory purchasing / procurement

---

## SCOPE CHANGE PROCESS

1. User requests a new feature or change
2. Claude evaluates: is it a minor addition or a scope change?
3. If minor (e.g. add a new filter field): implement as a subtask of the relevant phase
4. If major (new module or architectural change): return to CONFIRMATION_LOCK for that area
5. Log the change in `decisions/decision_log.md`
6. Update `progress/progress.md` with new tasks if needed
