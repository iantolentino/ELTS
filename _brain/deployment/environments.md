# ENVIRONMENTS

> Confirmed 2026-07-19. This project has two environments only — no staging tier defined.

---

## Environment Summary

| Environment | Purpose                    | Access        | Runtime |
|-------------|----------------------------|----------------|---------|
| Local       | Development on this machine | Developer only | XAMPP — `c:\xampp\htdocs\ticketing-app`, served at `http://localhost/ticketing-app/` |
| Production  | Live system for real users  | Public          | cPanel / cloud LAMP host |

---

## Config Values by Environment (in `config.php`, not `.env` — see `security/secrets_policy.md`)

| Setting                | Local (XAMPP)                     | Production (cPanel)                |
|--------------------------|-------------------------------------|--------------------------------------|
| DB host/name/user/pass    | XAMPP MySQL (`localhost`, default `root`, blank password unless changed) | Real cPanel MySQL DB + dedicated user |
| `MAINTENANCE_MODE`        | `false`                             | `false` (set `true` only during planned maintenance) |
| Allowed upload extensions | `['png','pdf','xlsx']` (or as needed for testing) | Same, tightened per real usage |
| Base URL                  | `http://localhost/ticketing-app/`   | Production domain                    |

---

## Environment Rules
- Never use production DB credentials locally
- `config.php` with real credentials is never committed — see `security/secrets_policy.md`
- Local (XAMPP) is used to smoke-test every backlog task before it's considered COMPLETE, since
  the project root is already inside `htdocs` and reachable in-browser
