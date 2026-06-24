# CURRENT STATE
> Updated after every completed task. Snapshot of what exists right now.

---

## STATE: EXECUTION_MODE — PHASE 9 IN PROGRESS

**Last updated:** 2026-06-24
**Last completed:** P9-06 — CSAT per-agent and per-team breakdown table
**Current phase:** Phase 9 — COMPLETE
**Next task:** P10-01 — Migrations: assets, asset_assignments tables
**Pending migrations:** `php artisan migrate` (scheduled_reports + knowledge_* + csat_surveys + nps_surveys) — requires MySQL running

---

## WHAT EXISTS

### _brain/ System
- [x] `memory/app_context.md` — Full system definition
- [x] `memory/system_architecture.md` — Architecture blueprint, directory structure, DB schema
- [x] `memory/glossary.md` — Project terminology
- [x] `progress/progress.md` — Full task breakdown (P0 through P17)
- [x] `progress/backlog.md` — Post-launch features
- [x] `tasks/task_rules.md` — Execution rules
- [x] `tasks/task_templates.md` — Task formats per type
- [x] `decisions/decision_log.md` — All architectural decisions with reasoning
- [x] `decisions/rejected_options.md` — Rejected alternatives
- [x] `skills/skills.md` — Full tech stack reference
- [x] `skills/resources.md` — Documentation links
- [x] `deployment/deployment.md` — cPanel deployment guide
- [x] `deployment/environments.md` — Environment configuration
- [x] `timelines/actual_timeline.md` — 8–10 week AI-assisted plan
- [x] `timelines/reported_timeline.md` — 5–6 month external plan
- [x] `summaries/current_state.md` — This file
- [x] `summaries/weekly_summary.md` — Baseline (empty)
- [x] `interaction/response_rules.md` — Claude response behavior
- [x] `interaction/assumptions.md` — What never to assume
- [x] `governance/rules.md` — Project governance
- [x] `governance/scope.md` — In-scope vs out-of-scope
- [x] `security/secrets_policy.md` — Secret handling rules
- [x] `security/auth_boundaries.md` — Auth and permission rules
- [x] `releases/changelog.md` — Ready for first entry
- [x] `releases/versioning.md` — Versioning strategy
- [x] `prompts/bootstrap_prompt.md` — Re-initialization instructions
- [x] `prompts/continue_prompt.md` — How to continue work
- [x] `prompts/debug_prompt.md` — Debugging workflow
- [x] `integrations/guide.md` — Slack/Teams migration guide

