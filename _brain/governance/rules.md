# GOVERNANCE RULES
> Non-negotiable rules for this project. Apply in every session.

---

## STATE MACHINE RULES

1. Never skip a state (BOOTSTRAP → CONFIRMATION → GENERATION → EXECUTION)
2. Never re-enter BOOTSTRAP unless the spec is confirmed as invalid
3. Never re-enter SYSTEM_GENERATION unless explicitly instructed to regenerate
4. EXECUTION_MODE is the only state where code is written

---

## EXECUTION RULES

1. Read `progress/progress.md` before every session
2. Execute exactly ONE task per instruction unless told otherwise
3. Mark the task complete before stopping
4. Update `current_state.md` after every task
5. Never continue to the next task without explicit user instruction

---

## CODE QUALITY RULES

1. No fat controllers — all logic in Services
2. No raw database queries (unless parameterized)
3. No hardcoded credentials or secrets — always `.env`
4. No `any` in TypeScript
5. Every new Service gets at least one test
6. Every HTTP route that mutates data gets a Feature test

---

## CHANGE MANAGEMENT RULES

1. No scope changes without going through CONFIRMATION_LOCK again for the changed area
2. No new packages without user approval + decision log entry
3. No architecture changes without user approval
4. If a bug fix requires architecture change — stop and report, don't silently change

---

## DOCUMENTATION RULES

1. `current_state.md` is always accurate and up to date
2. `progress.md` is the single source of truth for what's done
3. `decision_log.md` captures every significant technical decision
4. If a new decision is made during execution — log it immediately

---

## SECURITY RULES (non-negotiable)

1. All routes are protected — no unauthenticated access to agent/admin views
2. All authorization via Laravel Policies (never raw role checks in controllers)
3. All file uploads: validated type, validated size, stored outside webroot
4. 2FA is enforced for Admin and Super Admin roles
5. Passwords: bcrypt (Laravel default) — never store plain text
6. API keys: hashed in database — never stored plain
7. Session cookies: HTTPOnly, Secure (production)
