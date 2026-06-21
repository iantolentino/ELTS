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
- [ ] P2-15 — Build bulk actions: select multiple tickets → assign / close / change status / tag / delete
- [ ] P2-16 — Build ticket merge UI (select target ticket, confirm, preserve thread)
- [ ] P2-17 — Build parent-child ticket linking UI
- [ ] P2-18 — Build Admin: Custom status management (create, edit, reorder, set color)
- [ ] P2-19 — Build Admin: Category & subcategory management (tree editor)
- [ ] P2-20 — Build Admin: Custom field management (define fields per category)
- [ ] P2-21 — Build Admin: Ticket template management
- [ ] P2-22 — Build file attachment upload (drag-drop, preview, size limit enforcement)
- [ ] P2-23 — Build @mention autocomplete in Tiptap editor
- [ ] P2-24 — Build activity timeline component (full diff view of all ticket changes)
- [ ] P2-25 — Feature tests: ticket CRUD, reply, note, bulk actions

---

## PHASE 3 — EMAIL INTEGRATION
**Goal:** Bidirectional email — incoming creates tickets, outgoing notifies users.

- [ ] P3-01 — Migration: mailboxes, incoming_emails tables
- [ ] P3-02 — Build Mailbox model and MailboxService (IMAP poll via webklex)
- [ ] P3-03 — Build ProcessIncomingEmail job (parse email → create ticket or append reply)
- [ ] P3-04 — Schedule ProcessIncomingEmail every 2 minutes in Kernel.php
- [ ] P3-05 — Build outgoing email templates (Blade): ticket_created, reply_received, ticket_resolved, ticket_closed, ticket_assigned
- [ ] P3-06 — Build SendTicketEmail job (queued, dispatched on ticket events)
- [ ] P3-07 — Wire events: TicketCreated → SendTicketEmail, TicketReplied → SendTicketEmail, etc.
- [ ] P3-08 — Build Admin: Mailbox management page (add IMAP credentials, test connection, enable/disable)
- [ ] P3-09 — Build Admin: Email template editor (customize subject + body per event type)
- [ ] P3-10 — Build email bounce/failure detection and log to `incoming_emails.status`
- [ ] P3-11 — Build CC/BCC on ticket replies (store + include in outgoing email)
- [ ] P3-12 — Feature tests: incoming email parsing, outgoing email dispatch

---

## PHASE 4 — SLA MANAGEMENT
**Goal:** Configurable SLA policies with real-time tracking and breach alerts.

- [ ] P4-01 — Migrations: sla_policies, sla_records, business_hours, holidays
- [ ] P4-02 — Build SLAService: calculate due times respecting business hours + holidays
- [ ] P4-03 — Build SLARecord creation on ticket open (first_response_due, resolution_due)
- [ ] P4-04 — Build CheckSLABreaches job (scheduled every 5 min, marks breached=true, fires event)
- [ ] P4-05 — Build SLABreached event + listener (sends in-app + email alert)
- [ ] P4-06 — Build SLA pause/resume on ticket (sets paused_at, adjusts due times on resume)
- [ ] P4-07 — Build SLA status badge on ticket (Green / Yellow warning / Red breached)
- [ ] P4-08 — Build Admin: SLA policy management page (create, edit, assign to priority/tier)
- [ ] P4-09 — Build Admin: Business hours configuration (per team, day-of-week schedule)
- [ ] P4-10 — Build Admin: Holiday calendar management
- [ ] P4-11 — Feature tests: SLA calculation, breach detection, pause/resume

---

## PHASE 5 — AUTOMATION & WORKFLOWS
**Goal:** Visual rule builder that auto-handles tickets based on configurable conditions.

- [ ] P5-01 — Migrations: automation_rules, automation_conditions, automation_actions
- [ ] P5-02 — Build AutomationService: evaluate rules against ticket on create/update events
- [ ] P5-03 — Build RunAutomationRules job (queued, triggered by ticket events)
- [ ] P5-04 — Implement action handlers: assign, tag, change priority, change status, send notification, escalate, close
- [ ] P5-05 — Build Admin: Automation rule list page
- [ ] P5-06 — Build Admin: Rule builder UI (visual if/then editor with condition + action blocks)
- [ ] P5-07 — Build round-robin assignment logic in AutomationService
- [ ] P5-08 — Build skill-based routing (tag-to-agent-skill matching)
- [ ] P5-09 — Build auto-close stale tickets command (configurable days in settings)
- [ ] P5-10 — Feature tests: rule evaluation, all action types, round-robin

---

## PHASE 6 — CANNED RESPONSES
**Goal:** Agents can save and reuse reply templates.

- [ ] P6-01 — Migration: canned_responses table (title, body, scope: global/team/personal)
- [ ] P6-02 — Build CannedResponse CRUD (admin: global/team, agent: personal)
- [ ] P6-03 — Build canned response selector in Tiptap editor (search + insert)
- [ ] P6-04 — Variable support in canned responses: {{client_name}}, {{ticket_id}}, {{agent_name}}

---

## PHASE 7 — REPORTS & ANALYTICS
**Goal:** Rich dashboard + custom report builder + scheduled exports.

- [ ] P7-01 — Build ReportService with all metric calculation methods
- [ ] P7-02 — Build main dashboard page: KPI cards (open tickets, avg resolution time, SLA compliance %, CSAT score)
- [ ] P7-03 — Build ticket volume trend chart (line chart, daily/weekly/monthly toggle)
- [ ] P7-04 — Build first response time chart (bar chart per agent/team)
- [ ] P7-05 — Build SLA compliance gauge chart
- [ ] P7-06 — Build agent performance scorecard table (tickets handled, avg resolution, CSAT, SLA compliance)
- [ ] P7-07 — Build team comparison bar chart
- [ ] P7-08 — Build ticket breakdown charts (by priority, by status, by category — pie/donut)
- [ ] P7-09 — Build custom report builder page (metric selector, date range, group by, filter)
- [ ] P7-10 — Build PDF export (DomPDF — dashboard snapshot + custom report)
- [ ] P7-11 — Build Excel/CSV export (maatwebsite/excel)
- [ ] P7-12 — Build scheduled report configuration (pick report, schedule, recipient emails)
- [ ] P7-13 — Build GenerateScheduledReport job (render + attach + email)
- [ ] P7-14 — Feature tests: metric calculations, export generation

---

## PHASE 8 — KNOWLEDGE BASE
**Goal:** Self-service Help Center with article management and ticket suggestions.

- [ ] P8-01 — Migrations: knowledge_categories, knowledge_articles tables
- [ ] P8-02 — Build public Knowledge Base index page (categories, search, no login required)
- [ ] P8-03 — Build public article view page (full content, feedback buttons)
- [ ] P8-04 — Build Admin: article editor (Tiptap, category assign, public/private toggle, publish/draft)
- [ ] P8-05 — Build Admin: KB category management
- [ ] P8-06 — Build article full-text search (MySQL FULLTEXT index)
- [ ] P8-07 — Build suggested articles on ticket create form (keyword match to article titles)
- [ ] P8-08 — Build article feedback endpoint (helpful / not helpful vote)

---

## PHASE 9 — CUSTOMER SATISFACTION (CSAT + NPS)
**Goal:** Automated satisfaction measurement tied to ticket lifecycle.

- [ ] P9-01 — Migrations: csat_surveys, nps_surveys tables
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
- Phase: 2 — IN PROGRESS
- Last completed task: P2-14 — Ticket watcher subscribe/unsubscribe
- Next task: P2-15 — Bulk actions: select multiple tickets → assign / close / change status / tag / delete
