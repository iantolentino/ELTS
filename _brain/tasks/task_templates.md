# TASK TEMPLATES
> Standard formats for different task types. Use these when executing tasks.

---

## MIGRATION TASK

**Files to create:**
- `database/migrations/YYYY_MM_DD_HHMMSS_create_{table}_table.php`

**Checklist:**
- [ ] `$table->id()`
- [ ] All columns with correct types and nullable/default as needed
- [ ] Foreign keys with `->constrained()->cascadeOnDelete()` or `->nullOnDelete()`
- [ ] Indexes on foreign keys + filterable columns
- [ ] `$table->timestamps()`
- [ ] `down()` method drops the table

---

## MODEL TASK

**Files to create:**
- `app/Models/{ModelName}.php`

**Checklist:**
- [ ] `$fillable` array defined
- [ ] `$casts` for dates, booleans, enums, JSON
- [ ] All relationships defined (`hasMany`, `belongsTo`, etc.)
- [ ] Scopes for common filters (e.g., `scopeOpen`, `scopeByPriority`)
- [ ] Observer registered in `AppServiceProvider` or `boot()`
- [ ] Factory created at `database/factories/{ModelName}Factory.php`

---

## REPOSITORY TASK

**Files to create:**
- `app/Repositories/Contracts/{ModelName}RepositoryInterface.php`
- `app/Repositories/Eloquent/Eloquent{ModelName}Repository.php`

**Checklist:**
- [ ] Interface defines all methods with typed signatures
- [ ] Eloquent implementation uses the Model (no raw queries unless necessary)
- [ ] Registered in `AppServiceProvider` (`$this->app->bind(Interface, Implementation)`)

---

## SERVICE TASK

**Files to create:**
- `app/Services/{FeatureName}Service.php`

**Checklist:**
- [ ] Constructor injects repository interfaces (not concrete classes)
- [ ] Each method has a single responsibility
- [ ] Business logic only — no HTTP/request knowledge
- [ ] Fires Events on significant state changes
- [ ] Returns typed DTOs or Eloquent models
- [ ] Throws domain exceptions on invalid state

---

## CONTROLLER TASK

**Files to create:**
- `app/Http/Controllers/{Module}/{ModelName}Controller.php`
- `app/Http/Requests/{Module}/Store{ModelName}Request.php`
- `app/Http/Requests/{Module}/Update{ModelName}Request.php`

**Checklist:**
- [ ] Calls `$this->authorize()` at top of each method
- [ ] Delegates all logic to Service
- [ ] Uses Form Request for validation (not `$request->validate()` inline)
- [ ] Returns `Inertia::render()` for web or `response()->json()` for API
- [ ] No business logic — thin controller

---

## REACT PAGE TASK

**Files to create:**
- `resources/js/Pages/{Module}/{PageName}.tsx`

**Checklist:**
- [ ] Props typed via TypeScript interface
- [ ] Uses `AppLayout` or `AuthLayout` wrapper
- [ ] No inline styles — Tailwind only
- [ ] Loading and error states handled
- [ ] Inertia `useForm` used for forms (not raw state)
- [ ] Paginated lists use Inertia pagination
- [ ] Under 200 lines — extract sub-components if larger

---

## JOB TASK

**Files to create:**
- `app/Jobs/{JobName}.php`

**Checklist:**
- [ ] Implements `ShouldQueue`
- [ ] `handle()` method is focused and short
- [ ] Retry logic configured (`$tries`, `$backoff`)
- [ ] Queued to correct named queue (`emails`, `sla`, `automation`, `reports`)
- [ ] Failure logging (implements `failed()` method)

---

## TEST TASK

**Files to create:**
- `tests/Feature/{Module}/{FeatureName}Test.php` (or Unit/)

**Checklist:**
- [ ] Uses `RefreshDatabase` trait
- [ ] Happy path test
- [ ] Validation / error path test
- [ ] Role/permission enforcement test (unauthenticated + wrong role)
- [ ] Uses factories for test data setup
- [ ] Assertions are specific (status code, DB state, response structure)
