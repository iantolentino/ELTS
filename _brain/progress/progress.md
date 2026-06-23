# PROJECT PROGRESS
> Full task breakdown from setup to production. One task executed at a time.
> Status: [ ] = pending | [x] = done | [~] = in progress | [!] = blocked

---

## PHASE 0 — PROJECT SETUP
**Goal:** Functional skeleton with all dependencies installed and configured.

- [x] P0-01 — Install Laravel 11 via Composer, configure `.env` for MySQL
  - Installed: Laravel Framework 13.16.1 (latest stable), PHP 8.3.30, Composer 2.10.1 via Laragon
  - DB_CONNECTION=mysql, DB_DATABASE=elts_db configured in .env and .env.example
  - Note: PHP zip + fileinfo extensions enabled in Laragon php.ini
- [x] P0-02 — Install and configure Inertia.js (server-side adapter)
- [x] P0-03 — Install React 18 + TypeScript + Vite, configure tsconfig
- [x] P0-04 — Install and configure Tailwind CSS with custom design tokens (colors, fonts)
- [x] P0-05 — Install spatie/laravel-permission and publish config
- [x] P0-06 — Install spatie/laravel-activitylog and publish config
- [x] P0-07 — Install barryvdh/laravel-dompdf
  - Installed: barryvdh/laravel-dompdf v3.1.2 (dompdf/dompdf v3.1.5)
  - Config published to config/dompdf.php, enable_font_subsetting set to true
  - storage/fonts/ directory created with .gitkeep; font cache files gitignored
- [x] P0-08 — Install maatwebsite/excel
  - Installed: maatwebsite/excel v3.1.69 (phpoffice/phpspreadsheet v1.30.5)
  - Config published to config/excel.php
  - PDF driver set to DOMPDF (already installed), export properties seeded with APP_NAME
- [x] P0-09 — Install webklex/laravel-imap
  - Installed: webklex/laravel-imap v6.2.0 (webklex/php-imap v6.2.0)
  - Config published to config/imap.php; soft_fail set to true (resilient polling)
  - IMAP env keys added to .env and .env.example (IMAP_HOST, PORT, ENCRYPTION, USERNAME, PASSWORD)
- [x] P0-10 — Install pragmarx/google2fa-laravel for TOTP 2FA
  - Installed: pragmarx/google2fa-laravel v3.0.1 + pragmarx/google2fa v8.0.3
  - Also installed: bacon/bacon-qr-code v3.1.1 (SVG QR code backend)
  - Config published to config/google2fa.php; otp_secret_column → two_factor_secret, forbid_old_passwords → true
  - OTP env keys added to .env and .env.example
- [x] P0-11 — Install knuckleswtf/scribe for API docs
  - Installed: knuckleswtf/scribe v5.11.0 (dev dependency)
  - Config published to config/scribe.php
  - Auth: Bearer token enabled + default=true (all endpoints authenticated by default)
  - Example languages: bash, javascript, php, python
  - ELTS description + intro text configured; SCRIBE_AUTH_KEY env key added
- [x] P0-12 — Install Pest PHP testing framework
  - Installed: pestphp/pest v4.7.3 + pestphp/pest-plugin-laravel v4.1.0
  - phpunit downgraded one patch: 12.5.30 → 12.5.29 (required for pest v4.7.3 compatibility)
  - Created tests/Pest.php: Feature tests use TestCase + RefreshDatabase; actingAsRole() helper defined
  - Example tests converted to Pest syntax; 2/2 tests pass
- [x] P0-13 — Create base AppLayout.tsx and AuthLayout.tsx with sidebar + topbar
  - Installed: @heroicons/react (Heroicons v2 for sidebar + topbar icons)
  - Created: Layouts/AppLayout.tsx — sidebar + topbar shell, flash toast, localStorage sidebar-collapsed state
  - Created: Layouts/Sidebar.tsx — role-filtered nav groups, collapsed/expanded modes, availability dot
  - Created: Layouts/Topbar.tsx — search input, notifications bell, user dropdown (profile, security, sign out)
  - Created: Layouts/AuthLayout.tsx — centered card with logo, flash toast, copyright footer
  - Build: 601 modules, 0 errors
- [x] P0-14 — Create base UI component library: Button, Input, Modal, Badge, Dropdown, Table, Card
  - Components/UI/Button.tsx — 4 variants (primary/secondary/danger/ghost), 3 sizes, loading spinner
  - Components/UI/Input.tsx — label, error, hint, prefix/suffix icon, forwardRef
  - Components/UI/Badge.tsx — 6 variants + priority shorthand (critical/high/medium/low) with dot
  - Components/UI/Card.tsx — optional header/footer slots, padding toggle
  - Components/UI/Modal.tsx — portal, ESC key, backdrop click, body scroll lock, 4 sizes
  - Components/UI/Dropdown.tsx — outside-click close, separator support, danger items, align + width props
  - Components/UI/Table.tsx — generic <T>, sortable headers, loading/empty states, row click
  - Components/UI/index.ts — barrel export for all components
  - Build: 0 errors
- [x] P0-15 — Set up queue database tables (`php artisan queue:table`)
  - Laravel 13 default migration already includes: jobs, job_batches, failed_jobs (0001_01_01_000002)
  - Ran php artisan migrate: all 7 migrations applied successfully to elts_db
  - Tables now in DB: users, cache, jobs, job_batches, failed_jobs, permissions, roles, activity_log
  - Queue driver confirmed: database (QUEUE_CONNECTION=database in .env)
- [x] P0-16 — Configure cPanel cron job for Laravel Scheduler (every minute)
  - routes/console.php updated: activitylog:clean scheduled daily; Phase 3–7 jobs stubbed as comments
  - php artisan schedule:list confirms: activitylog:clean registered (0 0 * * *)
  - deployment.md Step 5 updated: scheduler cron + queue:work cron (--stop-when-empty --max-time=55 --tries=3)
  - new-machine-setup.md updated: queue:work added to daily workflow (terminal 3)
  - Note: cPanel cron is configured at deploy time (Phase 17) — documented, not yet active
- [x] P0-17 — Set up `config/ticketing.php` with app-wide defaults
  - Created config/ticketing.php: 8 sections — tickets, sla, email, satisfaction, security, portal, kb, pagination
  - All values env()-backed so they can be pre-configured without a DB row
  - Env keys added to .env and .env.example (ticket, SLA, CSAT/NPS, security, portal settings)
  - Verified: config('ticketing.tickets.number_prefix') = "TKT" ✓

---

## PHASE 1 — AUTHENTICATION & USER MANAGEMENT
**Goal:** All roles can log in, register (clients), and manage their accounts.

- [x] P1-01 — Create `users` table migration with all fields (name, email, password, role, availability_status, is_vip, 2fa_secret, etc.)
  - Created: 2026_06_21_100000_add_elts_fields_to_users_table.php (ALTER TABLE migration)
  - Adds 14 ELTS-specific columns: phone, avatar, job_title, timezone, locale, availability_status, is_vip, is_active, two_factor_secret, two_factor_confirmed_at, last_login_at, last_login_ip, team_id, department_id
  - Indices: availability_status, is_active, team_id, department_id
  - FK constraints for team_id/department_id deferred to P1-02 (teams/departments table not yet created)
  - User model updated: MustVerifyEmail added, all fields in $fillable, is_active + last_login_at casts added
  - Migration verified: all 22 columns present in users table
- [x] P1-02 — Create `teams` and `departments` table migrations
  - Created: 2026_06_21_110000_create_departments_table.php (name, description, is_active)
  - Created: 2026_06_21_110001_create_teams_table.php (name, description, department_id FK, is_active)
  - Created: 2026_06_21_110002_add_user_team_department_foreign_keys.php (FK constraints on users.team_id + users.department_id → nullOnDelete)
  - Models created: app/Models/Department.php, app/Models/Team.php (with relationships)
  - User model updated: team() and department() BelongsTo relationships added
  - All 3 migrations applied successfully
- [x] P1-03 — Seed roles and permissions via RolesAndPermissionsSeeder
  - Created: database/seeders/RolesAndPermissionsSeeder.php
  - 60 permissions across 10 modules: tickets(13), users(5), teams(4), departments(4), sla(4), automation(2), reports(3), kb(5), assets(5), audit(2), settings(6), canned_responses(3), notifications(2), api(2)
  - 5 roles created: super_admin(60), admin(60), supervisor(30), agent(15), client(7)
  - DatabaseSeeder updated to call RolesAndPermissionsSeeder first
  - Seeder is idempotent via firstOrCreate + syncPermissions
- [x] P1-04 — Build login page (AuthLayout, email + password form, remember me)
  - Backend: LoginRequest (validation + rate limiting using ticketing.security config), AuthService (attempt, redirectPath, logout), AuthController (showLogin, login, logout)
  - Routes: GET / and GET /login → showLogin (guest), POST /login → login (guest), POST /logout → logout (auth), GET /dashboard → placeholder (auth)
  - Frontend: Pages/Auth/Login.tsx — email field, password with show/hide toggle, remember me checkbox, forgot password link, register link
  - Pages/Dashboard/Index.tsx — placeholder for post-login redirect (real dashboard in Phase 7)
  - Build: 0 errors, 940 modules, Login-*.js 8.53 kB
- [x] P1-05 — Build client registration page with email verification
  - RegisterRequest: name/email/password/confirmation + Password::min(8)->letters()->numbers()
  - AuthService::register(): create user, assign client role, fire Registered event (triggers verification email), login
  - RegisterController: show (checks portal.registration_enabled config), store
  - VerifyEmailController: notice (redirect if already verified), verify (EmailVerificationRequest::fulfill)
  - EmailVerificationNotificationController: resend with throttle:6,1
  - Routes: GET/POST /register (guest), GET /email/verify (auth), GET /email/verify/{id}/{hash} (signed), POST /email/verification-notification (throttle), /dashboard moved behind verified middleware
  - Pages/Auth/Register.tsx: name, email, password+toggle, confirm password+toggle
  - Pages/Auth/VerifyEmail.tsx: email notice, resend button, Inertia logout
  - Build: 0 errors, 942 modules
