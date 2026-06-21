# DEPLOYMENT GUIDE
> Step-by-step instructions for deploying to cPanel hosting.

---

## ENVIRONMENT

- **Hosting:** cPanel shared/VPS hosting
- **PHP version:** 8.3 (set in cPanel MultiPHP Manager)
- **Database:** MySQL 8.x (cPanel MySQL Databases)
- **Web root:** `public_html/` or subdomain root → must point to Laravel's `public/` folder

---

## PRE-DEPLOYMENT CHECKLIST

- [ ] PHP 8.3 selected in MultiPHP Manager for the domain
- [ ] MySQL database and user created in cPanel
- [ ] Email account created for outgoing mail (or external SMTP credentials ready)
- [ ] IMAP mailbox(es) created for incoming ticket email
- [ ] SSL certificate active (Let's Encrypt via cPanel)
- [ ] Domain pointing to correct cPanel account

---

## STEP-BY-STEP DEPLOYMENT

### Step 1 — Upload Files
1. Build assets locally: `npm run build`
2. Compress project (exclude `node_modules/`, `.git/`, `storage/logs/*`)
3. Upload via FTP or cPanel File Manager to a temporary folder (e.g. `/home/user/ticketing/`)
4. Do NOT upload to `public_html/` directly — Laravel's web root is `/public/`

### Step 2 — Configure Web Root
**Option A — Subdomain** (recommended):
1. Create subdomain in cPanel (e.g. `tickets.yourdomain.com`)
2. Set document root to `/home/user/ticketing/public`

**Option B — Main domain:**
1. Move `public/` contents to `public_html/`
2. Update `public/index.php` to adjust paths one level up:
```php
require __DIR__.'/../ticketing/vendor/autoload.php';
$app = require_once __DIR__.'/../ticketing/bootstrap/app.php';
```

### Step 3 — Configure .env
```env
APP_NAME="Support Ticketing"
APP_ENV=production
APP_KEY=           # generate with: php artisan key:generate
APP_DEBUG=false
APP_URL=https://tickets.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=mail.yourdomain.com
MAIL_PORT=587
MAIL_USERNAME=support@yourdomain.com
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=support@yourdomain.com
MAIL_FROM_NAME="Support Team"

SESSION_DRIVER=file
SESSION_LIFETIME=120

CACHE_STORE=file
```

### Step 4 — Run Setup Commands (via cPanel Terminal or SSH)
```bash
cd /home/user/ticketing

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Generate app key (first deploy only)
php artisan key:generate

# Run database migrations
php artisan migrate --force

# Seed required data (roles, default statuses)
php artisan db:seed --class=RolesAndPermissionsSeeder --force
php artisan db:seed --class=DefaultStatusesSeeder --force

# Create storage symlink
php artisan storage:link

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 5 — Configure Cron Jobs in cPanel
Go to cPanel → Cron Jobs. Add these two entries (both every minute `* * * * *`).

Replace `/home/user/ticketing` with your actual server path (find it with `pwd` in SSH).
Verify PHP path with: `which php` — common values: `/usr/local/bin/php`, `/usr/bin/php`.

**Cron 1 — Laravel Scheduler** (runs all scheduled tasks):
```
* * * * * /usr/local/bin/php /home/user/ticketing/artisan schedule:run >> /dev/null 2>&1
```

**Cron 2 — Queue Worker** (processes background jobs, cPanel-compatible — no daemon):
```
* * * * * /usr/local/bin/php /home/user/ticketing/artisan queue:work --stop-when-empty --max-time=55 --tries=3 --queue=default,emails,sla,automation,reports >> /dev/null 2>&1
```

> `--stop-when-empty` — exits once the queue is drained (safe to call every minute)
> `--max-time=55` — hard stops after 55 seconds so it finishes before the next cron fires
> `--tries=3` — retries failed jobs up to 3 times before moving to `failed_jobs`
> Queue priority order: `default → emails → sla → automation → reports`

### Step 6 — Set File Permissions
```bash
chmod -R 755 /home/user/ticketing
chmod -R 775 /home/user/ticketing/storage
chmod -R 775 /home/user/ticketing/bootstrap/cache
```

### Step 7 — Smoke Test
- [ ] Visit `https://tickets.yourdomain.com` — see login page
- [ ] Log in with seeded Super Admin account
- [ ] Create a test ticket
- [ ] Reply to the ticket — verify email notification sent
- [ ] Send a test email to the configured mailbox — verify ticket is created
- [ ] Run a test report export (PDF + CSV)
- [ ] Check audit log shows activity

---

## UPDATES (After Initial Deploy)

```bash
cd /home/user/ticketing

# Pull/upload updated files
composer install --no-dev --optimize-autoloader
npm run build  # (done locally then uploaded)

# Run new migrations
php artisan migrate --force

# Re-cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## KNOWN cPANEL LIMITATIONS

| Limitation | Workaround |
|---|---|
| No persistent queue daemon | cPanel cron runs `queue:work --stop-when-empty` every minute |
| No Redis | Use database queue driver |
| No supervisor | Cron job as queue worker (sufficient for most loads) |
| PHP path varies | Use `/usr/local/bin/php` in crons — verify with `which php` in SSH |
| No SSH on some hosts | Use cPanel Terminal (under Advanced) |
