# SKILLS & TECH STACK
> Complete reference for all technologies used in this project.

---

## BACKEND

### Laravel 11 (PHP 8.3)
- **Role:** Core application framework
- **Key features used:** Routing, Eloquent ORM, Queues, Mail, Scheduler, Events, Policies, Middleware, Artisan Commands
- **Install:** `composer create-project laravel/laravel ticketing-system`

### Composer Packages

| Package | Version | Purpose |
|---|---|---|
| `spatie/laravel-permission` | ^6.0 | RBAC — roles and granular permissions |
| `spatie/laravel-activitylog` | ^4.0 | Automatic audit trail on all models |
| `barryvdh/laravel-dompdf` | ^2.0 | Server-side PDF generation for reports |
| `maatwebsite/excel` | ^3.1 | Excel and CSV export |
| `webklex/laravel-imap` | ^5.0 | IMAP email polling (incoming email → tickets) |
| `pragmarx/google2fa-laravel` | ^2.0 | TOTP-based 2FA (Google Authenticator) |
| `knuckleswtf/scribe` | ^4.0 | Auto-generate REST API documentation |
| `pestphp/pest` | ^2.0 | Expressive testing framework (on top of PHPUnit) |
| `laravel/sanctum` | ^4.0 | API token authentication (included in Laravel 11) |

---

## FRONTEND

### React 18 + TypeScript 5
- **Role:** UI layer
- **Key features used:** Hooks, Context, TypeScript strict mode, component composition

### NPM Packages

| Package | Version | Purpose |
|---|---|---|
| `@inertiajs/react` | ^1.0 | Connects React pages to Laravel controllers |
| `tailwindcss` | ^3.4 | Utility-first CSS framework |
| `@headlessui/react` | ^2.0 | Accessible UI primitives (Modal, Dropdown, Combobox) |
| `@heroicons/react` | ^2.0 | Icon set (consistent with Tailwind) |
| `recharts` | ^2.12 | Charts and graphs |
| `@tiptap/react` | ^2.4 | Rich text editor (WYSIWYG) |
| `@tiptap/extension-mention` | ^2.4 | @mention support in Tiptap |
| `@tiptap/starter-kit` | ^2.4 | Tiptap core extensions bundle |
| `react-dropzone` | ^14.0 | File drag-and-drop upload |
| `date-fns` | ^3.0 | Date formatting and calculation |
| `axios` | ^1.7 | HTTP client (for API calls only — not Inertia views) |

### Vite
- **Role:** Asset bundler + dev server
- **Config:** `vite.config.ts` with Laravel Vite plugin

---

## BRIDGE

### Inertia.js v1
- **Role:** Full-stack bridge — Laravel returns React components, no REST needed for web
- **Server adapter:** `inertiajs/inertia-laravel`
- **Client adapter:** `@inertiajs/react`
- **Key concepts:** Pages, `useForm`, `router.visit`, `usePage`, shared props

---

## DATABASE

### MySQL 8.x
- **Role:** Primary data store
- **Features used:** Foreign keys, FULLTEXT indexes (KB search), JSON columns (custom field metadata)
- **Access:** cPanel phpMyAdmin + Laravel Eloquent ORM

---

## INFRASTRUCTURE (cPanel)

| Service | cPanel Feature |
|---|---|
| PHP 8.3 | MultiPHP Manager |
| MySQL 8.x | MySQL Databases |
| SMTP (outgoing mail) | Email Accounts → SMTP or external SMTP |
| IMAP (incoming mail) | Email Accounts → IMAP |
| Cron Jobs | Cron Jobs → `php artisan schedule:run` every minute |
| Queue Worker | Cron fallback: `php artisan queue:work --stop-when-empty` every minute |
| File Storage | cPanel File Manager / FTP |
| SSL | Let's Encrypt via cPanel SSL/TLS |

---

## DESIGN TOKENS

```css
/* Primary */
--color-primary: #4F46E5;       /* Indigo 600 */
--color-primary-hover: #4338CA; /* Indigo 700 */

/* Accent / Success */
--color-success: #10B981;       /* Emerald 500 */

/* Warning (SLA near-breach) */
--color-warning: #F59E0B;       /* Amber 500 */

/* Danger (SLA breached, critical) */
--color-danger: #F43F5E;        /* Rose 500 */

/* Neutral */
--color-bg: #F8FAFC;            /* Slate 50 */
--color-sidebar: #FFFFFF;
--color-border: #E2E8F0;        /* Slate 200 */
--color-text-primary: #0F172A;  /* Slate 900 */
--color-text-muted: #64748B;    /* Slate 500 */

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;
```

---

## CODING STANDARDS

### PHP
- PSR-12 style
- PHP 8.3 features: enums, readonly properties, match expressions, named arguments, fiber (queue)
- Strict types: `declare(strict_types=1)` in all files

### TypeScript
- `strict: true` in tsconfig
- No `any` — use `unknown` + type guard if needed
- Interface for all props and API response shapes
- Tailwind for all styling — no CSS modules or inline styles