- [x] P1-06 — Build forgot password / reset password flow
  - ForgotPasswordRequest + ForgotPasswordController: sends reset link via Password::sendResetLink, back with status on success
  - ResetPasswordRequest + ResetPasswordController: validates token/email/password/confirmation, calls Password::reset, fires PasswordReset event, redirects to login with status
  - Routes (guest): GET/POST /forgot-password, GET /reset-password/{token}, POST /reset-password
  - Pages/Auth/ForgotPassword.tsx: email field, success status display, back to sign in link
  - Pages/Auth/ResetPassword.tsx: read-only email, new password+toggle, confirm+toggle
  - Build: 0 errors, 944 modules
- [x] P1-07 — Build 2FA setup page (QR code, TOTP verification)
  - TwoFactorService: initiate (generate + persist secret), getQrCodeDataUri (BaconQrCode SVG → base64 data URI), verifyCode, enable (sets two_factor_confirmed_at), disable (clears both fields)
  - EnableTwoFactorRequest: digits:6 validation
  - TwoFactorSetupController: show (generates secret if needed, passes QR + secret to page), enable (verify code → set confirmed_at), disable (current_password validation)
  - Routes (auth+verified): GET/POST/DELETE /user/two-factor-setup
  - TwoFactorSetup.tsx: two states — setup (QR code image, formatted manual key, 6-digit input, enable button disabled until 6 chars) and enabled (success state, inline disable form with password confirm)
  - Build: 0 errors, 945 modules
- [x] P1-08 — Build 2FA challenge page (shown on login if 2FA enabled)
  - AuthController::login() updated: logs user out after Auth::attempt, stores two_factor_user_id + two_factor_remember in session, redirects to challenge
  - TwoFactorChallengeController: show() guards with session key, store() verifies code → Auth::login($user, $remember) → clears session keys → redirect to dashboard
  - TwoFactorChallengeRequest: digits:6 validation
  - Routes (guest): GET/POST /two-factor-challenge
  - TwoFactorChallenge.tsx: lock icon, large mono code input (centered, tracking, auto-strips non-digits), submit disabled until 6 chars, "use a different account" logout link
  - Full flow: login → 2FA intercept → challenge page → verify → dashboard
  - Build: 0 errors, 946 modules
- [x] P1-09 — Build user profile page (name, avatar, password change, 2FA toggle)
  - ProfileRequest: name/phone/job_title/timezone/locale/avatar validation (image max 2MB, mimes jpeg/png/webp)
  - PasswordUpdateRequest: current_password rule + new password confirmed min 8
  - ProfileController: edit() passes profileUser props (avatar_url via Storage::disk public), update() handles avatar upload/delete + field update
  - PasswordUpdateController: update password, back with success
  - Routes (auth+verified): GET/PATCH /profile, PATCH /profile/password
  - Profile/Edit.tsx: avatar click-to-upload with initials fallback, name/email(readonly)/phone/job_title/timezone select/locale select, password change with show/hide toggles, security card with 2FA badge + Manage link
  - Build: 0 errors, 947 modules
- [x] P1-10 — Build Admin: User list page (sortable, filterable, paginated)
  - Contracts/Repositories/UserRepositoryInterface.php: paginate(search, role, status, sortBy, sortDir, perPage)
  - Repositories/EloquentUserRepository.php: with(['roles:id,name','team:id,name','department:id,name']), role() scope filter, is_active filter, withQueryString()
  - Providers/RepositoryServiceProvider.php: binds interface → implementation; registered in bootstrap/providers.php
  - Services/UserService.php: listUsers(array $params) → sanitizes/defaults all filter params
  - Policies/UserPolicy.php: viewAny/view → users.view permission; auto-discovered by Laravel
  - Http/Requests/Admin/ListUsersRequest.php: authorize via Policy, validates search/role/status/sort_by/sort_dir/per_page
  - Http/Controllers/Admin/UserController.php: index() → Inertia render with transformed paginator, merged filters, role list
  - Route: GET /admin/users → admin.users.index (auth+verified group)
  - Pages/Admin/Users/Index.tsx: search (debounced 400ms), role filter, status filter, clear filters, sortable Table with avatar+initials+availability dot+VIP star, role badges, status badge, pagination with per-page selector
  - Sidebar updated: /users → /admin/users, supervisor role added
  - Build: 0 errors, 948 modules
- [x] P1-11 — Build Admin: Create / edit user form (role, team, department assignment)
  - UserRepositoryInterface: added create(array) and update(User, array) methods
  - EloquentUserRepository: implemented create() and update() via Eloquent
  - UserPolicy: added create() → users.create, update() → users.edit
  - UserService: added createUser() (assigns role via assignRole), updateUser() (syncRoles, skip empty password)
  - Requests/Admin/CreateUserRequest: name/email(unique)/password(required,confirmed)/phone/job_title/role(Rule::in)/team_id/department_id/timezone/locale/is_active/is_vip
  - Requests/Admin/UpdateUserRequest: same but password nullable, email Rule::unique ignore self
  - UserController: create() (Gate::authorize), store(), edit() (Gate::authorize), update() — 5 routes total
  - lib/constants.ts: shared TIMEZONES array
  - Pages/Admin/Users/Create.tsx: 3-card form (personal info, account settings, security+access) with Toggle component
  - Pages/Admin/Users/Edit.tsx: same structure, pre-filled, optional password, email editable
  - Index.tsx updated: actions column with PencilSquareIcon edit link per row
  - Build: 0 errors, 950 modules
- [x] P1-12 — Build Admin: Agent availability status toggle (Online/Busy/Away/Offline)
  - UpdateAvailabilityRequest: status ∈ [online,busy,away,offline]; authorize=true (any auth user)
  - AvailabilityController: PATCH /user/availability → userService->updateAvailability(user, status) → back()
  - UserService::updateAvailability(): delegates to repository update(['availability_status'])
  - Route: PATCH /user/availability → user.availability.update (auth+verified group)
  - Topbar.tsx: availability dot on avatar button; dropdown shows 2×2 status grid for staff roles (not clients); router.patch on click with preserveState+preserveScroll
  - Edit.tsx + UpdateUserRequest + UserController: availability_status added to admin edit form (select: Online/Busy/Away/Offline) so admins can force-set agent status
  - Build: 0 errors
- [x] P1-13 — Build Admin: Team management page (create, edit, assign agents)
  - TeamRepositoryInterface + EloquentTeamRepository: all() (withCount/with department), create/update/delete
  - RepositoryServiceProvider: TeamRepositoryInterface → EloquentTeamRepository binding added
  - TeamPolicy: viewAny/create/update/delete → teams.* permissions (auto-discovered)
  - TeamService: listTeams, createTeam, updateTeam (calls syncMembers), deleteTeam (nulls team_id on members first)
  - syncMembers: removes users no longer in member list, bulk-updates new members (handles cross-team moves)
  - CreateTeamRequest (name unique, department_id optional), UpdateTeamRequest (name unique-except-self, member_ids array)
  - TeamController: index/create/store/edit/update/destroy — 6 routes under /admin/teams
  - Pages/Admin/Teams/Index.tsx: Table with name/department/members count/status badge/edit link; row click navigates to edit
  - Pages/Admin/Teams/Create.tsx: name, description, department select, is_active Toggle
  - Pages/Admin/Teams/Edit.tsx: team details card + members card (searchable checkbox list of agents/supervisors with current-team warning); delete button with confirm
  - Sidebar: "Users & Teams" split into "Users" + "Teams" (UserGroupIcon); both visible to super_admin/admin/supervisor
  - Build: 0 errors, 6 routes
- [x] P1-14 — Build Admin: Department management page
  - DepartmentRepositoryInterface + EloquentDepartmentRepository: all() (withCount teams+users), create/update/delete
  - DepartmentPolicy: viewAny/create/update/delete → departments.* permissions (auto-discovered)
  - DepartmentService: listDepartments, createDepartment, updateDepartment, deleteDepartment (nulls department_id on users+teams before delete)
  - CreateDepartmentRequest (name unique), UpdateDepartmentRequest (name unique-except-self)
  - DepartmentController: 6 actions index/create/store/edit/update/destroy under /admin/departments
  - edit() passes teams in department with users_count (read-only, with link to edit each team)
  - Pages/Admin/Departments/Index.tsx: Table with name/teams count/users count/status/edit link
  - Pages/Admin/Departments/Create.tsx: name, description, is_active Toggle
  - Pages/Admin/Departments/Edit.tsx: details form + read-only teams list (with Edit links) + delete with confirm
  - RepositoryServiceProvider: DepartmentRepositoryInterface binding added
  - Sidebar: Departments nav item added (BuildingOffice2Icon, super_admin/admin/supervisor)
  - Build: 0 errors, 6 routes
- [x] P1-15 — Build Admin: Role permissions editor (granular permission matrix UI)
  - RoleService: syncPermissions(Role, array) → role->syncPermissions() + forgetCachedPermissions()
  - UpdateRolePermissionsRequest: authorize via settings.security permission; validates permissions array (exists:permissions,name)
  - PermissionsController: index() groups all 60 permissions by module prefix, returns roles/permission_groups/role_permissions; update() blocks super_admin edit (403), calls RoleService::syncPermissions
  - Routes: GET /admin/permissions → admin.permissions.index; PUT /admin/roles/{roleName}/permissions → admin.roles.permissions.update (defined before other parameterized routes)
  - Pages/Admin/Permissions/Index.tsx: matrix table; useState (not useForm); per-role Set<string> for local state; dirtyRoles Set tracks unsaved changes; Save button per column (disabled until dirty); super_admin + admin columns show CheckCircleIcon (locked, full access); router.put with preserveState+preserveScroll
  - Sidebar: KeyIcon import added; "Permissions" nav item at /admin/permissions (super_admin + admin only)
