# TASK EXECUTION RULES
> Rules Claude must follow when executing tasks from progress.md.

---

## CORE LOOP

1. Read `progress/progress.md` — identify the next `[ ]` task
2. Read `summaries/current_state.md` — understand what exists
3. Execute ONLY that one task
4. Update `progress/progress.md` — mark task `[x]`
5. Update `summaries/current_state.md` — reflect new state
6. STOP — do not continue to the next task unless instructed

---

## WHAT "EXECUTE A TASK" MEANS

- Write the actual implementation code (migrations, models, controllers, services, pages, tests)
- Follow the architectural patterns defined in `memory/system_architecture.md`
- Follow the code standards below
- Do NOT skip to a simpler version — implement fully and correctly the first time
- Do NOT leave TODOs in code unless they are tied to a future backlog item

---

## CODE STANDARDS

### PHP / Laravel
- PSR-12 code style
- No logic in controllers — controllers call Services, Services call Repositories
- All DB queries go through Repository classes
- All authorization via Policy classes (`$this->authorize(...)`)
- All validation via Form Request classes
- Use typed properties, return types, and PHP 8.x features (match, enums, readonly, etc.)
- All background work dispatched as Jobs
- All model changes auto-logged via Observers (do not manually log in controllers)

### React / TypeScript
- Strict TypeScript — no `any` types
- Component props always typed via interface
- No inline styles — Tailwind classes only
- Components under 150 lines — split if larger
- Custom hooks for reusable logic (prefix: `use`)
- All API calls go through typed service functions in `lib/`
- Use Inertia `useForm`, `router.visit`, `usePage` — do not use fetch/axios directly

### Database / Migrations
- One migration per table
- Always include `id`, `created_at`, `updated_at` via `$table->id()` and `$table->timestamps()`
- Foreign keys always have `->constrained()->cascadeOnDelete()` or `->nullOnDelete()` as appropriate
- Index all foreign keys and frequently filtered columns
- Never modify an existing migration — always create a new one

### Testing (Pest)
- Every Service method has a Unit test
- Every critical HTTP route has a Feature test
- Test factories for all models
- Tests use database transactions (RefreshDatabase)
- Test both the happy path and error/edge cases

---

## WHAT NEVER TO DO

- Never add logic to blade/tsx that belongs in a Service
- Never write raw SQL unless using parameterized bindings
- Never store secrets in code — always `.env`
- Never skip writing tests for a completed task
- Never implement a backlog item without explicit instruction
- Never refactor existing working code while implementing a new task
- Never redesign the architecture without going back to SYSTEM_GENERATION

---

## BLOCKING RULE

If a task depends on something that doesn't exist yet (e.g., a model not yet migrated), the task is **blocked**. Mark it `[!]` in progress.md, note the blocker, and stop. Do not implement the dependency silently.
