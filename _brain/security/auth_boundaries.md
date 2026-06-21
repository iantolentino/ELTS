# AUTHENTICATION & AUTHORIZATION BOUNDARIES
> Defines who can access what, and how access is enforced.

---

## AUTHENTICATION METHODS

| Method | Used For |
|---|---|
| Session (cookie) | All web routes (Inertia pages) — Laravel Sanctum web guard |
| Bearer token (API key) | All `/api/v1/` routes — custom API key middleware |
| TOTP (2FA) | Required for Super Admin, Admin; optional for others |

---

## ROUTE GROUPS

| Route Group | Guard | Who Can Access |
|---|---|---|
| `/login`, `/register`, `/forgot-password` | guest | Unauthenticated only |
| `/` and all web routes | auth | All authenticated users |
| `/admin/*` | auth + role:admin,super-admin | Admin, Super Admin |
| `/supervisor/*` | auth + role:supervisor,admin,super-admin | Supervisor and above |
| `/client/*` | auth + role:client | Client role only |
| `/api/v1/*` | api-key | Any valid API key holder |
| Knowledge Base public pages | none | Public (no login) |
| CSAT / NPS response pages | signed URL token | Anyone with the link |

---

## ROLE PERMISSION MATRIX

| Action | Super Admin | Admin | Supervisor | Agent | Client |
|---|---|---|---|---|---|
| View all tickets | YES | YES | YES | YES (assigned) | NO (own only) |
| Create ticket | YES | YES | YES | YES | YES |
| Close any ticket | YES | YES | YES | NO | NO |
| Delete ticket | YES | YES | NO | NO | NO |
| Assign ticket | YES | YES | YES | YES (self) | NO |
| View internal notes | YES | YES | YES | YES | NO |
| Create internal note | YES | YES | YES | YES | NO |
| Manage users | YES | YES | NO | NO | NO |
| Manage teams | YES | YES | NO | NO | NO |
| View reports | YES | YES | YES | NO | NO |
| Export reports | YES | YES | YES | NO | NO |
| Manage SLA policies | YES | YES | NO | NO | NO |
| Manage automation | YES | YES | NO | NO | NO |
| Manage KB articles | YES | YES | YES | YES (create) | NO |
| View audit logs | YES | YES | NO | NO | NO |
| Manage system settings | YES | NO | NO | NO | NO |
| Manage roles/permissions | YES | NO | NO | NO | NO |
| Manage API keys | YES | YES | NO | YES (own) | NO |
| Manage webhooks | YES | YES | NO | NO | NO |
| Manage assets | YES | YES | YES | YES | NO |

---

## ENFORCEMENT RULES

1. **Every controller method calls `$this->authorize()`** — no exceptions
2. **Policies defined per model** — TicketPolicy, UserPolicy, ReportPolicy, etc.
3. **Client role**: Eloquent scope applied on all ticket queries (`where('requester_id', auth()->id())`)
4. **API keys**: hashed in DB, looked up on every request, rate limited, and scoped to user's permissions
5. **2FA enforcement**: Middleware checks if 2FA is required for role and redirects to challenge page if not verified in session
6. **Public KB pages**: No auth middleware, but articles must be marked `is_public = true` to appear
7. **CSAT/NPS links**: Signed URL (Laravel `URL::temporarySignedRoute`) — no login required but tamper-proof

---

## SENSITIVE DATA ACCESS

| Data | Who Can See |
|---|---|
| Internal notes | Agents, Supervisors, Admins, Super Admin |
| Other users' tickets | Agents (assigned or all depending on role), Supervisors+, NOT other clients |
| User passwords | Nobody — hashed, never readable |
| Other users' API keys | Nobody — shown once at creation, then hashed |
| 2FA secret | Nobody after setup — encrypted at rest |
| Audit logs | Admin, Super Admin only |
| System settings (SMTP password) | Super Admin only |
| IMAP credentials | Super Admin + Admin (masked in UI) |

---

## SESSION SECURITY

- `SESSION_SECURE_COOKIE=true` in production (HTTPS required)
- `SESSION_SAME_SITE=lax`
- `SESSION_HTTP_ONLY=true`
- Configurable session lifetime (default 120 minutes)
- "Remember me" extends to 30 days (separate long-lived token)
- Force logout: invalidates all sessions for a user (admin capability)
- Session regenerated on login to prevent fixation attacks
