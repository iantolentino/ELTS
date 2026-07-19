# GLOSSARY

> Define project-specific terms here. This prevents the AI from redefining or misinterpreting domain language across sessions.
> Add entries during SYSTEM_GENERATION. Update as the project evolves.

---

| Term | Definition |
|------|------------|
| MTS | Modular Ticketing System — this project's product name (v2.0). Repo name is `ELTS`. |
| Centralized Controller | The single `index.php` front controller that handles every request and routes internally; no per-page entry points. |
| Department Isolation | Hard rule: an agent's queries are always scoped to their own `department_id`; they cannot read or write another department's tickets. |
| Burst Limiter | Rate limit allowing up to 10 ticket submissions per requestor email within a 5-minute window before cooldown kicks in. |
| Violation Tier | Escalation level in `spam_trackers.violation_tier` (0=none, 1=30min lock, 2=1hr lock, 3=24hr lock) triggered by repeated burst-limit breaches. |
| SLA Deadline | `tickets.sla_deadline` — the timestamp by which a ticket should be resolved; `is_overdue` flips true once passed. |
| `system_cache` | MySQL table acting as a 60-second TTL read-through cache for expensive aggregate queries (dashboard stats, SLA tallies). |
| "View As" Mode | Super admin feature to view an agent's dashboard exactly as that agent sees it, without needing their password. |
| Feature-Flag Command Center | Admin UI for toggling settings in the `settings` table (e.g. maintenance mode, allowed upload extensions) without editing code. |
| Mandatory Resolution Summary | Required text field an agent must fill before a ticket can transition to `closed` — flows into exports/reports. |
| Supplier Linking | Optional free-text `tickets.supplier_name` field for cross-referencing a vendor against a ticket. |
| Service Status Hub | Public banner backed by the `service_status` table, showing known outages/degradations before a requestor submits a ticket. |
| Shadcn-style (this project) | Visual/component conventions borrowed from shadcn/ui, implemented as Tailwind CSS classes in server-rendered PHP views — not the React shadcn/ui library itself (see `decisions/rejected_options.md`). |

---

## Usage Rule
If a term appears in a task or decision and is not defined here, add it before proceeding.
Ambiguous terms cause assumption errors — define early.
