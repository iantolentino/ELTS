# ENVIRONMENTS
> Configuration differences between local development and production.

---

## LOCAL DEVELOPMENT

| Setting | Value |
|---|---|
| APP_ENV | local |
| APP_DEBUG | true |
| DB | MySQL (local XAMPP / Laragon / DBngin) |
| QUEUE_CONNECTION | sync (no background jobs — runs inline) |
| MAIL_MAILER | log (emails written to `storage/logs/laravel.log`) |
| CACHE_STORE | file |
| SESSION_DRIVER | file |
| Scheduler | Run manually: `php artisan schedule:run` |
| Queue | Not needed with `sync` driver |
| Assets | `npm run dev` (Vite hot reload) |

### Local Setup Commands
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm install
npm run dev
php artisan serve
```

### Test Mailbox (local)
- Use Mailpit (`mailpit.axllent.org`) or Mailtrap for local SMTP testing
- Set `MAIL_MAILER=smtp` + Mailpit credentials in `.env`
- Or use `MAIL_MAILER=log` to see emails in `storage/logs/laravel.log`

---

## STAGING (Optional — recommended before production push)

| Setting | Value |
|---|---|
| APP_ENV | staging |
| APP_DEBUG | false |
| DB | Separate MySQL database (not production DB) |
| QUEUE_CONNECTION | database |
| MAIL_MAILER | smtp (real SMTP but separate from-address) |
| Domain | staging.tickets.yourdomain.com |

- Same cPanel deployment process as production
- Use with real but test data
- Verify before every production deploy

---

## PRODUCTION

| Setting | Value |
|---|---|
| APP_ENV | production |
| APP_DEBUG | false |
| DB | Production MySQL |
| QUEUE_CONNECTION | database |
| MAIL_MAILER | smtp |
| CACHE_STORE | file |
| SESSION_DRIVER | file |
| Assets | Pre-built (`npm run build` run locally, `public/build/` uploaded) |

---

## ENVIRONMENT VARIABLE REFERENCE

```env
# Core
APP_NAME=
APP_ENV=               # local | staging | production
APP_KEY=               # php artisan key:generate
APP_DEBUG=             # true (local only) | false (staging, production)
APP_URL=               # https://tickets.yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

# Queue
QUEUE_CONNECTION=      # sync (local) | database (staging/production)

# Mail
MAIL_MAILER=           # log (local) | smtp (staging/production)
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=

# Session
SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=  # false (local) | true (production — requires HTTPS)

# Cache
CACHE_STORE=file

# Ticketing-specific
IMAP_HOST=
IMAP_PORT=993
IMAP_ENCRYPTION=ssl
IMAP_USERNAME=
IMAP_PASSWORD=

# API (optional)
API_RATE_LIMIT=60       # requests per minute per API key
```

---

## NEVER COMMIT TO GIT

- `.env` files (any environment)
- `storage/` contents
- `node_modules/`
- `vendor/`
- `public/build/` (or add `.gitignore` entry — team preference)
- Any file containing credentials, API keys, or passwords
