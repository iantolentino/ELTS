# NEW MACHINE SETUP GUIDE
> Follow this guide whenever you clone the ELTS repo on a new machine (work PC, new laptop, etc.)
> This covers both development setup and continuing progress with Claude.

---

## STEP 1 — Install Prerequisites (one-time per machine)

### A. Laragon Full
- Download from: laragon.org/download → choose **Laragon Full**
- Install with default settings
- Launch Laragon → click **Start All**
- This gives you: PHP 8.3, MySQL 8, Apache, HeidiSQL

### B. Enable Required PHP Extensions
After installing Laragon, open this file in any text editor:
```
C:\laragon\bin\php\php-8.3.x\php.ini
```
Find these lines and remove the `;` at the start of each:
```
;extension=zip        → extension=zip
;extension=fileinfo   → extension=fileinfo
;extension=openssl    → extension=openssl
;extension=pdo_mysql  → extension=pdo_mysql
;extension=mbstring   → extension=mbstring
;extension=curl       → extension=curl
```
Save the file. Verify in a terminal:
```bash
php -m | grep -E "zip|fileinfo|pdo_mysql"
```

### C. Composer
- Download from: getcomposer.org/download → run **Composer-Setup.exe**
- When prompted for PHP path, point to: `C:\laragon\bin\php\php-8.3.x\php.exe`
- Verify: `composer -V`

### D. Node.js
- Download LTS from: nodejs.org
- Install with default settings
- Verify: `node -v` and `npm -v`

### E. Git
- If not already installed: git-scm.com/download/win
- Verify: `git --version`

---

## STEP 2 — Clone the Repository

Open a terminal (PowerShell or Laragon terminal):

```bash
git clone https://github.com/iantolentino/ELTS.git
cd ELTS
```

---

## STEP 3 — Install Dependencies

```bash
# PHP dependencies (vendor/ is gitignored — must run this every clone)
composer install

# Node dependencies (node_modules/ is gitignored — must run this every clone)
npm install
```

---

## STEP 4 — Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Generate a new app key
php artisan key:generate
```

Then open `.env` and verify these lines (Laragon defaults work out of the box):
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=elts_db
DB_USERNAME=root
DB_PASSWORD=
```
> Laragon MySQL default: username = `root`, password = (empty)

---

## STEP 5 — Create the Database

1. Right-click the Laragon tray icon → **Database** → **HeidiSQL**
2. In HeidiSQL left panel, right-click → **Create new** → **Database**
3. Name: `elts_db`
4. Collation: `utf8mb4_unicode_ci`
5. Click **OK**

---

## STEP 6 — Run Migrations

```bash
php artisan migrate
```

If seeders have been created (check progress.md for Phase 1 status):
```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=DefaultStatusesSeeder
```

---

## STEP 7 — Create Storage Symlink

```bash
php artisan storage:link
```

---

## STEP 8 — Verify Everything Works

```bash
# Start Laravel dev server
php artisan serve

# In a second terminal, start Vite
npm run dev
```

Open `http://localhost:8000` in your browser. You should see the app.

---

## STEP 9 — Resume Development with Claude

Open VS Code in the project folder. Start a new Claude session and send:

```
Read the following files in order:
1. _brain/claude.md
2. _brain/summaries/current_state.md
3. _brain/progress/progress.md
4. _brain/tasks/task_rules.md

We are in EXECUTION_MODE.
Identify the next incomplete task [ ] in progress.md and execute it.
```

Claude will pick up exactly where you left off.

---

## DAILY WORKFLOW (after first-time setup)

```bash
# 1. Pull latest changes from GitHub
git pull origin main

# 2. Install any new PHP packages added since last pull
composer install

# 3. Install any new Node packages added since last pull
npm install

# 4. Run any new migrations
php artisan migrate

# 5. Start dev servers
php artisan serve    # terminal 1
npm run dev          # terminal 2
```

---

## PUSHING YOUR WORK

After finishing a session, push your changes so the other machine stays in sync:

```bash
git add .
git commit -m "your message here"
git push origin main
```

---

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| `composer` not found | Restart terminal after Composer install — PATH needs refresh |
| `php` not found | Add `C:\laragon\bin\php\php-8.3.x` to Windows PATH |
| MySQL connection refused | Open Laragon and click **Start All** — MySQL must be running |
| `zip extension missing` | Edit php.ini and uncomment `extension=zip` (Step 1B) |
| `Class not found` errors | Run `composer dump-autoload` |
| Vite assets not loading | Run `npm run build` or start `npm run dev` |
| Migrations fail | Make sure `elts_db` database exists in HeidiSQL |
| Permission errors on storage | Run `php artisan storage:link` |

---

## REPO
- GitHub: https://github.com/iantolentino/ELTS.git
- Branch: `main`
