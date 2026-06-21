# DECISION LOG
> All significant architectural and technology decisions with reasoning.

---

## D01 — Laravel 11 as Backend Framework
**Date:** 2026-06-21
**Decision:** Use Laravel 11 (PHP 8.3) as the backend framework.
**Reasoning:**
- cPanel hosting is PHP-native — Laravel runs without any special server configuration
- Laravel has mature built-in solutions for everything this system needs: Queues, Mail, Scheduler, Auth, Sanctum (API), Events, Observers
- spatie/* package ecosystem covers permissions, activity logging out of the box
- Senior-level patterns (Repository, Service, Policy, Events) are well-established in Laravel
- Large community — easy to hire for, well-documented

**Rejected alternatives:** See `rejected_options.md` → R01, R02

---

## D02 — React + TypeScript via Inertia.js
**Date:** 2026-06-21
**Decision:** Use React 18 + TypeScript connected to Laravel via Inertia.js (not a separate SPA with a REST API).
**Reasoning:**
- Inertia eliminates the need to maintain a separate React app with its own API layer for web views
- Authentication, session, CSRF protection all handled by Laravel — no JWT complexity
- Server-side routing stays in Laravel (`routes/web.php`) — no duplicate routing in React Router
- TypeScript adds type safety on the frontend without slowing down development
- Full REST API still built separately for third-party integrations (best of both worlds)

**Rejected alternatives:** See `rejected_options.md` → R03, R04

---

## D03 — MySQL as Database
**Date:** 2026-06-21
**Decision:** Use MySQL 8.x as the database.
**Reasoning:**
- cPanel provides MySQL natively with phpMyAdmin — zero additional setup
- MySQL 8 supports FULLTEXT search (used for Knowledge Base article search)
- JSON columns available for flexible custom field value storage
- Mature, well-understood, easy to back up via cPanel

---

## D04 — Database Queue Driver (not Redis)
**Date:** 2026-06-21
**Decision:** Use Laravel's database queue driver instead of Redis.
**Reasoning:**
- Shared cPanel hosting typically does not provide Redis
- Database queue is sufficient for this load profile at launch
- Easy migration path to Redis later if scaling demands it (just change `QUEUE_CONNECTION=redis` in `.env`)
- Failed jobs tracked in `failed_jobs` table — visible without additional tooling

**Future:** Migrate to Redis if ticket volume exceeds ~500 tickets/day.

---

## D05 — spatie/laravel-permission for RBAC
**Date:** 2026-06-21
**Decision:** Use `spatie/laravel-permission` for roles and permissions.
**Reasoning:**
- Industry standard for Laravel RBAC
- Supports both role-based and permission-based control
- Gate integration works seamlessly with Laravel Policies
- Database-driven — permissions editable at runtime without code deploys

---

## D06 — spatie/laravel-activitylog for Audit Trail
**Date:** 2026-06-21
**Decision:** Use `spatie/laravel-activitylog` via Model Observers for audit logging.
**Reasoning:**
- Automatic diff capture — logs old and new values on every model change
- Polymorphic — one `activity_log` table covers all models
- Zero boilerplate in controllers or services — Observers handle everything automatically
- Queryable and exportable via Eloquent

---

## D07 — Tiptap as Rich Text Editor
**Date:** 2026-06-21
**Decision:** Use Tiptap 2 as the WYSIWYG editor for ticket replies, notes, and KB articles.
**Reasoning:**
- Headless — fully controllable with Tailwind styling
- Excellent React support
- Built-in extensions: @mention, file attachment, code blocks, lists, links
- Outputs clean HTML that can be stored and rendered safely
- Active development and good documentation

---

## D08 — Recharts for Data Visualization
**Date:** 2026-06-21
**Decision:** Use Recharts for all charts and graphs.
**Reasoning:**
- React-native (no jQuery or vanilla JS wrapper)
- Composable component API matches the React mental model
- Supports all required chart types: Line, Bar, Pie, Donut, Radar, Gauge (via custom)
- Responsive out of the box
- Lightweight — no bloat

---

## D09 — DomPDF for PDF Generation
**Date:** 2026-06-21
**Decision:** Use `barryvdh/laravel-dompdf` for server-side PDF export of reports.
**Reasoning:**
- Pure PHP — works on any cPanel server without wkhtmltopdf or headless Chrome
- Laravel Blade templates → PDF with full control over layout
- Sufficient quality for business reports

---

## D10 — Webklex/laravel-imap for Email Ingestion
**Date:** 2026-06-21
**Decision:** Use `webklex/laravel-imap` for polling incoming email mailboxes.
**Reasoning:**
- Pure PHP IMAP client — no server extensions required
- Works with any IMAP server (cPanel Mail, Gmail, Office 365, etc.)
- Supports attachment extraction, reply thread parsing
- Scheduled polling every 2 minutes via Laravel Scheduler

---

## D11 — Scribe for API Documentation
**Date:** 2026-06-21
**Decision:** Use `knuckleswtf/scribe` for auto-generating REST API documentation.
**Reasoning:**
- Generates documentation from code annotations — stays in sync automatically
- Outputs interactive HTML docs at `/docs`
- Supports API key auth docs, request/response examples
- Free and Laravel-native

---

## D12 — Pest PHP for Testing
**Date:** 2026-06-21
**Decision:** Use Pest PHP instead of PHPUnit directly.
**Reasoning:**
- Cleaner, more expressive syntax — higher test readability
- Built on top of PHPUnit — full compatibility
- Plugin ecosystem (architecture, coverage, etc.)
- Increasingly the Laravel community standard