### Application Code
- [x] Laravel 13.16.1 installed (PHP 8.3.30, Composer 2.10.1)
- [x] `.env` configured: DB_CONNECTION=mysql, DB_DATABASE=elts_db, QUEUE=database, CACHE=file, SESSION=file, MAIL=log
- [x] `.env.example` updated to match
- [x] Inertia.js v3.1 installed, HandleInertiaRequests middleware registered in bootstrap/app.php
- [x] `resources/views/app.blade.php` root template created (Vite + Inertia directives)
- [x] Shared props wired: auth.user, flash.success, flash.error
- [x] `routes/web.php` updated to use Inertia::render()
- [x] React 18 + TypeScript + @vitejs/plugin-react + axios installed
- [x] `tsconfig.json` created (strict mode, path alias @/* → resources/js/*)
- [x] `vite.config.js` updated — React plugin, entry point changed to app.tsx
- [x] `resources/js/app.tsx` — Inertia createInertiaApp wired up
- [x] `resources/js/bootstrap.ts` — axios configured
- [x] `resources/js/types/index.d.ts` — shared props typed (AuthUser, Flash, SharedProps)
- [x] `resources/js/types/global.d.ts` — Window.axios typed
- [x] `resources/js/Pages/Welcome.tsx` — placeholder page
- [x] Build verified: npm run build passes (303ms)
- [x] barryvdh/laravel-dompdf v3.1.2 installed, config published to config/dompdf.php
- [x] storage/fonts/ directory created for DomPDF font cache
- [x] maatwebsite/excel v3.1.69 installed, config published to config/excel.php (PDF driver → DOMPDF)
- [x] webklex/laravel-imap v6.2.0 installed, config published to config/imap.php (soft_fail=true)
- [x] pragmarx/google2fa-laravel v3.0.1 installed + bacon/bacon-qr-code v3.1.1 (SVG QR codes)
- [x] knuckleswtf/scribe v5.11.0 installed (dev), config published to config/scribe.php
- [x] pestphp/pest v4.7.3 + pest-plugin-laravel v4.1.0 installed; tests/Pest.php created; 2/2 tests pass
- [x] Layouts created: AppLayout.tsx (sidebar+topbar+flash), Sidebar.tsx (role-filtered nav), Topbar.tsx (search+notifications+user menu), AuthLayout.tsx (centered card)
- [x] UI components: Button, Input, Badge, Card, Modal, Dropdown, Table — all typed, barrel-exported from Components/UI/index.ts
- [x] Database migrated: users, cache, jobs, job_batches, failed_jobs, permissions, roles, activity_log — all tables created in elts_db
- [x] users table extended: 14 ELTS columns added (phone, avatar, job_title, timezone, locale, availability_status, is_vip, is_active, two_factor_secret, two_factor_confirmed_at, last_login_at, last_login_ip, team_id, department_id)
- [x] User model updated: MustVerifyEmail, all new fields in $fillable and casts
- [x] departments table: name, description, is_active
- [x] teams table: name, description, department_id (FK), is_active
- [x] users.team_id and users.department_id FK constraints wired (nullOnDelete)
- [x] Models created: Department.php, Team.php with relationships; User.php updated with team()/department() BelongsTo
- [x] RolesAndPermissionsSeeder: 60 permissions, 5 roles (super_admin/admin/supervisor/agent/client) seeded and verified in DB
- [x] Login page: LoginRequest (rate-limited), AuthService, AuthController; Pages/Auth/Login.tsx (email, password+toggle, remember me); Dashboard/Index.tsx placeholder
- [x] Registration + email verification: RegisterRequest, AuthService::register(), RegisterController, VerifyEmailController, EmailVerificationNotificationController; Register.tsx, VerifyEmail.tsx; dashboard now requires verified middleware
- [x] Forgot/reset password: ForgotPasswordController, ResetPasswordController, both Requests; ForgotPassword.tsx, ResetPassword.tsx; uses Laravel Password facade + PasswordReset event
- [x] 2FA setup: TwoFactorService (BaconQrCode SVG QR), TwoFactorSetupController, EnableTwoFactorRequest; TwoFactorSetup.tsx (QR code display, 6-digit confirm, disable with password)
- [x] 2FA challenge: TwoFactorChallengeController (session-based pending user, verify → Auth::login), TwoFactorChallenge.tsx (mono code input, logout link); AuthController::login wired to intercept
- [x] Profile page: ProfileController (avatar upload to public disk), PasswordUpdateController; Profile/Edit.tsx (avatar+initials fallback, all fields, password section, security 2FA card)
- [x] Scheduler: routes/console.php configured; activitylog:clean daily; cPanel cron commands documented in deployment.md
- [x] config/ticketing.php: 8 sections (tickets, sla, email, satisfaction, security, portal, kb, pagination) — all env()-backed
- [x] Repository layer: Contracts/Repositories/UserRepositoryInterface, Repositories/EloquentUserRepository, Providers/RepositoryServiceProvider (registered in bootstrap/providers.php)
- [x] Services/UserService: listUsers() with search/role/status/sort/pagination params
- [x] Policies/UserPolicy: viewAny/view via users.view permission (auto-discovered)
- [x] Admin user list: GET /admin/users → admin.users.index (auth+verified); ListUsersRequest, Admin/UserController, Pages/Admin/Users/Index.tsx (debounced search, role/status filters, sortable table, pagination, per-page selector)
- [x] Admin create/edit user: CreateUserRequest, UpdateUserRequest, UserController (create/store/edit/update + Gate::authorize); Create.tsx + Edit.tsx (3-card layout, Toggle component, role/team/dept selects, optional password on edit); lib/constants.ts shared TIMEZONES; UserService createUser/updateUser; repository create/update methods
- [x] Availability toggle: PATCH /user/availability → AvailabilityController; Topbar updated with availability dot on avatar + 2×2 status grid (staff only); Edit.tsx + admin can force-set agent availability; UserService::updateAvailability()
- [x] Admin team management: TeamRepositoryInterface + EloquentTeamRepository (withCount/department), TeamPolicy (teams.*), TeamService (syncMembers handles cross-team moves), CreateTeamRequest + UpdateTeamRequest, TeamController (6 routes); Teams Index/Create/Edit.tsx (searchable member checkbox list with current-team warning, delete confirm); Sidebar updated with UserGroupIcon
- [x] Admin department management: DepartmentRepositoryInterface + EloquentDepartmentRepository (withCount teams+users), DepartmentPolicy (departments.*), DepartmentService (deleteDepartment nulls dept on users+teams), DepartmentController (6 routes); Departments Index/Create/Edit.tsx (read-only teams panel, delete confirm); Sidebar updated with BuildingOffice2Icon
- [x] Role permissions editor: RoleService::syncPermissions() + forgetCachedPermissions(); UpdateRolePermissionsRequest; PermissionsController (groups 60 permissions by module prefix, blocks super_admin edit); Pages/Admin/Permissions/Index.tsx (matrix table, per-role Set<string> state, per-column Save button, super_admin+admin locked with CheckCircleIcon); Sidebar Permissions item (KeyIcon, super_admin+admin only)
- [x] Login history: login_histories migration (user_id nullable FK, email, ip, user_agent, status enum, created_at only); LoginHistory model; LoginHistoryService (record/forUser/paginate); AuthService updated to record success+failed on every attempt; Admin/LoginHistoryController (audit.view guard, filterable paginated table); LoginHistoryController (user's own last 50); Admin/LoginHistory/Index.tsx + Profile/LoginHistory.tsx; Profile/Edit.tsx security card links to login history; PaginatedData<T> added to types/index.d.ts
- [x] Active sessions: SESSION_DRIVER=database (.env + .env.example); SessionService (DB::table sessions — getForUser/revokeSession/revokeOtherSessions/paginateAll/revokeById); SessionController (user routes: index, destroy, destroyOthers — all guard own current session); Admin/SessionController (audit.view guard, force-logout any session except own); Profile/Sessions.tsx (parseBrowser+parseOS+timeAgo, bulk revoke button, current session badge, per-session revoke); Admin/Sessions/Index.tsx (debounced search, Force logout button, "Your session" badge); Profile/Edit.tsx security card now has Active Sessions + Login History links; Sidebar: Active Sessions in Developer group

- [x] Ticket core migrations: ticket_statuses, ticket_categories, ticket_tags, tickets (soft deletes, self-ref FKs, priority/source enums), ticket_replies, ticket_notes, ticket_tag_pivot, ticket_watchers, ticket_attachments
- [x] Custom field migrations: custom_fields, custom_field_values, ticket_templates — all 12 new migrations applied
- [x] Default statuses seeded: Open (green, default), In Progress (blue), On Hold (yellow), Resolved (purple), Closed (gray, is_closed=true)
- [x] Models created: Ticket, TicketStatus, TicketCategory, TicketTag, TicketReply, TicketNote, TicketWatcher, TicketAttachment, CustomField, CustomFieldValue, TicketTemplate
- [x] TicketRepositoryInterface + EloquentTicketRepository (paginate with 7 filters, FIELD() priority sort, findOrFail with all relations)
- [x] TicketService: listTickets/createTicket (TKT-00001 number)/updateTicket/closeTicket/deleteTicket/mergeTickets (DB transaction, moves replies/notes/attachments/watchers)
- [x] TicketPolicy: 11 policy methods covering all ticket permissions (auto-discovered)
- [x] Ticket index page: GET /tickets → tickets.index; ListTicketsRequest; TicketController::index(); Pages/Tickets/Index.tsx (debounced search, 5 filter selects, date range, sortable Table with VIP star + tag chips + colored status + priority badges, pagination); Ticket types in index.d.ts
- [x] Tiptap rich text editor: @tiptap/react + @tiptap/pm + @tiptap/starter-kit + @tiptap/extension-placeholder + @tiptap/extension-link + @tiptap/extension-underline (52 packages); TiptapEditor.tsx (toolbar: Bold/Italic/Underline/Strike/H2/H3/BulletList/OrderedList/Blockquote/Code/CodeBlock); TiptapEditor.css (ProseMirror editor styles + .ticket-body display styles)
- [x] Request classes: CreateTicketRequest, CreateReplyRequest, CreateNoteRequest, ChangeStatusRequest, ChangePriorityRequest, AssignTicketRequest
- [x] TicketReplyController::store() + TicketNoteController::store()
- [x] TicketService extended: addReply (sets first_response_at if null + actor ≠ requester), addNote, changeStatus (auto-sets/clears closed_at), changePriority, assign
- [x] Ticket model: LogsActivity trait (logOnly status_id/priority/assignee_id/team_id/category_id/subject, logOnlyDirty, dontSubmitEmptyLogs)
- [x] TicketController fully expanded: create/store/show/changeStatus/changePriority/assign/destroy
- [x] Routes reorganized into prefix group (tickets.*) with all sub-resources (replies.store, notes.store, status, priority, assign, destroy)
- [x] Pages/Tickets/Show.tsx: two-column layout; thread (description + interleaved replies/notes by created_at); reply/note tabs with TiptapEditor; sidebar (status/priority/assignee/team selects with immediate router.patch, requester card, activity timeline); delete confirm
- [x] Pages/Tickets/Create.tsx: subject+description(Tiptap)+priority/category/assignee/team/status/due_at selects, custom fields (text/textarea/select/number/date), VIP checkbox; useForm post('/tickets')
- [x] types/index.d.ts: TicketReply, TicketNote, ActivityEntry, CustomFieldValue, TicketDetail interfaces added
- [x] Build: 1343 modules, 0 errors

- [x] P2-17 Parent-child linking: LinkParentRequest, TicketLinkController (store/destroy), TicketService::linkParent(); Show.tsx sidebar card with LinkParentModal + unlink
- [x] P2-18 Admin status CRUD: CreateStatusRequest + UpdateStatusRequest, Admin/StatusController (default-clearing transaction, destroy guards), Pages/Admin/Statuses/Index.tsx (color picker, DEFAULT/CLOSED badges)
- [x] P2-19 Admin category CRUD: CreateCategoryRequest + UpdateCategoryRequest, Admin/CategoryController (destroy nulls children), Pages/Admin/Categories/Index.tsx (tree display, parent select)
- [x] P2-20 Admin custom field CRUD: CreateCustomFieldRequest + UpdateCustomFieldRequest, Admin/CustomFieldController (destroy deletes values first), Pages/Admin/CustomFields/Index.tsx (auto-name, type-gated options section)
- [x] P2-21 Admin template CRUD: CreateTemplateRequest + UpdateTemplateRequest, Admin/TicketTemplateController, Pages/Admin/Templates/{Index,Create,Edit}.tsx (Tiptap + tag chips)
- [x] P2-22 File attachments: StoreAttachmentRequest (max from config), TicketAttachmentController (upload/download/destroy), TicketService::addAttachment/removeAttachment; Show.tsx drag-drop dropzone + file list
- [x] P2-23 @mention autocomplete: UserMentionController (/users/mention-search), MentionList.tsx (forwardRef + keyboard nav), TiptapEditor.tsx updated with Mention extension + tippy.js popup
- [x] P2-24 Activity diff display: Show.tsx activity section with LABEL_KEY_MAP, old→new per changed field, expand/collapse toggle (5 items default)
- [x] P2-25 Pest tests: TicketFactory + TicketStatusFactory, TicketCRUDTest (6) + TicketReplyNoteTest (5) + BulkActionTest (5) — all 16 pass; TicketPolicy bug fixed (permission names); Sidebar updated with admin nav items (Statuses/Categories/Custom Fields/Templates)

## ✅ PHASE 0 COMPLETE — All 17 tasks done
## ✅ PHASE 1 COMPLETE — All 18 tasks done
## ✅ PHASE 2 COMPLETE — All 25 tasks done

---

## PROGRESS SUMMARY

| Phase | Tasks | Done | Remaining |
|---|---|---|---|
| P0 Setup | 17 | 17 | 0 |
| P1 Auth | 18 | 18 | 0 |
| P2 Tickets | 25 | 25 | 0 |
| P3 Email | 12 | 12 | 0 |
| P4 SLA | 11 | 11 | 0 |
| P5 Automation | 10 | 10 | 0 |
| P6 Canned | 4 | 4 | 0 |
| P7 Reports | 14 | 0 | 14 |
| P8 KB | 8 | 0 | 8 |
| P9 CSAT | 6 | 0 | 6 |
| P10 Assets | 7 | 0 | 7 |
| P11 Audit | 6 | 0 | 6 |
| P12 Notify | 5 | 0 | 5 |
| P13 API | 8 | 0 | 8 |
| P14 Settings | 8 | 0 | 8 |
| P15 Portal | 6 | 0 | 6 |
| P16 Tests | 9 | 0 | 9 |
| P17 Deploy | 9 | 0 | 9 |
| **TOTAL** | **183** | **86** | **97** |

---

## BLOCKERS
- None

---

## DECISIONS MADE
- Stack: Laravel 11 + React + TypeScript + Inertia.js + MySQL
- Deployment: cPanel hosting
- Queue: Database driver (no Redis)
- Editor: Tiptap
- Charts: Recharts
- Email ingestion: webklex/laravel-imap
- Auth: Laravel Sanctum + spatie/laravel-permission
- 2FA: pragmarx/google2fa-laravel
- Audit: spatie/laravel-activitylog
