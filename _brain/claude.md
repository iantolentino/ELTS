# CLAUDE OPERATING SYSTEM (BRAIN CONTROLLER)

This file is the control layer for the `_brain/` project system.

It defines how Claude initializes, builds, and executes any software project using a fixed state machine.

---

# 🧠 CORE PRINCIPLE

Claude must NEVER assume project context.

Claude must ALWAYS follow the system states:

1. BOOTSTRAP_MODE
2. CONFIRMATION_LOCK
3. SYSTEM_GENERATION
4. EXECUTION_MODE

No state may be skipped.

---

# 🔵 STATE 1 — BOOTSTRAP_MODE

## Trigger:
If `_brain/` is uninitialized or no confirmed specification exists.

## Rules:
Claude must ONLY read this file (`claude.md`).

Claude must NOT:
- read other files
- generate code
- generate architecture
- assume requirements

## Claude must collect full specification:

### PHASE 1 — PROJECT CLASSIFICATION
1. What are we building?
   - App / Website / System / Automation / API / Tool

2. Domain:
   - (e.g. ticketing system, CRM, booking platform)

3. Target users:
   - end users / internal staff / admins / public users

---

### PHASE 2 — FUNCTIONAL REQUIREMENTS
4. Core features list (detailed bullet points)

5. Feature priority:
   - Must-have / Should-have / Nice-to-have

6. Workflow description:
   - Step-by-step system usage

---

### PHASE 3 — NON-FUNCTIONAL REQUIREMENTS
7. Engineering level:
   - basic / mid-level / senior-level

8. Performance scale:
   - small / medium / enterprise

9. Security level:
   - low / standard / strict

---

### PHASE 4 — DESIGN SYSTEM
10. UI style:
   - minimal / modern / corporate / dark / custom

11. Color palette:
   - or “Claude proposes after spec lock”

12. UI inspiration:
   - references or descriptions

---

### PHASE 5 — TECH CONSTRAINTS
13. Allowed stack:
   - frontend / backend / database

14. Forbidden tools:
   - optional restrictions

15. Deployment preference:
   - Vercel / AWS / local / undecided

---

# 🔒 STATE 2 — CONFIRMATION_LOCK

After collecting all information:

Claude must:

- Summarize full specification
- Ask for explicit confirmation:

> "Confirm full specification before I generate system architecture."

## RULES:
- No file writing
- No coding
- No assumptions

Only wait for:
"confirm" / "approved" / "proceed"

---

# 🟡 STATE 3 — SYSTEM_GENERATION

Triggered ONLY after confirmation.

Claude must generate and WRITE ALL `_brain/` files.

## MEMORY LAYER
- memory/app_context.md → full system definition
- memory/system_architecture.md → architecture design
- memory/glossary.md → project terms

---

## TASK SYSTEM
- progress/progress.md → full task breakdown (MVP → production)
- progress/backlog.md → future improvements
- tasks/task_rules.md → execution rules
- tasks/task_templates.md → task formats

---

## DECISIONS SYSTEM
- decisions/decision_log.md → architectural decisions
- decisions/rejected_options.md → rejected alternatives

---

## SKILLS SYSTEM
- skills/skills.md → tech stack selection
- skills/resources.md → references

---

## DEPLOYMENT SYSTEM
- deployment/deployment.md → deployment strategy
- deployment/environments.md → environments setup

---

## TIMELINES
- timelines/actual_timeline.md → optimized execution plan
- timelines/reported_timeline.md → external timeline

---

## STATE SUMMARIES
- summaries/current_state.md → initial snapshot
- summaries/weekly_summary.md → empty or baseline

---

## INTERACTION RULES
- interaction/response_rules.md
- interaction/assumptions.md

---

## GOVERNANCE
- governance/rules.md
- governance/scope.md

---

## SECURITY
- security/secrets_policy.md
- security/auth_boundaries.md

---

## RELEASES
- releases/changelog.md
- releases/versioning.md

---

## PROMPTS
- prompts/bootstrap_prompt.md
- prompts/continue_prompt.md
- prompts/debug_prompt.md

---

## IMPORTANT RULES:
- ALL files must be written before any coding begins
- No implementation code in this phase
- Only planning and structuring allowed

---

# 🟢 STATE 4 — EXECUTION_MODE

Triggered after SYSTEM_GENERATION completes.

Claude must:

1. Read:
   - progress/progress.md
   - summaries/current_state.md

2. Select ONLY ONE task

3. Execute task (code allowed here)

4. Update:
   - progress.md
   - current_state.md

5. STOP

---

# 🔁 EXECUTION LOOP RULE

Claude must repeat:

- read task
- implement task
- update memory
- stop

NO multi-tasking unless explicitly instructed.

---

## ⏳ TIMELINE GENERATION RULE (MANDATORY)

During SYSTEM_GENERATION, Claude MUST generate timelines based on the full specification.

Claude must create:

### 1. timelines/actual_timeline.md
- Optimized AI-assisted development plan
- Breaks project into realistic execution phases
- Includes:
  - Setup phase
  - Backend development
  - Frontend development
  - Integration
  - Testing 
  - Deployment
- Must be based on "mid/basic/senior level"
- Must be realistic for AI-assisted development speed

---

### 2. timelines/reported_timeline.md
- Human-safe / conservative timeline
- No mention of AI assistance
- Slower and more padded schedule
- Used for external reporting only

---

## RULES FOR TIMELINES

- MUST be created only AFTER full project spec is confirmed
- MUST match project complexity level
- MUST align with task breakdown in progress.md
- MUST NOT be vague (must include phases or weeks)
- MUST NOT be skipped under any condition

---

# ⚠️ HARD RULES

- No assumptions ever
- No skipping states
- No reading full repository
- No continuous coding
- No redesigning system without instruction