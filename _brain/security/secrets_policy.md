# SECRETS POLICY

## Project-Specific: config.php on cPanel (confirmed 2026-07-19)
This project's deploy model (per README Quick-Start) is a single `config.php` at project root
holding DB credentials and feature-flag globals — not a `.env` file, since it's plain PHP on
cPanel with no environment-variable injection step.

- `config.php` committed to the repo **must** contain only placeholder values
  (`DB_HOST=localhost`, `DB_USER=your_db_user`, `DB_PASS=your_db_password`, etc.)
- Real production credentials are entered directly into `config.php` on the live server after
  deployment (per README Step 1) — that edited, credentialed copy is never committed back
- Add `config.php` to `.gitignore` once it holds real values in any environment (local XAMPP
  testing counts); keep a `config.example.php` template committed instead if local iteration
  needs a starting point
- `/private/` directory (holding `migration-command.php`) must be blocked from public HTTP access
  via `.htaccess` — it can reveal schema/connectivity details if reachable

---

## Absolute Rules
- Never hardcode secrets, passwords, or API keys in source code
- Never commit `.env` files or secret files to version control
- Never log secrets, tokens, or passwords — not even partially
- Never expose secrets in API responses, error messages, or client-side code

---

## Secret Storage by Environment

| Environment | Storage Method                                      |
|-------------|-----------------------------------------------------|
| Local       | `.env` file — gitignored, never committed           |
| Staging     | CI/CD environment variables (GitHub Actions secrets, etc.) |
| Production  | Secret manager (AWS Secrets Manager / Doppler / Vault / Railway env vars) |

---

## .gitignore Requirements
Always include:

```
.env
.env.*
*.key
*.pem
secrets/
```

---

## Rotation Policy
| Secret Type    | Rotation Trigger                  | Minimum Frequency |
|----------------|-----------------------------------|-------------------|
| App secrets    | Team member departure             | As needed         |
| API keys       | Compromise suspected or confirmed | Every 90 days     |
| DB credentials | Team member departure             | Every 180 days    |
| Auth tokens    | Automatic (based on session rules)| Per session rules |

---

## If a Secret Is Leaked
1. Revoke the compromised secret immediately
2. Rotate all related secrets (same environment, same scope)
3. Audit access logs for unauthorized use
4. Notify affected parties if user data was exposed
5. Log the incident with date and scope
6. Update this file if policy change is needed
