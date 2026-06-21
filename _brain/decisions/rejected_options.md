# REJECTED OPTIONS
> Technologies and approaches that were considered and rejected, with reasoning.

---

## R01 — Node.js / Express as Backend
**Rejected in favor of:** Laravel 11
**Why rejected:**
- cPanel hosting has inconsistent Node.js support — requires special configuration or VPS
- Express requires building everything from scratch (auth, queues, mail, scheduling)
- More infrastructure complexity for the same outcome
- PHP/Laravel is the native cPanel ecosystem choice

---

## R02 — NestJS as Backend
**Rejected in favor of:** Laravel 11
**Why rejected:**
- TypeScript on both ends would be ideal in theory, but NestJS on cPanel requires Node.js process management
- cPanel doesn't have native process managers (pm2/forever require SSH or VPS access)
- NestJS has a steeper setup curve for the team
- Laravel's ecosystem is more complete for this use case out of the box

---

## R03 — Next.js as Full-Stack Framework
**Rejected in favor of:** Laravel + Inertia + React
**Why rejected:**
- Next.js would replace Laravel — loses all of Laravel's mature Queue, Mail, Scheduler, RBAC ecosystem
- Server Actions in Next.js are not mature enough for complex background job processing (email polling, SLA checks)
- Would require building a custom auth system from scratch vs Laravel Sanctum
- cPanel deployment of Next.js is more complex than PHP deployment

---

## R04 — React SPA with Separate Laravel API
**Rejected in favor of:** Inertia.js (monolithic)
**Why rejected:**
- Two separate deployments (frontend on CDN, API on cPanel) increases complexity
- CORS, JWT token management, refresh tokens — all solved problems with Inertia + session auth
- Inertia gives us the SPA experience without the SPA complexity
- We still build a proper REST API (`/api/v1/`) — it's just not used for the main web app views
- Can always migrate to a separate SPA later if needed

---

## R05 — Vue.js instead of React
**Rejected in favor of:** React + TypeScript
**Why rejected:**
- React + TypeScript has a larger ecosystem and more available chart/editor libraries
- Tiptap has excellent React support
- TypeScript integration is more mature in the React ecosystem
- User preference and industry direction for enterprise frontends

---

## R06 — PostgreSQL instead of MySQL
**Rejected in favor of:** MySQL
**Why rejected:**
- cPanel provides MySQL natively — PostgreSQL requires a custom VPS setup
- MySQL 8 covers all the features we need (JSON columns, FULLTEXT search, window functions)
- No meaningful advantage for this use case on cPanel

---

## R07 — Redis for Queues (at launch)
**Rejected in favor of:** Database queue driver (for now)
**Why rejected:**
- Shared cPanel hosting doesn't include Redis
- Database queues are sufficient for the initial load
- See `decision_log.md` D04 for migration path when needed

---

## R08 — Quill.js as Rich Text Editor
**Rejected in favor of:** Tiptap
**Why rejected:**
- Quill is less actively maintained
- No first-class TypeScript support
- @mention and collaborative editing extensions are weaker
- Tiptap is more composable and headless (better Tailwind integration)

---

## R09 — Chart.js for Visualizations
**Rejected in favor of:** Recharts
**Why rejected:**
- Chart.js requires imperative DOM manipulation — awkward in React
- React wrappers (react-chartjs-2) add an abstraction layer that limits control
- Recharts is built natively for React with composable component API

---

## R10 — Laravel Filament as Admin Panel
**Rejected in favor of:** Custom React UI
**Why rejected:**
- Filament generates Livewire-based UIs — incompatible with our Inertia + React stack
- Custom UI gives us full control over UX and branding
- Filament's opinionated structure would conflict with our Repository/Service architecture
- The ticketing-specific UI requirements (ticket timeline, inline editor, activity feed) don't map well to Filament's CRUD paradigm
