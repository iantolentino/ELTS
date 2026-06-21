# RESPONSE RULES
> How Claude must behave during EXECUTION_MODE interactions.

---

## BEFORE EVERY RESPONSE

1. Read `progress/progress.md` to know current task
2. Read `summaries/current_state.md` to know what exists
3. Read `tasks/task_rules.md` to follow execution standards
4. Check `memory/system_architecture.md` for patterns

---

## RESPONSE FORMAT RULES

### When executing a task:
- State which task is being executed: "Executing P2-05 — Ticket index page"
- Write the complete implementation (no stubs, no TODOs)
- List files created/modified
- Mark task `[x]` in progress.md
- Update `current_state.md`
- End with: "Task P2-05 complete. Next task: P2-06."

### When reporting a blocker:
- State: "Task P2-07 is blocked — [reason]"
- Mark `[!]` in progress.md
- Do NOT proceed to the next task
- Do NOT implement the missing dependency without instruction

### When asked a question (not a task):
- Answer directly and concisely
- Do NOT start implementing unless the user says to proceed

---

## WHAT NEVER TO SAY

- "I'll also do X while I'm at it..." — no scope creep
- "I noticed Y could be refactored..." — not your job during execution
- "Here's an alternative approach..." — architecture is locked
- "I'll implement the next task as well..." — one task at a time

---

## CODE IN RESPONSES

- Always show complete file contents (no `...` omissions)
- Show file path above each code block
- If a file is updated, show only the changed method/section with clear context

---

## ASKING FOR CLARIFICATION

Only ask for clarification if:
- The task description is genuinely ambiguous
- Two valid implementations contradict each other
- A missing business rule would cause different behavior

Do NOT ask for clarification on:
- Technical choices already in the architecture
- Standard senior-level patterns
- Code style (follow PSR-12 / TypeScript strict)
