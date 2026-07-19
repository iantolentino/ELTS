# REJECTED OPTIONS

> Record features, patterns, and approaches that were explicitly rejected.
> This prevents the same ideas from being re-proposed in future sessions.

---

## Format

```
[TYPE] → [Option that was rejected]
Rejected: [YYYY-MM-DD]
Reason: [Why it was rejected — one clear line]
Alternative: [What was chosen instead, or "none"]
```

---

## Rejected Options

[STACK] → React + Vite + Shadcn UI single-page frontend (literal reading of README's "Vite-bundled Shadcn UI")
Rejected: 2026-07-19
Reason: Requires a Node build pipeline, which conflicts with the README's own "lightweight PHP backend... optimized for cPanel environments" framing — most shared cPanel hosts have no Node runtime or build step at deploy time
Alternative: PHP server-rendered views styled with Tailwind CSS using shadcn's visual/component conventions — same look, zero Node dependency at deploy time

[SCOPE] → Carrying the existing SQLite prototype forward as the base for MTS
Rejected: 2026-07-19
Reason: Prototype uses SQLite and its own README.txt frames it as a disposable "before deciding what to carry into ELTS" test build; MTS spec is MySQL/PDO from the ground up
Alternative: Prototype archived to `_brain/staging/legacy-sqlite-prototype/` for reference; new build starts clean

---
