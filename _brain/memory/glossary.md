# GLOSSARY
> Project-specific terms used throughout the codebase and documentation.

---

| Term | Definition |
|---|---|
| **Ticket** | A support request submitted by a Client or created by an Agent on behalf of a client |
| **Reply** | A public message on a ticket visible to both agents and the client |
| **Internal Note** | A private comment on a ticket visible only to agents (hidden from client) |
| **SLA** | Service Level Agreement — a policy that defines maximum response and resolution times |
| **SLA Breach** | When a ticket exceeds its SLA time limits without being responded to or resolved |
| **SLA Pause** | Temporarily halting SLA timer when waiting for a client response |
| **CSAT** | Customer Satisfaction Score — a 1–5 star rating sent to the client after ticket resolution |
| **NPS** | Net Promoter Score — a 0–10 scale survey measuring likelihood of recommendation |
| **Canned Response** | A pre-written reply template agents can insert into a ticket with one click |
| **Ticket Status** | A configurable workflow state a ticket can be in (e.g. Open, In Progress, On Hold, Resolved, Closed) |
| **Category** | A topic classification for tickets (e.g. Billing, Technical, HR) — can have subcategories |
| **Custom Field** | An extra data field added to a ticket form, specific to a category (text, dropdown, date, etc.) |
| **Ticket Template** | A pre-filled ticket form for common request types, reducing agent/client input effort |
| **Priority** | Urgency level of a ticket: Critical / High / Medium / Low |
| **Agent** | A staff member who handles and resolves tickets |
| **Supervisor** | A senior staff member who oversees agents, reviews reports, and handles escalations |
| **Admin** | A system manager responsible for configuration, teams, and settings |
| **Super Admin** | Full system owner with access to all settings including branding and billing |
| **Client** | An end user (customer or internal requester) who submits tickets |
| **VIP Client** | A flagged client who receives higher priority handling |
| **Team** | A group of agents organized by function or department (e.g. Tier 1 Support, Billing) |
| **Department** | An organizational unit that may contain multiple teams |
| **Mailbox** | An email address configured in the system to receive incoming ticket emails |
| **Automation Rule** | A conditional logic rule: If [trigger + conditions] → Then [actions] |
| **Trigger** | An event that activates an automation rule (e.g. ticket created, status changed) |
| **Watcher** | A user subscribed to receive notifications about all activity on a ticket |
| **Assignment** | The act of linking a ticket to a specific agent or team responsible for it |
| **Escalation** | The process of raising a ticket's priority or reassigning it to a more senior agent |
| **Bulk Action** | Performing an operation (close, assign, tag) on multiple tickets simultaneously |
| **Knowledge Base** | A self-service library of articles helping clients solve problems without opening a ticket |
| **KB Article** | A single knowledge base document (public or private) |
| **Asset** | A physical or digital item tracked in the system (device, software license, equipment) |
| **Asset Assignment** | Linking an asset record to a specific user |
| **Audit Log** | A tamper-evident record of every system action — who, what, when, old value, new value |
| **API Key** | A secret token that grants programmatic access to the REST API |
| **Webhook** | An outbound HTTP POST fired to an external URL when a specific event occurs |
| **Business Hours** | The hours during which SLA timers run (e.g. Mon–Fri 9am–6pm) |
| **Holiday** | A date on which SLA timers are paused system-wide or per team |
| **Round-Robin** | An auto-assignment strategy distributing tickets evenly across available agents |
| **Skill-based Routing** | Assigning tickets to agents based on tagged skills matching ticket category |
| **Read Receipt** | A flag indicating whether the client has viewed a specific agent reply |
| **Inertia.js** | The bridge layer allowing Laravel controllers to return React page components directly |
| **Repository** | A class that abstracts database queries behind an interface |
| **Service** | A class that contains business logic, called by controllers and jobs |
| **Policy** | A Laravel class that defines authorization rules per model and action |
| **DTO** | Data Transfer Object — a typed object used to pass structured data between layers |
| **Job** | An async task queued for background processing (email send, SLA check, etc.) |
| **Observer** | A Laravel model observer that automatically logs changes to the audit trail |