- [x] P1-16 — Build login history page (admin view all, user view own)
  - Migration: login_histories (user_id nullable FK, email, ip_address, user_agent, status enum success/failed, created_at; indices on [user_id,created_at] and created_at)
  - LoginHistory model: UPDATED_AT=null (no updated_at column), user() BelongsTo
  - LoginHistoryService: record(), forUser(User, limit=50), paginate(filters) — search by email/IP/name, filter by status/date range
  - AuthService updated: injects LoginHistoryService; records 'failed' (wrong credentials + inactive account) and 'success' on every login attempt
  - Admin/LoginHistoryController: GET /admin/login-history — abort unless audit.view permission; Pages/Admin/LoginHistory/Index.tsx — debounced search, status/date-from/date-to filters, parseBrowser() UA helper, paginated Table with CheckCircle/XCircle icons
  - LoginHistoryController: GET /profile/login-history → forUser last 50; Pages/Profile/LoginHistory.tsx — simple list card with back-link
  - Profile/Edit.tsx: "Login history → View" link added to Security card
  - types/index.d.ts: PaginatedData<T> and PaginationLink interfaces added (shared generic)
- [x] P1-17 — Build active sessions page with force-logout capability
  - SESSION_DRIVER switched to 'database' in .env + .env.example (sessions table already present in Laravel 13 default scaffold)
  - SessionService: getForUser(), revokeSession(user, sessionId) — user-scoped, revokeOtherSessions(), paginateAll(filters) — admin all authenticated sessions, revokeById() — admin force-logout; uses DB::table('sessions') directly
  - SessionController (user): GET /profile/sessions (index with is_current flag); DELETE /profile/sessions/others (revokeOtherSessions); DELETE /profile/sessions/{id} (revokeSession — blocks revoking own current)
  - Admin/SessionController: GET /admin/sessions (audit.view guard, paginated all auth sessions); DELETE /admin/sessions/{id} (blocks revoking own session)
  - Pages/Profile/Sessions.tsx: device list with parseBrowser+parseOS+timeAgo helpers; TrashIcon per-session revoke; "Sign out of N other sessions" bulk button; current session highlighted with "This device" badge
  - Pages/Admin/Sessions/Index.tsx: debounced search, per-page selector, 3-column grid per row (user/IP+browser/time); "Force logout" button; current admin session shows "Your session" badge (protected)
  - Profile/Edit.tsx: "Active sessions → Manage" link added above login history in Security card
  - Sidebar: DevicePhoneMobileIcon + "Active Sessions" nav item (/admin/sessions) in Developer group (super_admin+admin)
- [x] P1-18 — Unit tests: UserService, registration, login, 2FA
  - tests/Pest.php updated: global beforeEach clears Spatie permission cache; actingAsRole() creates role via firstOrCreate (no seeder required); seedRoles() helper runs full RolesAndPermissionsSeeder
  - tests/Feature/Auth/RegistrationTest.php (6 tests): happy path creates client role user + fires Registered event; rejects duplicate email, weak password, mismatched confirmation; redirect on registration disabled
  - tests/Feature/Auth/LoginTest.php (7 tests): successful login + redirect; records success/failed login_histories; updates last_login_at + last_login_ip; rejects wrong password + inactive account; redirects to 2FA challenge
  - tests/Feature/Auth/TwoFactorTest.php (7 tests): setup generates secret; enable with valid TOTP; rejects invalid code on setup + challenge; disable with correct password; rejects disable with wrong password; full 2FA challenge flow
  - tests/Feature/Admin/UserServiceTest.php (10 tests): paginate all; filter by name/email search; filter by role; filter by active/inactive; createUser assigns role + hashes password; updateUser skips empty password; hashes new password; syncRoles; updateAvailability
  - Bug fixed: TwoFactorSetupController + TwoFactorChallengeController passed Stringable to verifyCode() (which expects string) — fixed to use (string) $request->input('code')
  - 32/32 tests pass

---

## PHASE 2 — TICKET CORE
**Goal:** Full ticket CRUD with all metadata, custom fields, and bulk actions.

- [x] P2-01 — Migrations: tickets, ticket_replies, ticket_notes, ticket_statuses, ticket_categories, ticket_tags, ticket_tag_pivot, ticket_watchers, ticket_attachments
  - 9 migrations (120000–120008): ticket_statuses, ticket_categories (self-ref FK), ticket_tags, tickets (soft deletes, self-ref parent/merged FKs, priority enum, source enum), ticket_replies, ticket_notes, ticket_tag_pivot (composite PK), ticket_watchers, ticket_attachments
  - Models created: Ticket (SoftDeletes + all relationships), TicketStatus, TicketCategory, TicketTag, TicketReply, TicketNote, TicketWatcher, TicketAttachment
- [x] P2-02 — Migrations: custom_fields, custom_field_values, ticket_templates
  - 3 migrations (120009–120011): custom_fields (type enum), custom_field_values (unique ticket+field), ticket_templates (json tag_ids + custom_field_defaults)
  - Models created: CustomField, CustomFieldValue, TicketTemplate
  - All 12 migrations applied successfully to elts_db
- [x] P2-03 — Seed default statuses: Open, In Progress, On Hold, Resolved, Closed
  - DefaultStatusesSeeder: 5 statuses with colors (green/blue/yellow/purple/gray), sort_order, is_default (Open), is_closed (Closed)
  - DatabaseSeeder updated to call DefaultStatusesSeeder after RolesAndPermissionsSeeder
  - Seeded and verified in DB
- [x] P2-04 — Build TicketService with create/update/close/delete/merge methods
  - TicketRepositoryInterface + EloquentTicketRepository (paginate with 7 filters, findOrFail with all relations, create/update/delete)
  - TicketService: listTickets (client auto-filter by requester_id), createTicket (generates TKT-00001 ticket_number post-insert), updateTicket, closeTicket (uses is_closed status), deleteTicket (soft delete), mergeTickets (moves replies/notes/attachments/watchers in DB transaction)
  - RepositoryServiceProvider: TicketRepositoryInterface → EloquentTicketRepository binding added
- [x] P2-05 — Build Ticket index page: list view with filters (status, priority, category, assignee, date range), search, sort, pagination
  - TicketPolicy: viewAny/view/create/update/delete/merge/assign/reply/noteInternal/changeStatus/changePriority/export (auto-discovered)
  - ListTicketsRequest: authorize via TicketPolicy, validates 10 filter params
  - TicketController::index() (App\Http\Controllers\Tickets): passes paginated tickets, filters, statuses, categories, agents to Inertia
  - Route: GET /tickets → tickets.index (auth+verified group)
  - Pages/Tickets/Index.tsx: debounced search, 5 filter selects (status/priority/category/assignee), date range row, sortable Table with VIP star + tag chips, colored status badge, priority Badge with dot, requester/assignee avatars, pagination, per-page selector; client auto-sees only own tickets
  - types/index.d.ts: TicketStatus, TicketCategory, TicketTag, TicketUserMinimal, Ticket interfaces added
  - Build: 1288 modules, 0 errors
- [x] P2-06 — Build Ticket show page: full thread view (replies + notes interleaved), activity timeline sidebar
  - Pages/Tickets/Show.tsx: two-column layout (2/3 thread + 1/3 sidebar)
  - Thread: original description card + interleaved replies/notes sorted by created_at; internal notes styled with amber background + lock icon
  - Reply/Note form tabs with TiptapEditor (hidden from clients); router.post to /tickets/{id}/replies or /notes
  - Sidebar: status/priority/assignee/team selects (immediate router.patch on change), requester info card, due date, activity timeline
  - Tags chip display, VIP star in header, delete button (confirm dialog)
- [x] P2-07 — Build Ticket create form: subject, description (Tiptap), category, priority, custom fields, attachments, assignee
  - Pages/Tickets/Create.tsx: subject Input, TiptapEditor for description (driven by useForm setData), priority/category selects, assignee/team selects, status select (defaults to is_default status), due date, custom fields (text/textarea/select/number/date types), VIP checkbox
  - useForm post('/tickets') — description synced into form via setData('description', html)
- [x] P2-08 — Build Ticket reply form: WYSIWYG editor (Tiptap), file attach, CC/BCC, canned response selector
  - TiptapEditor.tsx: full toolbar (Bold/Italic/Underline/Strike/H2/H3/BulletList/OrderedList/Blockquote/Code/CodeBlock)
  - Reply tab in Show.tsx: router.post to /tickets/{id}/replies; CreateReplyRequest validates + authorizes
  - TicketReplyController: store() → TicketService::addReply() (sets first_response_at if null + actor is not requester)
- [x] P2-09 — Build Internal note form: same editor but marked private, not visible to client
  - Note tab in Show.tsx: amber-styled, lock icon, "Internal Note" label; hidden from client (can.note_internal check)
  - TicketNoteController: store() → TicketService::addNote()
- [x] P2-10 — Build ticket status change controls (drag-to-status or dropdown)
  - Sidebar status select in Show.tsx: immediate router.patch to /tickets/{id}/status
  - TicketController::changeStatus() + TicketService::changeStatus() (auto-sets/clears closed_at)
- [x] P2-11 — Build ticket priority change control
  - Sidebar priority select in Show.tsx: immediate router.patch to /tickets/{id}/priority
  - TicketController::changePriority() + TicketService delegates to repository update
