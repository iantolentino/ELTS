# DEPLOYMENT PLAN

> Confirmed 2026-07-19. Update when deployment strategy changes.

---

## Target Platform
cPanel shared hosting (LAMP stack) or any cloud VM running Apache + PHP 8.x + MySQL 8.x with
`.htaccess`/`mod_rewrite` support. No containers, no Node runtime required at deploy time.

## Deployment Strategy
**Direct** — file upload/overwrite via cPanel File Manager or git deploy, brief downtime is
acceptable at current scale. No blue-green/canary infrastructure justified yet.

## CI/CD Pipeline
None at MVP — manual deploy. Revisit if the team grows past a size where manual upload becomes
error-prone (log as an improvement in `improvements/improvement_log.md` if raised).

## Deployment Steps (from README Quick-Start)
1. Upload project files to the cPanel root (or the target subdomain/folder)
2. Edit `config.php` on the server with real DB credentials and feature-flag defaults
   (`MAINTENANCE_MODE`, allowed upload extensions, etc.) — never commit the edited copy back
3. In cPanel → phpMyAdmin: create an empty database, then Import `database.sql` into it
4. Visit `yourdomain.com/private/migration-command.php` to verify DB connectivity and schema
   integrity
5. Confirm `.htaccess` is active: clean URLs work, `/private/` returns 403 to the public,
   directory listing is disabled, Gzip/DEFLATE compression is applied
6. Smoke-test: submit a ticket as a requestor, log in as an agent and a superadmin, confirm
   department isolation holds

## Rollback Plan
If a deploy breaks production:
1. Re-upload the previous known-good file set (keep the prior version zipped before each deploy)
2. If the schema changed, restore the DB from the most recent export (see `db_backup/backup_policy.md` — policy still open, `R001`)
3. Log the incident in `releases/changelog.md`
4. Fix root cause locally (XAMPP) before re-deploying

## Health Checks
- [ ] `/` (public portal) responds and renders the submission form
- [ ] `/private/migration-command.php` reports DB connectivity + schema OK
- [ ] Login works for both `agent` and `superadmin` roles
- [ ] An agent cannot view another department's tickets by guessing a ticket ID/URL
- [ ] `.htaccess` blocks direct access to `/private/` and disables directory listing
