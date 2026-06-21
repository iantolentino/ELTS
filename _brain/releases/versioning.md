# VERSIONING STRATEGY
> How this project versions releases.

---

## VERSION FORMAT

`MAJOR.MINOR.PATCH`

| Part | When to increment |
|---|---|
| MAJOR | Breaking change — restructured data, removed feature, major redesign |
| MINOR | New feature added (backward-compatible) |
| PATCH | Bug fix, small improvement, copy change |

---

## RELEASE MILESTONES

| Version | Contents |
|---|---|
| v0.1.0 | Project Setup + Auth + User Management (Phases 0–1) |
| v0.2.0 | Core Ticket Management (Phase 2) |
| v0.3.0 | Email Integration + SLA (Phases 3–4) |
| v0.4.0 | Automation + Canned Responses (Phases 5–6) |
| v0.5.0 | Reports & Analytics (Phase 7) |
| v0.6.0 | Knowledge Base + CSAT/NPS (Phases 8–9) |
| v0.7.0 | Assets + Audit Logs + Notifications (Phases 10–12) |
| v0.8.0 | REST API + Webhooks + System Settings (Phases 13–14) |
| v0.9.0 | Client Portal + Full QA (Phases 15–16) |
| v1.0.0 | Production launch — all features complete and deployed (Phase 17) |

---

## GIT TAGS

Each release is tagged in git:
```bash
git tag -a v0.1.0 -m "Auth and user management complete"
git push origin v0.1.0
```

---

## CHANGELOG RULE

Every version entry in `changelog.md` must include:
- What was added
- What was changed (if anything)
- What was fixed (if any bugs caught and resolved)
- What was removed (if applicable)