- [x] P2-12 — Build ticket assignment control (assign to agent, team)
  - Sidebar assignee + team selects in Show.tsx: immediate router.patch to /tickets/{id}/assign
  - TicketController::assign() + AssignTicketRequest validates assignee_id/team_id
  - Build: 1343 modules, 0 errors (Tiptap chunk: 422 kB)
- [x] P2-13 — Build tag management: add/remove tags on ticket, tag CRUD in settings
  - TicketService: addTag (syncWithoutDetaching) + removeTag (detach)
  - AddTagRequest: authorize via update policy, validates tag_id exists
  - TicketTagController: store (attach) + destroy (detach) → back()
  - CreateTagRequest + UpdateTagRequest: name unique/unique-except-self, color hex regex
  - Admin/TagController: index (withCount tickets), store, update, destroy (detach all tickets first)
  - Routes: POST/DELETE /tickets/{ticket}/tags/{tag}, GET/POST/PUT/DELETE /admin/tags
  - TicketController::show() now passes allTags + can.update
  - Show.tsx: TagPicker component — inline chip display with X to remove, dropdown to add (filters already-attached tags); outside-click closes dropdown
  - Pages/Admin/Tags/Index.tsx: create form with 8 preset color swatches + custom color input + live preview chip; inline edit rows (click pencil → editable row with save/cancel); delete with confirm
  - Sidebar: Tags nav item (TagIcon, supervisor/admin/super_admin)
  - Build: 0 errors
- [x] P2-14 — Build ticket watcher subscribe/unsubscribe
  - TicketPolicy::watch() — delegates to view() (any viewer can watch)
  - TicketService: addWatcher (firstOrCreate), removeWatcher (delete by ticket+user)
  - TicketWatcherController: store (POST /tickets/{ticket}/watch) + destroy (DELETE) with Gate::authorize watch
  - Routes: POST/DELETE /tickets/{ticket}/watch → tickets.watch / tickets.unwatch
  - TicketController::show(): passes is_watching flag (contains user_id check) + can.watch
  - Show.tsx: Watchers sidebar card — Watch/Unwatch button (BellIcon/BellSlashIcon toggle), watcher avatar initials grid with name tooltip
  - Build: 0 errors
- [x] P2-15 — Build bulk actions: select multiple tickets → assign / close / change status / tag / delete
  - BulkActionRequest: validates ticket_ids array + action enum + conditional assignee_id/status_id
  - TicketService::bulkAction(): iterates tickets, dispatches to existing service methods via match
  - BulkTicketController: per-action Gate checks (assign/changeStatus policy, delete permission)
  - Route: POST /tickets/bulk (placed before /{ticket} wildcard)
  - Index.tsx: checkbox column with stopPropagation, select-all header checkbox (indeterminate state via ref), selectedIds state, blue bulk action bar (appears when any selected) with action select + conditional status/assignee inputs + Apply/Clear; row highlighted when selected; selected count shown in header
  - Build: 0 errors
- [x] P2-16 — Build ticket merge UI (select target ticket, confirm, preserve thread)
  - TicketSearchController (invokable): GET /tickets/search → JSON; filters merged/deleted, excludes source, min 2 chars, limit 10
  - MergeTicketRequest: authorize merge policy; validates target_ticket_id exists + not deleted + not already merged + not self
  - TicketMergeController: POST /tickets/{ticket}/merge → mergeTickets() → redirect to target with success flash
  - Routes: GET /tickets/search + POST /tickets/{ticket}/merge (both before /{ticket} wildcard)
  - TicketController::show(): passes can.merge (class-level policy)
  - Show.tsx: MergeModal component — debounced axios search with loading state, results dropdown, selected target card (green), warning banner explaining what happens, ESC/backdrop to close; ArrowsRightLeftIcon button in header (only when can.merge)
- [x] P2-17 — Build parent-child ticket linking UI
  - LinkParentRequest (validates not-self, not-child, not-deleted/merged), TicketLinkController (store/destroy), TicketService::linkParent()
  - Show.tsx: "Linked Tickets" sidebar card with LinkParentModal (debounced search), parent display + unlink, child list as links
