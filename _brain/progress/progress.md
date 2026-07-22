# PROGRESS

> The AI reads this file at the start of every EXECUTION_MODE session.
> Update after every completed or blocked task.

---

## Active Task
> None — T067 complete. **Phase 12 (Dashboard Analytics & Reporting, T055–T065) and the T066/T067
> pair (requester name-from-email, SSO deployment groundwork) are all complete.** Deploy
> (Phase 9: T038 finalize config docs, T039 cPanel verification pass) is the only MVP work left
> besides the still-BLOCKED T040. Select from `backlog.md`.

---

## In Progress
| ID   | Task                  | Blocker        |
|------|-----------------------|----------------|
|      |                       |                |

---

## Completed
| ID   | Task                                              | Date Completed |
|------|-----------------------------------------------------|----------------|
| T001 | Archive legacy SQLite prototype, clean project root | 2026-07-19     |
| T002 | `config.php` — DB credentials, feature flags, upload allow-list | 2026-07-19 |
| T003 | `db.php` — PDO connection + prepared-statement query helpers | 2026-07-19 |
| T004 | `.htaccess` — clean URLs, no directory listing, gzip | 2026-07-19 |
| T005 | `/private/migration-command.php` — schema/connectivity check | 2026-07-19 |
| T006 | Centralized `index.php` router | 2026-07-19 |
| T007 | Login/logout + session auth + password hashing | 2026-07-19 |
| T008 | Department-isolation enforcement | 2026-07-19 |
| T009 | Public ticket submission form | 2026-07-19 |
| T010 | Public ticket status lookup | 2026-07-19 |
| T011 | Paginated department dashboard | 2026-07-19 |
| T012 | Ticket detail view | 2026-07-19 |
| T013 | Status transitions + `status_history` logging | 2026-07-19 |
| T014 | Mandatory resolution summary gate | 2026-07-19 |
| T015 | Ticket reassignment | 2026-07-19 |
| T016 | Internal notes | 2026-07-19 |
| T017 | File attachment upload/download | 2026-07-19 |
| T018 | `system_cache` read/write helper (60s TTL) | 2026-07-19 |
| T019 | Cached dashboard stats / SLA tallies | 2026-07-19 |
| T020 | SLA deadline calculation + `is_overdue` flagging | 2026-07-19 |
| T021 | Burst limiter (`spam_trackers`, 10/5min) | 2026-07-19 |
| T022 | Escalating cooldown (30m→1h→24h) | 2026-07-19 |
| T023 | Service Status Hub | 2026-07-19 |
| T024 | Super admin dashboard | 2026-07-19 |
| T025 | "View As" mode | 2026-07-19 |
| T026 | Feature-flag command center | 2026-07-19 |
| T027 | Destructive-action confirmation modals | 2026-07-19 |
| T028 | Department CRUD | 2026-07-19 |
| T029 | User/agent CRUD | 2026-07-19 |
| T030 | Central audit log helper (`audit.php` → `writeAuditLog()`) | 2026-07-20 |
| T031 | Audit trail viewer on ticket detail | 2026-07-20 |
| T032 | CSV export (super admin, filterable) | 2026-07-20 |
| T033 | Print/PDF report export (injects resolution summary) | 2026-07-20 |
| T034 | Knowledge base CRUD (per department + admin) | 2026-07-20 |
| T035 | CSRF protection sweep (app-wide, centralized) | 2026-07-20 |
| T036 | Input validation/sanitization sweep (found + fixed F003) | 2026-07-20 |
| T037 | Session hardening (idle timeout, SameSite, secure flag) | 2026-07-20 |
| T041 | Left sidebar navigation (agent + admin, Trackr design port) | 2026-07-20 |
| T042 | Public portal redesign (department-picker card grid + search) | 2026-07-20 |
| T043 | Dark/light theme toggle | 2026-07-20 |
| T044 | Per-department FAQ items | 2026-07-21 |
| T045 | Configurable Request Types with dynamic custom fields | 2026-07-21 |
| T046 | Threaded ticket comments (requester + agent) | 2026-07-21 |
| T047 | Requester self-service accounts ("My Requests") | 2026-07-21 |
| T048 | Free-form ticket tags | 2026-07-21 |
| T049 | Atomic ticket claim + new `in_progress` status | 2026-07-21 |
| T050 | Agent presence (passive) | 2026-07-21 |
| T051 | Per-department auto-assignment (least-loaded agent) | 2026-07-21 |
| T052 | Public FAQ search on the landing page | 2026-07-21 |
| T053 | Optional budget/cost field on public submission form | 2026-07-21 |
| T054 | Multi-department tickets (full shared ownership) | 2026-07-21 |
| T055 | Shared `analytics.php` — stat-card math (Resolved/Critical/SLA×4) | 2026-07-21 |
| T056 | Tickets Created chart (7D/30D/3M/6M/custom date-range picker) | 2026-07-21 |
| T057 | By Status pie chart | 2026-07-21 |
| T058 | By Priority bar chart | 2026-07-21 |
| T059 | Recent Tickets / latest-activity panel | 2026-07-21 |
| T060 | Superadmin cross-department "All Tickets" dashboard + filters | 2026-07-21 |
| T061 | Department dashboard free-form filtering | 2026-07-21 |
| T062 | Admin Reports section gains the 6 stat cards | 2026-07-21 |
| T063 | Per-department "Report" sidebar tab | 2026-07-21 |
| T064 | `departments.description` (superadmin-editable, shown on portal) | 2026-07-21 |
| T065 | Per-agent KPI table ("Team KPIs"), superadmin-only | 2026-07-21 |
| T066 | Requester display name derived from email local-part | 2026-07-21 |
| T067 | SSO deployment-only groundwork (config flag, allow-list, hook) | 2026-07-21 |

---

## Blocked
| ID   | Task                                        | Reason                                              |
|------|-----------------------------------------------|------------------------------------------------------|
| T040 | Connect to ELTS repo, wipe remote, push        | Requires fresh explicit user confirmation at execution time — see `decisions/decision_log.md` [DEPLOY] |

---

Last updated: 2026-07-21 (T067)
Current phase: MVP
