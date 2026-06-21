# BOOTSTRAP PROMPT
> Use this if the _brain/ system needs to be re-initialized from scratch.
> This should almost never be needed — the spec is locked.

---

## WHEN TO USE

Only use if:
- The spec is fundamentally wrong and needs to be restarted
- A completely new project is being started in this directory
- The user explicitly says "restart from scratch"

---

## PROMPT TO SEND CLAUDE

```
Read _brain/claude.md.

The _brain/ system needs to be re-initialized. 
Treat this as BOOTSTRAP_MODE.
Delete all existing _brain/ files except claude.md.
Begin collecting the full specification from Phase 1.
Do not assume any previous specification is valid.
```

---

## WARNING

Re-bootstrapping will overwrite all existing _brain/ files.
All progress tracking will be lost.
This should only be done if the project direction has fundamentally changed.