- [x] P2-18 — Build Admin: Custom status management (create, edit, reorder, set color)
  - CreateStatusRequest + UpdateStatusRequest (name unique, color #RRGGBB regex, sort_order, is_default, is_closed)
  - Admin/StatusController: store/update clear other defaults in DB transaction; destroy blocks if tickets > 0 or is_default
  - Pages/Admin/Statuses/Index.tsx: inline create/edit, color picker with preset swatches + native input, DEFAULT/CLOSED badges, tickets count
- [x] P2-19 — Build Admin: Category & subcategory management (tree editor)
  - CreateCategoryRequest + UpdateCategoryRequest; Admin/CategoryController (destroy nulls children + ticket category_id)
  - Pages/Admin/Categories/Index.tsx: CategoryForm with parent select (excludes self+children on edit); renderRow() recursive tree display
- [x] P2-20 — Build Admin: Custom field management (define fields per category)
  - CreateCustomFieldRequest (name ^[a-z0-9_]+$, unique; label, type enum, options required for select/radio) + UpdateCustomFieldRequest
  - Admin/CustomFieldController (destroy deletes values first); Pages/Admin/CustomFields/Index.tsx (auto-name from label, readonly on edit)
- [x] P2-21 — Build Admin: Ticket template management
  - CreateTemplateRequest + UpdateTemplateRequest; Admin/TicketTemplateController (CRUD, created_by set on store)
  - Pages/Admin/Templates/Index.tsx + Create.tsx + Edit.tsx: TiptapEditor body, tag multi-select chips, category/priority selects
- [x] P2-22 — Build file attachment upload (drag-drop, preview, size limit enforcement)
  - StoreAttachmentRequest (max size from config ticketing.tickets.max_attachment_size_mb); TicketAttachmentController (store/download/destroy)
  - TicketService::addAttachment (stores in local disk attachments/{ticket_id}/) + removeAttachment
  - Show.tsx: drag-and-drop dropzone + file list with humanSize() + download/delete per file
- [x] P2-23 — Build @mention autocomplete in Tiptap editor
  - UserMentionController (invokable): searches agents by name/email, returns [{id, label, email}]
  - MentionList.tsx: forwardRef component with arrow key + Enter navigation
  - TiptapEditor.tsx: Mention extension with tippy.js popup; MentionExtension with suggestion.items (axios /users/mention-search) + render with createRoot
- [x] P2-24 — Build activity timeline component (full diff view of all ticket changes)
  - Show.tsx: activity section with LABEL_KEY_MAP for display names, old→new diff per changed field
  - Expand/collapse toggle (5 items default, "Show all N / Show less" button)
- [x] P2-25 — Feature tests: ticket CRUD, reply, note, bulk actions
  - TicketFactory + TicketStatusFactory created; Ticket + TicketStatus models gain HasFactory
  - TicketCRUDTest (6 tests), TicketReplyNoteTest (5 tests), BulkActionTest (5 tests)
  - All 16 tests pass; TicketPolicy corrected (tickets.view_all/own, tickets.note)

---

## PHASE 3 — EMAIL INTEGRATION
**Goal:** Bidirectional email — incoming creates tickets, outgoing notifies users.

- [x] P3-01 — Migration: mailboxes, incoming_emails tables
  - mailboxes: name, host, port, encryption enum (ssl/tls/starttls/none), username, password (encrypted cast), mailbox_folder, is_active, last_polled_at, created_by FK nullable
  - incoming_emails: mailbox_id FK nullable, ticket_id FK nullable, message_id (unique — prevents reprocessing), from_email, from_name, to_email, subject, body_text/html (longtext), attachments (json), status enum (pending/processed/failed/duplicate), failure_reason, received_at, processed_at
  - Models: Mailbox (encrypted password cast, createdBy/incomingEmails relations), IncomingEmail (array cast on attachments, mailbox/ticket BelongsTo, isPending/isProcessed helpers)
  - Note: migrations require Laragon running to apply — syntax verified clean
- [x] P3-02 — Build Mailbox model and MailboxService (IMAP poll via webklex)
  - MailboxService: testConnection() (connect+disconnect, returns bool), pollMailbox() (fetch unseen messages since last_polled_at, dedup by message_id, store as IncomingEmail records, update last_polled_at), pollAllActive() (loops active mailboxes, swallows per-mailbox failures)
  - makeClient(): uses ImapClient::make() facade — inherits imap.php options (soft_fail, fetch_body, etc.) and overrides credentials from DB
  - extractMessageId(): prefers RFC 2822 Message-ID header, falls back to uid-{mailboxId}-{uid}
  - Attachment metadata ({name, size, mime_type}) stored in JSON; bodies stored as body_text/body_html
  - Soft fail per message AND per mailbox so one bad email/mailbox never aborts the batch
- [x] P3-03 — Build ProcessIncomingEmail job (parse email → create ticket or append reply)
  - Detects reply by TKT-NNNNN in subject; find-or-creates client user from from_email; marks processed/failed; failed() hook for retry exhaustion
  - Dispatched by MailboxService immediately after creating each IncomingEmail record
- [x] P3-04 — Schedule ProcessIncomingEmail every 2 minutes in Kernel.php
  - PollMailboxes artisan command; routes/console.php: schedule->command('mailboxes:poll')->everyTwoMinutes()
- [x] P3-05 — Build outgoing email templates (Blade): ticket_created, reply_received, ticket_resolved, ticket_closed, ticket_assigned
  - resources/views/emails/layout.blade.php + 5 event views; branded HTML with inline styles, ticket-box card, CTA button
- [x] P3-06 — Build SendTicketEmail job (queued, dispatched on ticket events)
  - TicketMail Mailable: resolves subject/body from EmailTemplate DB record ({{variable}} interpolation) or falls back to Blade view
  - SendTicketEmail job: queued, 3 tries, CC support
- [x] P3-07 — Wire events: TicketCreated → SendTicketEmail, TicketReplied → SendTicketEmail, etc.
  - Events: TicketCreated, TicketReplied, TicketStatusChanged, TicketAssigned
  - SendTicketNotification listener (4 handlers); registered in AppServiceProvider
  - TicketService fires events: createTicket, addReply, changeStatus (transition-only), assign (on change)
- [x] P3-08 — Build Admin: Mailbox management page (add IMAP credentials, test connection, enable/disable)
  - MailboxController, CreateMailboxRequest, UpdateMailboxRequest, MailboxPolicy (settings.email)
  - POST /admin/mailboxes/{mailbox}/test JSON endpoint; Pages/Admin/Mailboxes/Index.tsx with inline form + test button
- [x] P3-09 — Build Admin: Email template editor (customize subject + body per event type)
  - email_templates migration + EmailTemplate model (event_name unique, subject/body nullable = use default)
  - EmailTemplateController (updateOrCreate); Pages/Admin/EmailTemplates/Index.tsx (expand/collapse per event, TiptapEditor, variable palette)
- [x] P3-10 — Build email bounce/failure detection and log to `incoming_emails.status`
  - ProcessIncomingEmail::failed() marks final failure after all retries; try/catch marks 'failed' + failure_reason on first exception
- [x] P3-11 — Build CC/BCC on ticket replies (store + include in outgoing email)
  - reply.cc parsed and passed as CC array to SendTicketEmail; stored in ticket_replies.cc column
- [x] P3-12 — Feature tests: incoming email parsing, outgoing email dispatch
  - IncomingEmailTest (5 tests), OutgoingEmailTest (5 tests)
  - MailboxFactory + IncomingEmailFactory (processed/failed/withReplySubject states)

---

## PHASE 4 — SLA MANAGEMENT
**Goal:** Configurable SLA policies with real-time tracking and breach alerts.

- [x] P4-01 — Migrations: sla_policies, sla_records, business_hours, holidays
  - sla_policies: name, priority (nullable enum = applies to all), first_response_minutes, resolution_minutes, uses_business_hours, is_active
  - sla_records: ticket_id (unique FK), sla_policy_id FK, first_response_due/resolution_due, breached booleans, met_at timestamps, paused_at, paused_minutes (accumulated)
  - business_hours: sla_policy_id (nullable = global default), day_of_week 0–6, is_open, open_time/close_time, timezone; unique(policy, day)
  - holidays: sla_policy_id (nullable = global), name, date, recurring_yearly
  - Models: SlaPolicy (formatMinutes labels, relations), SlaRecord (isPaused(), resolutionStatus() → ok/warning/breached/met), BusinessHour (dayName() helper), Holiday
- [x] P4-02 — Build SLAService: calculate due times respecting business hours + holidays
  - SLAService: createRecord(), findPolicy() (priority-specific → catch-all), calculateDue() (calendar or business-hours path)
  - addBusinessMinutes(): walks business-hour windows day-by-day, skips closed days and holidays, respects per-day timezone
  - DEFAULT_HOURS fallback: Mon–Fri 09:00–17:00 UTC when no DB config exists
  - loadHoursMap(): policy-specific → global (sla_policy_id null) → DEFAULT_HOURS
  - loadHolidayDates(): policy + global holidays; recurring_yearly matches on m-d only
  - checkFirstResponseMet() / checkResolutionMet(): stamp met_at + breached flag
  - Ticket model: added slaRecord() HasOne relation
- [x] P4-03 — Build SLARecord creation on ticket open (first_response_due, resolution_due)
  - TicketService: injected SLAService; createTicket() calls slaService->createRecord() after ticket refresh
  - addReply(): calls slaService->checkFirstResponseMet() on first agent reply
  - changeStatus(): calls slaService->checkResolutionMet() on first close/resolve transition
- [x] P4-04 — Build CheckSLABreaches job (scheduled every 5 min, marks breached=true, fires event)
  - SLABreached event: ticket, record, type ('first_response'|'resolution')
  - CheckSLABreaches job (ShouldQueue): chunkById(100) on overdue unbreached records for both SLA types; updates breached flag then dispatches SLABreached
  - routes/console.php: $schedule->job(new CheckSLABreaches)->everyFiveMinutes() activated
- [x] P4-05 — Build SLABreached event + listener (sends in-app + email alert)
  - SendSLABreachNotification listener: creates TicketNote (in-app breach marker); dispatches SendTicketEmail to assignee with 'sla_breached' event
  - sla_breached blade template: red alert header, ticket details box, "View Ticket" CTA button
  - EmailTemplate::$events: added 'sla_breached' entry (visible in admin email template editor)
  - TicketMail::resolveSubject(): added 'sla_breached' case with subject pattern
  - AppServiceProvider: wired SLABreached → SendSLABreachNotification::handle
- [x] P4-06 — Build SLA pause/resume on ticket (sets paused_at, adjusts due times on resume)
  - SLAService::pause(): sets paused_at=now() if not already paused
  - SLAService::resume(): computes wall-clock minutes paused, accumulates paused_minutes, extends first_response_due + resolution_due by that amount (calendar minutes), clears paused_at
  - TicketSlaController: pause() + resume() — Gate::authorize('update', $ticket); returns back() with flash
  - Routes: POST /tickets/{ticket}/sla/pause (tickets.sla.pause), POST /tickets/{ticket}/sla/resume (tickets.sla.resume)
- [x] P4-07 — Build SLA status badge on ticket (Green / Yellow warning / Red breached)
  - TicketController::show(): eager-loads slaRecord.policy; passes sla{} object with status, paused, due diffs, breached flags, met_at diffs, policy_name
  - SlaData interface + SlaData added to TicketData in Show.tsx
  - SLARow helper: renders first_response / resolution row with met / breached / due states
  - SLAPanel component: overall status pill (color-coded), paused banner, SLARow pair, policy name, Pause/Resume toggle (canUpdate only)
  - SLA panel inserted in right sidebar after tags, before Linked Tickets
  - Build: 0 errors
- [x] P4-08 — Build Admin: SLA policy management page (create, edit, assign to priority/tier)
  - SlaPolicyPolicy: viewAny→sla.view; create/update/delete→sla.manage (auto-discovered)
  - CreateSlaPolicyRequest + UpdateSlaPolicyRequest: validate name, priority enum nullable, first_response/resolution_minutes, uses_business_hours, is_active
  - SlaPolicyController: index (withCount slaRecords, ordered by priority), store, update, destroy
  - Admin/SlaPolicies/Index.tsx: inline PolicyForm (create/edit), table rows with priority badge, time labels, business-hours flag, record count; delete confirm
  - Routes: GET/POST /admin/sla-policies, PUT/DELETE /admin/sla-policies/{slaPolicy}
  - Sidebar: "SLA Policies" entry with ClockIcon (super_admin/admin)
  - Build: 0 errors
- [x] P4-09 — Build Admin: Business hours configuration (per team, day-of-week schedule)
  - BusinessHourController: index() groups rows by policy_id (null→'global'); builds 7-day schedule maps with Mon–Fri defaults; update() validates and upserts 7 BusinessHour rows per policy
  - Admin/BusinessHours/Index.tsx: left-panel policy selector (Global Default + each SLA policy); right-panel ScheduleEditor with 7-row table (open toggle, time range inputs, per-row timezone select); "Apply timezone to all" shortcut; key={selected} forces remount on policy switch
  - Routes: GET/PUT /admin/business-hours (admin.business-hours.index / .update)
  - Sidebar: "Business Hours" with AdjustmentsHorizontalIcon (super_admin/admin)
  - Build: 0 errors
- [x] P4-10 — Build Admin: Holiday calendar management
  - HolidayController: index() groups holidays by policy_id (null→'global'); store() validates + creates; destroy() deletes
  - Admin/Holidays/Index.tsx: left-panel policy selector (Global + each SLA policy); right-panel table with date, recurring badge, delete; AddHolidayForm inline at bottom; key={selected} resets form on policy switch
  - Routes: GET/POST /admin/holidays, DELETE /admin/holidays/{holiday}
  - Sidebar: "Holidays" with CalendarDaysIcon (super_admin/admin)
  - Build: 0 errors
- [x] P4-11 — Feature tests: SLA calculation, breach detection, pause/resume
  - SlaPolicyFactory: forPriority(), businessHours(), inactive() states
  - SlaRecordFactory: overdue(), met() states
  - SlaCalculationTest (7 tests): calendar due times, catch-all fallback, no-policy null record, business-hours day-boundary, weekend start advance, checkFirstResponseMet met/breached
  - SlaBreachPauseTest (10 tests): first_response breach, resolution breach, SLABreached event dispatch x2, no re-breach, no breach on met records, pause/idempotent, resume extends due times, resume no-op, breach note in ticket
  - Fixed Carbon diffInMinutes direction in SLAService::resume() (paused_at.diffInMinutes(now) not now.diffInMinutes(paused_at))
  - All 17 tests passing

---

## PHASE 5 — AUTOMATION & WORKFLOWS
**Goal:** Visual rule builder that auto-handles tickets based on configurable conditions.

- [x] P5-01 — Migrations: automation_rules, automation_conditions, automation_actions
  - automation_rules: name, description, event enum (5 events), match_type (all/any), is_active, sort_order; compound index on [event, is_active, sort_order]
  - automation_conditions: automation_rule_id FK (cascadeOnDelete), field(60), operator(30), value(500), sort_order
  - automation_actions: automation_rule_id FK (cascadeOnDelete), action_type(60), value text nullable, sort_order
  - 2026_06_22_150003: users.skills json column added (for skill-based routing in P5-08)
  - Models: AutomationRule (HasFactory, active() scope, conditions/actions HasMany), AutomationCondition, AutomationAction (both BelongsTo rule)
- [x] P5-02 — Build AutomationService: evaluate rules against ticket on create/update events
  - evaluate(Ticket, event): loads active rules for event ordered by sort_order, tests each rule's conditions, applies actions if matched
  - matchesConditions(): match_type=all requires every condition true; any requires at least one
  - evaluateCondition(): 8 operators — equals, not_equals, contains, not_contains, starts_with, ends_with, is_empty, is_not_empty
  - extractField(): maps 10 ticket fields — status, priority, category, tag, subject, description, requester_email, assignee, team, source, is_vip
- [x] P5-03 — Build RunAutomationRules job (queued, triggered by ticket events)
  - RunAutomationRules job: ShouldQueue, 3 tries, 30s backoff; guards against trashed tickets
  - TicketService wired: dispatches RunAutomationRules on ticket_created, ticket_status_changed, ticket_replied
- [x] P5-04 — Implement action handlers: assign, tag, change priority, change status, send notification, escalate, close
  - 11 action types: assign_to, assign_round_robin, assign_by_skill, add_tag, remove_tag, change_status (handles closed_at), change_priority, send_notification (SendTicketEmail dispatch), add_note ('[Automation]' prefix), close (finds first is_closed status), escalate (priority→critical + email all supervisors)
  - Per-action try/catch logs warning on failure without aborting remaining actions
- [x] P5-05 — Build Admin: Automation rule list page
  - Admin/Automations/Index.tsx: table with event badge, match_type, condition count, action count, active toggle, edit/delete links
  - AutomationRulePolicy: viewAny/create/update/delete → automation.manage permission (auto-discovered)
  - Sidebar: "Automations" entry (BoltIcon, super_admin/admin)
- [x] P5-06 — Build Admin: Rule builder UI (visual if/then editor with condition + action blocks)
  - Admin/Automations/Edit.tsx: form with name/description/event/match_type/is_active; condition rows (field select + operator select + value input); action rows (action_type select + value input); add/remove row buttons
  - AutomationController: index/create/store/edit/update/destroy/toggle; syncConditionsAndActions() helper; DELETE+recreate on update
  - Routes: GET/POST /admin/automations, GET/PUT/DELETE /admin/automations/{automation}, PATCH /admin/automations/{automation}/toggle
- [x] P5-07 — Build round-robin assignment logic in AutomationService
  - actionAssignRoundRobin(): prefers online/busy agents; falls back to all agents; picks agent with fewest open (non-closed) tickets via aggregated subquery
- [x] P5-08 — Build skill-based routing (tag-to-agent-skill matching)
  - actionAssignBySkill(): matches ticket tag names (lowercased) against agent skills[] (lowercased); among matching agents picks least-loaded by open tickets; falls back to round-robin if no match or no tags
  - users.skills json column added via 2026_06_22_150003 migration; User model $casts updated
- [x] P5-09 — Build auto-close stale tickets command (configurable days in settings)
  - AutoCloseStaleTickets command: signature tickets:auto-close --days=30; chunkById(100); sets closed status + creates '[Auto-close]' internal note; reports count
  - Scheduled daily in routes/console.php
- [x] P5-10 — Feature tests: rule evaluation, all action types, round-robin
  - AutomationRuleFactory: forEvent(), matchAny(), inactive() states
  - AutomationTest.php (14 tests): equals/not-match/contains/is_empty/any-match conditions; change_priority/change_status/add_tag/remove_tag/add_note/close/assign_round_robin/assign_by_skill actions; inactive rule skipped

---

## ✅ PHASE 5 COMPLETE — All 10 tasks done

---

## PHASE 6 — CANNED RESPONSES
**Goal:** Agents can save and reuse reply templates.

- [x] P6-01 — Migration: canned_responses table (title, body, scope: global/team/personal)
  - canned_responses: title(200), body text, scope enum (global/team/personal default global), user_id nullable FK (nullOnDelete, personal scope), team_id nullable FK (nullOnDelete, team scope), is_active; index [scope, is_active]
  - CannedResponse model: $fillable, is_active bool cast, user()/team() BelongsTo, scopeVisibleTo(User) — shows global + matching team + own personal
- [x] P6-02 — Build CannedResponse CRUD (admin: global/team, agent: personal)
  - CannedResponsePolicy: view/create/update/delete → canned_responses.* permissions (auto-discovered)
  - Admin/CannedResponseController: index (grouped by scope), store, update, destroy
  - Admin/CannedResponses/Index.tsx: create form with scope select (team select shown when scope=team, user select shown when scope=personal), title, body textarea; inline edit rows; delete confirm; scope badge
- [x] P6-03 — Build canned response selector in Tiptap editor (search + insert)
  - CannedResponseSearchController (invokable): GET /canned-responses/search?q=&ticket_id=; scopeVisibleTo filter; limit 20; returns id/title/scope/body (interpolated if ticket_id provided)
  - CannedResponsePicker.tsx: debounced search input, results list with scope badge, click inserts interpolated body into editor
  - TiptapEditor.tsx: BookmarkIcon toolbar button opens/closes CannedResponsePicker panel below toolbar
- [x] P6-04 — Variable support in canned responses: {{client_name}}, {{ticket_id}}, {{agent_name}}
  - CannedResponseSearchController::interpolate(): replaces {{client_name}}, {{ticket_id}}, {{ticket_number}}, {{agent_name}} when ticket context is provided

---

## ✅ PHASE 6 COMPLETE — All 4 tasks done

---

## PHASE 7 — REPORTS & ANALYTICS
**Goal:** Rich dashboard + custom report builder + scheduled exports.

- [x] P7-01 — Build ReportService with all metric calculation methods
  - kpiSummary(from, to): ticket_volume, open_tickets, avg_first_response_minutes, avg_resolution_minutes, sla_compliance_pct
  - ticketVolumeTrend(from, to, groupBy): date-filled series (day/week/month) with human-readable labels
  - firstResponseByAgent / firstResponseByTeam: avg_minutes + count per agent/team
  - slaCompliancePct(from, to): overall % compliance; slaCompliance(): full breakdown (total/fr_breached/res_breached/compliant)
  - agentPerformance(from, to): per-agent tickets_handled/avg_resolution/avg_first_response/sla_compliance_pct
  - teamComparison(from, to): per-team tickets_handled/avg_resolution
  - ticketsByPriority / ticketsByStatus / ticketsByCategory: count breakdowns
  - customReport(params): flexible metric×groupBy query with filters (priority/status/category/assignee/team)
  - formatMinutes(float): static helper — converts minutes to "2h 15m" display string
- [x] P7-02 — Build main dashboard page: KPI cards (open tickets, avg resolution time, SLA compliance %, CSAT score)
  - DashboardController (invokable): from/to/granularity params → kpiSummary + ticketVolumeTrend via ReportService
  - Route updated: GET /dashboard → DashboardController (replaces closure)
  - Recharts installed (recharts package)
  - Dashboard/Index.tsx: date-range + granularity filter bar (Apply button); 5 KPI cards (open/new/avg-first-response/avg-resolution/SLA); AreaChart trend (Recharts) with gradient fill, zero-gap labels, empty state; SLA card color-coded green/amber/red by threshold
- [x] P7-03 — Build ticket volume trend chart (line chart, daily/weekly/monthly toggle)
  - Implemented as part of P7-02: AreaChart on dashboard with day/week/month granularity selector, zero-filled gaps, human-readable labels
- [x] P7-04 — Build first response time chart (bar chart per agent/team)
  - ReportsController: GET /reports with from/to/group_by params; firstResponseByAgent or firstResponseByTeam via ReportService
  - Route: GET /reports → reports.index (auth+verified)
  - Reports/Index.tsx: date filter bar; "First Response Time" section with agent↔team toggle (immediate router.get); Recharts BarChart with per-bar color cycle, angled X labels, minute-formatted Y axis, custom tooltip; sortable summary table below chart
- [x] P7-05 — Build SLA compliance gauge chart
  - ReportsController: sla_compliance added via ReportService::slaCompliance()
  - SlaGauge component: Recharts PieChart as semicircle (startAngle=180→0), inner radius donut, colour-coded green/amber/red by threshold (≥90/≥70/<70), centre label with % + "compliant" subtitle
  - 4-stat grid: total SLA tickets, fully compliant, first-response breached, resolution breached
  - Empty state when no SLA records exist for period
- [x] P7-06 — Build agent performance scorecard table (tickets handled, avg resolution, CSAT, SLA compliance)
  - ReportsController: agent_performance added via ReportService::agentPerformance()
  - Reports/Index.tsx: sortable scorecard table — agent name, tickets handled, avg first response, avg resolution, SLA % (color-coded green/amber/red), CSAT (— until Phase 9)
  - tabular-nums alignment, hover row highlight, empty state
- [x] P7-07 — Build team comparison bar chart
  - ReportsController: team_comparison added via ReportService::teamComparison()
  - Reports/Index.tsx: dual-axis BarChart — left axis tickets resolved (indigo), right axis avg resolution time (violet, minute-formatted); angled X labels; custom tooltip formats minutes; manual legend below chart; empty state
- [x] P7-08 — Build ticket breakdown charts (by priority, by status, by category — pie/donut)
  - ReportsController: by_priority, by_status, by_category passed from ReportService
  - Reports/Index.tsx: reusable DonutChart component (donut + legend with percentages); priority uses semantic colors (critical=red, high=orange, medium=amber, low=green); status uses is_closed flag (green=closed, palette for open); category uses 10-color palette; 3-column responsive grid
- [x] P7-09 — Build custom report builder page (metric selector, date range, group by, filter)
  - ReportsController::custom() — date range, metric (volume/avg_resolution), group_by (day/week/month/priority/status/category/agent/team), 5 optional filters (priority/status/category/agent/team); passes statuses/categories/agents/teams select options to frontend
  - Route: GET /reports/custom → reports.custom
  - Pages/Reports/Custom.tsx: parameter panel (4-col core + 5-col filter grid, active-filter indicator, Clear Filters button); BarChart with time/count Y-axis switching; results table with total footer; empty state
  - Sidebar.tsx: "Custom Report" nav item added (PresentationChartLineIcon, supervisor+ roles)
- [x] P7-10 — Build PDF export (DomPDF — dashboard snapshot + custom report)
  - ReportsController::exportPdf() → GET /reports/export/pdf → overview-pdf.blade.php (KPIs, ticket breakdown, SLA compliance, agent performance)
  - ReportsController::exportCustomPdf() → GET /reports/custom/export/pdf → custom-pdf.blade.php (results table with % column + total footer, filter chips)
  - Both Blade views: DejaVu Sans font, inline CSS, DomPDF-compatible table layout, A4 portrait
  - Reports/Index.tsx: "PDF" download link button (ArrowDownTrayIcon) appended to filter bar
  - Reports/Custom.tsx: "Export PDF" download link (ArrowDownTrayIcon) at right end of actions row
- [x] P7-11 — Build Excel/CSV export (maatwebsite/excel)
  - app/Exports/CustomReportExport.php: FromArray + WithHeadings + WithTitle + ShouldAutoSize; 5 columns (group label, count, % of total, avg resolution min, avg resolution formatted); total footer row
  - app/Exports/OverviewReportExport.php: single sheet with labeled sections (KPIs, SLA, by priority, by status, by category, agent performance)
  - ReportsController: exportOverviewExcel(), exportExcel(), exportCsv() — shared filter logic extracted into private resolveCustomParams()
  - Routes: GET /reports/export/excel, /reports/custom/export/excel, /reports/custom/export/csv
  - Reports/Index.tsx: "Excel" download button added next to PDF button
  - Reports/Custom.tsx: PDF/Excel/CSV export buttons grouped in actions row (ml-auto)
- [x] P7-12 — Build scheduled report configuration (pick report, schedule, recipient emails)
  - Migration: scheduled_reports (name, type, format, schedule, day_of_week, day_of_month, time_of_day, recipients JSON, params JSON, is_active, created_by FK)
  - Model: ScheduledReport (recipients/params cast to array, creator BelongsTo)
  - Policy: ScheduledReportPolicy (viewAny=admin/supervisor, create/update/delete=admin only)
  - Request: ScheduledReportRequest (resolvedRecipients() strips invalid emails from newline/comma input)
  - Controller: Admin\ScheduledReportController (index/create/store/edit/update/destroy/toggle — 7 routes)
  - Pages/Admin/ScheduledReports/Index.tsx: table with type/format badges, schedule label, active toggle, edit/delete actions
  - Pages/Admin/ScheduledReports/Create.tsx + Edit.tsx: wrap shared Form.tsx
  - Pages/Admin/ScheduledReports/Form.tsx: conditional custom params section (when type=custom), conditional day selector (weekly/monthly), recipients textarea, active toggle
  - Sidebar: "Scheduled Reports" nav item (CalendarDaysIcon, Resources group, admin+supervisor)
  - NOTE: migration pending MySQL start (php artisan migrate)
- [x] P7-13 — Build GenerateScheduledReport job (render + attach + email)
  - app/Console/Commands/DispatchScheduledReports.php — artisan reports:dispatch-scheduled; runs every minute, checks H:i + day_of_week/day_of_month against active scheduled reports, dispatches jobs for due ones
  - app/Jobs/GenerateScheduledReport.php — ShouldQueue, 3 tries, 120s timeout; computes date range (daily=yesterday, weekly=last week, monthly=last month); builds PDF via DomPDF or Excel/CSV via Excel::raw(); sends ScheduledReportMail to each recipient
  - app/Mail/ScheduledReportMail.php — subject includes report name + date range; attaches file content via Attachment::fromData(); uses emails.scheduled-report view
  - resources/views/emails/scheduled-report.blade.php — extends emails.layout; shows report name, period, type, format, schedule
  - routes/console.php — reports:dispatch-scheduled scheduled everyMinute()
- [x] P7-14 — Feature tests: metric calculations, export generation
  - tests/Feature/Reports/ReportMetricsTest.php — 10 tests: kpiSummary zero state + date filtering, ticketVolumeTrend zero-fill + day counts, ticketsByPriority grouping + range, slaCompliancePct null, slaCompliance zero state, formatMinutes parametric (7 cases) + null
  - tests/Feature/Reports/ReportExportTest.php — access control (admin/supervisor OK, client forbidden, guest redirects) + assertDownload for all 5 export routes
  - tests/Feature/Reports/ScheduledReportTest.php — index access, store/update/delete CRUD, toggle active, DispatchScheduledReports dispatches for due active reports, skips inactive + not-yet-due reports
  - database/factories/ScheduledReportFactory.php — created; ScheduledReport model updated with HasFactory trait
  - NOTE: Tests require MySQL running + `php artisan migrate` to create scheduled_reports table before execution

---

## PHASE 8 — KNOWLEDGE BASE
**Goal:** Self-service Help Center with article management and ticket suggestions.

- [x] P8-01 — Migrations: knowledge_categories, knowledge_articles tables
  - database/migrations/2026_06_24_001000_create_knowledge_categories_table.php — id, name, slug(unique), description, icon, parent_id(self-ref nullable), sort_order, is_active, created_by, timestamps; indexes on parent_id/is_active/sort_order
  - database/migrations/2026_06_24_001001_create_knowledge_articles_table.php — id, knowledge_category_id(cascade), author_id(nullable), title, slug(unique), excerpt, content(longText), status enum(draft,published), is_public, view/helpful/not_helpful counts, published_at, timestamps; FULLTEXT on (title,content) for P8-06
  - app/Models/KnowledgeCategory.php — HasFactory, fillable, casts, parent/children/articles/creator relations
  - app/Models/KnowledgeArticle.php — HasFactory, fillable, casts, category/author relations, isPublished() helper
  - database/factories/KnowledgeCategoryFactory.php — unique slug via Str::slug
  - database/factories/KnowledgeArticleFactory.php — published() and private() states
- [x] P8-02 — Build public Knowledge Base index page (categories, search, no login required)
  - app/Http/Controllers/KnowledgeBaseController.php — index(): categories with published_article_count + children on no-query; LIKE title/excerpt search with limit 30 when ?q= provided
  - resources/js/Layouts/PublicLayout.tsx — sticky header with logo, "Dashboard" link for auth users, "Sign in" for guests, footer
  - resources/js/Pages/KnowledgeBase/Index.tsx — conditionally uses AppLayout (auth) or PublicLayout (guest); hero gradient with SearchBar; CategoryCard grid (icon, counts, subcategory list); ArticleRow list for search results; empty states for both
  - routes/web.php — public GET /kb → kb.index (outside all middleware groups)
  - Build: 0 errors
- [x] P8-03 — Build public article view page (full content, feedback buttons)
  - KnowledgeBaseController@show — fetch by slug (published+public+published_at), increment view_count via DB::table, eager-load category+author, return 5 related articles by helpful_count
  - KnowledgeBaseController@feedback — POST; match vote to increment helpful_count or not_helpful_count via DB::table; returns JSON
  - resources/js/Pages/KnowledgeBase/Show.tsx — breadcrumb nav, article title+meta (author/date/views), HTML content via dangerouslySetInnerHTML, FeedbackSection (fetch POST with CSRF, optimistic count update, voted state), related articles sticky sidebar
  - Routes: GET /kb/articles/{slug} → kb.articles.show; POST /kb/articles/{slug}/feedback → kb.articles.feedback (both public)
  - Build: 0 errors
- [x] P8-04 — Build Admin: article editor (Tiptap, category assign, public/private toggle, publish/draft)
  - app/Policies/KnowledgeArticlePolicy.php — viewAny: any staff role; create/update: admin/supervisor; delete: admin only
  - app/Http/Requests/Admin/KnowledgeArticleRequest.php — validates category, title, slug (unique ignore self), excerpt, content, status, is_public
  - app/Http/Controllers/Admin/KnowledgeArticleController.php — index/create/store/edit/update/destroy; store sets published_at=now() on first publish; update preserves published_at if already published
  - Pages/Admin/KnowledgeBase/Articles/Form.tsx — 2-col layout (content left, settings panel right); TiptapEditor for content; auto-slugify from title; category select; status select; is_public checkbox with hint
  - Pages/Admin/KnowledgeBase/Articles/Index.tsx — table with status badge, 🔒 private indicator, view/edit/delete actions, client-side title+category filter
  - Pages/Admin/KnowledgeBase/Articles/Create.tsx + Edit.tsx — breadcrumb + AppLayout wrappers
  - Routes: 6 admin routes under /admin prefix (kb.articles.*)
  - Sidebar: "KB Articles" link added (admin/supervisor only)
  - Build: 0 errors
- [x] P8-05 — Build Admin: KB category management
  - app/Policies/KnowledgeCategoryPolicy.php — viewAny: admin/supervisor; create/update/delete: admin only
  - app/Http/Requests/Admin/KnowledgeCategoryRequest.php — validates name, slug (unique ignore self), description, icon, parent_id (not self), sort_order, is_active
  - app/Http/Controllers/Admin/KnowledgeCategoryController.php — index (withCount published/total), store, update, destroy (promotes children to top-level before delete)
  - Pages/Admin/KnowledgeBase/Categories/Index.tsx — table with parent/article-count/order/active columns; slide-over CategoryPanel for create + edit with auto-slug, emoji icon, parent select (top-level only), sort_order, is_active toggle
  - Routes: 4 admin routes (kb.categories.*)
  - Sidebar: "KB Categories" link added (admin only)
  - Build: 0 errors
- [x] P8-06 — Build article full-text search (MySQL FULLTEXT index)
  - app/Services/KnowledgeSearchService.php — search(): FULLTEXT MATCH/AGAINST in Boolean Mode with prefix wildcard (+word*) for queries ≥3 chars; falls back to LIKE on short queries or empty FULLTEXT result; suggest(): title-only LIKE for typeahead (lightweight, 8 results)
  - booleanQuery() helper sanitises user input, strips MySQL boolean operators, appends * to each word
  - KnowledgeBaseController@index — now injects KnowledgeSearchService; delegates search to service
  - KnowledgeBaseController@searchSuggest — new JSON endpoint returning {id, title, slug, excerpt, category_name}
  - Route: GET /kb/search → kb.search (public, used by P8-07 ticket suggestion widget)
  - FULLTEXT index was already created in P8-01 migration on (title, content)
  - Build: 0 errors (PHP-only change)
- [x] P8-07 — Build suggested articles on ticket create form (keyword match to article titles)
  - resources/js/Components/KB/KbSuggestions.tsx — debounced (400ms) fetch to GET /kb/search?q= on subject change; AbortController cancels in-flight requests; shows up to 5 results in a blue-tinted panel below the subject input; dismiss (×) button resets when query prefix changes; "Searching…" loading state; each result opens article in new tab
  - Pages/Tickets/Create.tsx — imports KbSuggestions, renders <KbSuggestions query={data.subject} /> immediately after the Subject Input
  - Build: 0 errors
- [x] P8-08 — Build article feedback endpoint (helpful / not helpful vote)
  - KnowledgeBaseController@feedback — session key kb_vote_{id}; returns 409 with {already_voted, vote} if session key exists; on new vote increments DB count + stores vote in session; returns {success, vote}
  - KnowledgeBaseController@show — passes user_vote from session to page prop
  - Pages/KnowledgeBase/Show.tsx — FeedbackSection accepts initialVote prop; voted state initialised from it (persists across page loads); handles 409 response gracefully (shows voted state without double-counting)
  - Build: 0 errors

---

## PHASE 9 — CUSTOMER SATISFACTION (CSAT + NPS)
**Goal:** Automated satisfaction measurement tied to ticket lifecycle.

- [x] P9-01 — Migrations: csat_surveys, nps_surveys tables
  - 2026_06_24_002000_create_csat_surveys_table.php — ticket_id(cascade), user_id(nullable nullOnDelete), email, token(64 unique), score tinyint unsigned nullable (1–5), comment, sent_at, responded_at; indexes on ticket_id/user_id/score/responded_at
  - 2026_06_24_002001_create_nps_surveys_table.php — user_id(nullable nullOnDelete), email, token(64 unique), score tinyint unsigned nullable (0–10), comment, sent_at, responded_at
  - app/Models/CsatSurvey.php — HasFactory, casts, ticket/user relations, isExpired() (reads ticketing.satisfaction.survey_token_expiry_days), hasResponded()
  - app/Models/NpsSurvey.php — HasFactory, casts, user relation, isExpired(), hasResponded(), category() → promoter/passive/detractor
  - database/factories/CsatSurveyFactory.php — responded(score) state
  - database/factories/NpsSurveyFactory.php — responded(score) state
- [ ] P9-02 — Build SendCSATSurvey job (dispatched with 1hr delay on ticket resolved)
- [ ] P9-03 — Build CSAT response page (public, no login — token-based URL)
- [ ] P9-04 — Build NPS survey email + response page (periodic, token-based)
- [ ] P9-05 — Build CSAT/NPS metrics on dashboard (avg score, trend chart)
- [ ] P9-06 — Build CSAT per-agent and per-team breakdown table

---

## PHASE 10 — ASSET MANAGEMENT
**Goal:** Asset inventory with ticket linking and lifecycle tracking.

- [ ] P10-01 — Migrations: assets, asset_assignments tables
- [ ] P10-02 — Build Asset list page (searchable, filterable by type/status/assignee)
- [ ] P10-03 — Build Asset show page (details, assignment history, linked tickets)
- [ ] P10-04 — Build Asset create/edit form
- [ ] P10-05 — Build asset assignment to user (with history log)
- [ ] P10-06 — Build asset-ticket linking on ticket create/edit form
- [ ] P10-07 — Build asset lifecycle status management (purchased/in-use/maintenance/retired)

---

## PHASE 11 — AUDIT LOGS
**Goal:** Complete tamper-evident audit trail across all system actions.

- [ ] P11-01 — Configure spatie/laravel-activitylog on all key models via Observers
- [ ] P11-02 — Build Admin: Audit log viewer page (filterable by user, action, model, date range)
- [ ] P11-03 — Build ticket change history diff viewer (before/after per field)
- [ ] P11-04 — Build login history viewer (admin: all users, user: own)
- [ ] P11-05 — Build audit log export (CSV/PDF)
- [ ] P11-06 — Build Admin: Data retention policy settings (archive/delete logs after X days)

---

## PHASE 12 — NOTIFICATIONS
**Goal:** Multi-channel notifications with per-user preference control.

- [ ] P12-01 — Migration: notifications table (Laravel built-in)
- [ ] P12-02 — Build in-app notification center UI (bell icon, unread count, notification list, mark all read)
- [ ] P12-03 — Wire notifications: ticket assigned, reply received, @mention, SLA warning, SLA breach
- [ ] P12-04 — Build notification preferences page (user can toggle each event on/off per channel)
- [ ] P12-05 — Implement browser push notifications (Web Push API + service worker)

---

## PHASE 13 — REST API + WEBHOOKS
**Goal:** Full programmatic access for integrations.

- [ ] P13-01 — Build API key management page (generate, label, revoke, last-used timestamp)
- [ ] P13-02 — Build API authentication middleware (Bearer token → ApiKey lookup)
- [ ] P13-03 — Build v1 API controllers for: tickets, replies, users, teams, assets, reports
- [ ] P13-04 — Build API rate limiting middleware (60 req/min per key)
- [ ] P13-05 — Build webhook management page (create endpoint URL, select events, test ping)
- [ ] P13-06 — Build WebhookService (fire HTTP POST on ticket events with retry logic)
- [ ] P13-07 — Run Scribe to generate API documentation at `/docs`
- [ ] P13-08 — Feature tests: API auth, CRUD endpoints, webhook firing

---

## PHASE 14 — SYSTEM SETTINGS & CUSTOMIZATION
**Goal:** Full white-label + per-installation configuration.

- [ ] P14-01 — Migration: settings table (key-value with type casting)
- [ ] P14-02 — Build Admin: General settings page (company name, logo upload, favicon)
- [ ] P14-03 — Build Admin: Color/branding customization (primary color, accent — updates CSS variables)
- [ ] P14-04 — Build Admin: Email settings page (SMTP config, sender name, sender address)
- [ ] P14-05 — Build Admin: Mailbox management (IMAP credentials, poll interval)
- [ ] P14-06 — Build Admin: Ticket settings (default priority, auto-close days, max attachment size)
- [ ] P14-07 — Build Admin: Security settings (session lifetime, force 2FA for roles, password policy)
- [ ] P14-08 — Build Admin: Data retention settings

---

## PHASE 15 — CLIENT PORTAL
**Goal:** Clean, minimal portal for clients to manage their own tickets.

- [ ] P15-01 — Build client portal layout (separate from agent layout — simpler, branded)
- [ ] P15-02 — Build client: My Tickets page (own tickets only, status filter)
- [ ] P15-03 — Build client: Submit new ticket page (simplified form with custom fields)
- [ ] P15-04 — Build client: Ticket detail page (thread view, reply form, no internal notes)
- [ ] P15-05 — Build client: Knowledge Base access from portal
- [ ] P15-06 — Build client: Account settings (name, email, password, 2FA)

---

## PHASE 16 — TESTING & QA
**Goal:** Comprehensive test coverage before deployment.

- [ ] P16-01 — Feature tests: authentication flows (login, 2FA, password reset)
- [ ] P16-02 — Feature tests: ticket lifecycle (create → reply → resolve → close → CSAT)
- [ ] P16-03 — Feature tests: SLA calculation and breach detection
- [ ] P16-04 — Feature tests: automation rule evaluation
- [ ] P16-05 — Feature tests: email integration (incoming + outgoing)
- [ ] P16-06 — Feature tests: reports and exports
- [ ] P16-07 — Feature tests: REST API all endpoints
- [ ] P16-08 — Unit tests: SLAService, ReportService, AutomationService
- [ ] P16-09 — Security tests: role/permission enforcement, API auth, file upload validation

---

## PHASE 17 — DEPLOYMENT
**Goal:** Live on cPanel production environment.

- [ ] P17-01 — Configure production `.env` (DB, SMTP, queue, APP_URL)
- [ ] P17-02 — Upload files to cPanel via FTP/SSH, set correct permissions
- [ ] P17-03 — Run migrations and seeders on production
- [ ] P17-04 — Configure cPanel cron for Laravel Scheduler
- [ ] P17-05 — Configure queue worker (cPanel background process or cron fallback)
- [ ] P17-06 — Configure IMAP polling (verify mailbox connection)
- [ ] P17-07 — Run `php artisan config:cache`, `route:cache`, `view:cache`
- [ ] P17-08 — Verify SSL certificate active
- [ ] P17-09 — Smoke test all critical paths in production

---

## CURRENT STATUS
- Phase: 6 — COMPLETE (synced from other machine)
- Last completed task: P6-04 — Canned response variable interpolation
- Next task: P7-01 — Build ReportService with all metric calculation methods
