# CONTINUE PROMPT
> Use this at the start of every new session to resume work.

---

## PROMPT TO SEND CLAUDE (copy-paste this)

```
Read the following files in order:
1. _brain/claude.md
2. _brain/summaries/current_state.md
3. _brain/progress/progress.md
4. _brain/tasks/task_rules.md

We are in EXECUTION_MODE.

Identify the next incomplete task [ ] in progress.md and execute it.
Follow all rules in task_rules.md.
After completing the task, update progress.md and current_state.md, then stop.
```

---

## WHAT CLAUDE WILL DO

1. Read the 4 files above
2. Find the next `[ ]` task
3. Implement it fully (migrations, models, services, controllers, pages, tests)
4. Mark it `[x]` in progress.md
5. Update current_state.md
6. Stop and report what was done

---

## IF YOU WANT A SPECIFIC TASK

```
Read _brain/summaries/current_state.md and _brain/tasks/task_rules.md.
Execute task [TASK-ID] from _brain/progress/progress.md.
Example: Execute task P2-05.
```

---

## IF YOU WANT MULTIPLE TASKS

```
Read _brain/ system files.
Execute tasks P2-05 through P2-08 in order.
Complete each one fully before moving to the next.
Update progress.md and current_state.md after each task.
```
