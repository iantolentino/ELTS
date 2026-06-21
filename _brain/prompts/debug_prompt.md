# DEBUG PROMPT
> Use when something is broken and needs investigation.

---

## PROMPT TO SEND CLAUDE (copy-paste and fill in the blank)

```
Read _brain/summaries/current_state.md and _brain/memory/system_architecture.md.

There is a bug: [DESCRIBE THE BUG HERE]

Steps to reproduce: [LIST STEPS]
Expected behavior: [WHAT SHOULD HAPPEN]
Actual behavior: [WHAT IS HAPPENING]
Error message (if any): [PASTE ERROR]

Investigate and fix the bug.
Do NOT refactor surrounding code.
Do NOT add features.
Only fix the specific bug described.
After fixing, describe what caused it and what was changed.
```

---

## DEBUGGING PROCESS CLAUDE SHOULD FOLLOW

1. Read the error message / stack trace
2. Identify the file and line number
3. Check the relevant Service, Repository, Controller, or Component
4. Check if the issue is in the data layer (migration, relationship) or logic layer (service) or presentation layer (React page)
5. Fix only the root cause
6. Do not break other features

---

## COMMON BUG CATEGORIES

| Category | Where to look |
|---|---|
| 500 server error | Laravel logs: `storage/logs/laravel.log` |
| Auth/permission error | Policy class, middleware, spatie permissions |
| Email not sending | Queue jobs, SendTicketEmail, SMTP config, mail log |
| IMAP not polling | webklex config, ProcessIncomingEmail job, cron |
| SLA not calculating | SLAService, business_hours table, holidays table |
| Chart not rendering | Recharts component, ReportService data shape |
| File upload failing | Validation rules, storage config, disk permissions |
| Inertia page error | Check Inertia shared props, usePage(), controller return |
| TypeScript error | Check prop types, API response interface definitions |
| Queue job failing | `failed_jobs` table, job `failed()` method |
