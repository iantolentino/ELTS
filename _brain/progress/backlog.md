# BACKLOG
> Future improvements and nice-to-have features not in the MVP scope.
> These are NOT to be implemented unless explicitly instructed.

---

## POST-LAUNCH FEATURES

### Slack / Microsoft Teams Integration
- Full integration guide exists at `integrations/guide.md`
- Send ticket notifications to Slack channels / Teams channels
- Allow agents to reply to tickets directly from Slack/Teams
- Status: Guide ready, implementation pending instruction

### Live Chat Widget
- Embeddable chat widget for client websites
- Auto-converts chats to tickets after session ends
- Agent-side live chat panel

### AI-Powered Features
- AI ticket categorization (auto-suggest category + priority on create)
- AI-suggested canned responses (based on ticket content)
- AI-powered knowledge base article recommendations
- AI sentiment analysis on client replies (flag frustrated customers)
- AI-generated ticket summary for agents picking up a ticket

### Multi-Language Support
- Full UI localization (i18n via Laravel + React i18next)
- Per-user language preference
- Email templates per language

### Mobile App
- React Native client portal app (iOS + Android)
- Push notifications via FCM
- Agents can view and reply to tickets from mobile

### Advanced Reporting
- Cohort analysis (track client satisfaction over time)
- Predictive SLA breach forecasting
- Agent burnout detection (ticket overload alerts)
- Heatmap of ticket volume by hour/day

### Customer Portal SSO
- SAML 2.0 / OAuth2 / LDAP / Active Directory integration
- Clients log in with their company credentials

### SLA Tier Management
- Platinum / Gold / Silver customer tiers with different SLA policies
- Tier auto-assigned based on client account value or contract

### Ticket Splitting
- Split one ticket into multiple child tickets
- Useful when a single ticket contains multiple unrelated issues

### Merge Request Approval
- Require supervisor approval before two tickets are merged

### Advanced Webhook Retry
- Automatic retry with exponential backoff on failed webhook deliveries
- Webhook delivery log with status per event

### White-Label SaaS Mode
- Multi-tenant architecture (one installation, multiple companies)
- Subdomain per tenant (company.yourdomain.com)
- Separate branding, data, and settings per tenant

### Time Tracking
- Agents log time spent per ticket
- Time reports per agent / project
- Billable vs non-billable time

### Email Scheduling
- Schedule a reply to send at a future date/time
- Useful for time-zone management

### Dark Mode
- Full dark mode UI toggle per user preference
