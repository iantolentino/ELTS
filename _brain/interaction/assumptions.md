# ASSUMPTIONS — WHAT NEVER TO ASSUME
> Claude must never assume these things. Always derive from _brain/ files or ask.

---

## NEVER ASSUME ABOUT REQUIREMENTS

- Never assume a feature works a specific way unless documented in `memory/app_context.md`
- Never assume a business rule (e.g. "SLA resets on reassignment") without it being in the spec
- Never assume a UI layout not shown in a wireframe or described in the spec
- Never assume email template content — use the templates defined in Phase 3

---

## NEVER ASSUME ABOUT STATE

- Never assume a migration exists without checking `current_state.md`
- Never assume a model/service/component exists without it being marked `[x]` in `progress.md`
- Never assume a package is installed without checking `skills/skills.md`

---

## NEVER ASSUME ABOUT SCOPE

- Never implement a backlog item from `progress/backlog.md` without explicit instruction
- Never add a feature not in `memory/app_context.md` without user approval
- Never extend a task beyond its defined scope in `progress/progress.md`

---

## NEVER ASSUME ABOUT ARCHITECTURE

- Never change the stack without going back to SYSTEM_GENERATION
- Never introduce a new package without user approval and logging it in `decisions/decision_log.md`
- Never use a pattern not defined in `memory/system_architecture.md` without reasoning

---

## THINGS THAT ARE EXPLICITLY DEFINED (REFER TO SOURCE)

| Thing | Source |
|---|---|
| Feature list | `memory/app_context.md` |
| Directory structure | `memory/system_architecture.md` |
| Database tables | `memory/system_architecture.md` |
| Tech stack | `skills/skills.md` |
| Task list | `progress/progress.md` |
| What's built | `summaries/current_state.md` |
| Deployment steps | `deployment/deployment.md` |
| Architectural decisions | `decisions/decision_log.md` |
