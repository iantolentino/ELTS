# SECRETS POLICY
> Rules for handling all sensitive data in this project.

---

## WHAT IS A SECRET

- Database passwords
- SMTP credentials
- IMAP credentials
- APP_KEY (Laravel encryption key)
- API keys (internal and third-party)
- 2FA secret seeds
- Session signing keys
- Any token or password

---

## STORAGE RULES

| Secret Type | Storage Location | Never Store In |
|---|---|---|
| ENV variables | `.env` file only | Code, database, git |
| APP_KEY | `.env` | Code, git |
| Database credentials | `.env` | Code, _brain/ files, git |
| SMTP credentials | `.env` + DB (mailbox table, encrypted) | Plain text in code |
| IMAP credentials | `.env` + DB (mailboxes table, encrypted) | Plain text in code |
| User passwords | DB (bcrypt hash) | Plain text anywhere |
| API keys | DB (SHA-256 hash of the key) | Plain text in DB |
| 2FA secrets | DB (encrypted via `encrypt()`) | Plain text |

---

## .env FILE RULES

- `.env` is in `.gitignore` — never commit it
- `.env.example` contains all keys with empty or placeholder values — commit this
- Production `.env` is managed directly on the server
- Never log `.env` values or echo them in responses

---

## CODE RULES

- Never hardcode a credential in any PHP or TypeScript file
- Never log sensitive data (passwords, tokens, email bodies with PII)
- All secrets accessed via `config()` or `env()` in Laravel
- Mailbox passwords encrypted at rest: use Laravel's `encrypt()` / `decrypt()`
- API keys returned to user only once at creation (show and tell user to save it)

---

## GIT RULES

- `.env` — in `.gitignore`
- `storage/` — in `.gitignore`
- `vendor/` — in `.gitignore`
- Never commit any file that contains real credentials, even test credentials
- If a secret is accidentally committed: rotate it immediately + use `git filter-repo` to remove from history

---

## AUDIT RULES

- API key usage is logged (last_used_at timestamp per key)
- Login attempts are logged (success + failure with IP)
- 2FA events are logged (setup, enabled, disabled, failed challenge)
- Failed API auth attempts are logged
