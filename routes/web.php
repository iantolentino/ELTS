<?php

use App\Http\Controllers\Tickets\TicketController;
use App\Http\Controllers\Tickets\TicketReplyController;
use App\Http\Controllers\Tickets\TicketNoteController;
use App\Http\Controllers\Tickets\BulkTicketController;
use App\Http\Controllers\Tickets\TicketLinkController;
use App\Http\Controllers\Tickets\TicketMergeController;
use App\Http\Controllers\Tickets\TicketSearchController;
use App\Http\Controllers\Tickets\TicketTagController;
use App\Http\Controllers\Tickets\TicketWatcherController;
use App\Http\Controllers\Tickets\TicketAttachmentController;
use App\Http\Controllers\Tickets\TicketSlaController;
use App\Http\Controllers\Admin\TagController as AdminTagController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CustomFieldController as AdminCustomFieldController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\Admin\LoginHistoryController as AdminLoginHistoryController;
use App\Http\Controllers\Admin\PermissionsController as AdminPermissionsController;
use App\Http\Controllers\Admin\SessionController as AdminSessionController;
use App\Http\Controllers\Admin\StatusController as AdminStatusController;
use App\Http\Controllers\Admin\TeamController as AdminTeamController;
use App\Http\Controllers\Admin\EmailTemplateController as AdminEmailTemplateController;
use App\Http\Controllers\Admin\MailboxController as AdminMailboxController;
use App\Http\Controllers\Admin\BusinessHourController as AdminBusinessHourController;
use App\Http\Controllers\Admin\HolidayController as AdminHolidayController;
use App\Http\Controllers\Admin\SlaPolicyController as AdminSlaPolicyController;
use App\Http\Controllers\Admin\TicketTemplateController as AdminTemplateController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Users\UserMentionController;
use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\LoginHistoryController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\PasswordUpdateController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\TwoFactorChallengeController;
use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Guest routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/',        [AuthController::class, 'showLogin']);
    Route::get('/login',   [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login',  [AuthController::class, 'login']);

    Route::get('/register',  [RegisterController::class, 'show'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    Route::get('/forgot-password',  [ForgotPasswordController::class, 'show'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');

    Route::get('/reset-password/{token}',  [ResetPasswordController::class, 'show'])->name('password.reset');
    Route::post('/reset-password', [ResetPasswordController::class, 'store'])->name('password.update');

    Route::get('/two-factor-challenge',  [TwoFactorChallengeController::class, 'show'])->name('two-factor.challenge');
    Route::post('/two-factor-challenge', [TwoFactorChallengeController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Authenticated routes (email verification not required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/email/verify', [VerifyEmailController::class, 'notice'])
        ->name('verification.notice');

    Route::get('/email/verify/{id}/{hash}', [VerifyEmailController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');

    Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});

/*
|--------------------------------------------------------------------------
| Authenticated + verified routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard/Index'))->name('dashboard');

    Route::prefix('tickets')->name('tickets.')->group(function () {
        Route::get('/',                                        [TicketController::class, 'index'])->name('index');
        Route::get('/create',                                  [TicketController::class, 'create'])->name('create');
        Route::post('/',                                       [TicketController::class, 'store'])->name('store');
        Route::post('/bulk',                                   [BulkTicketController::class, 'store'])->name('bulk');
        Route::get('/search',                                  TicketSearchController::class)->name('search');
        Route::get('/{ticket}',                                [TicketController::class, 'show'])->name('show');
        Route::delete('/{ticket}',                             [TicketController::class, 'destroy'])->name('destroy');
        Route::patch('/{ticket}/status',                       [TicketController::class, 'changeStatus'])->name('status');
        Route::patch('/{ticket}/priority',                     [TicketController::class, 'changePriority'])->name('priority');
        Route::patch('/{ticket}/assign',                       [TicketController::class, 'assign'])->name('assign');
        Route::post('/{ticket}/replies',                       [TicketReplyController::class, 'store'])->name('replies.store');
        Route::post('/{ticket}/notes',                         [TicketNoteController::class, 'store'])->name('notes.store');
        Route::post('/{ticket}/tags',                          [TicketTagController::class, 'store'])->name('tags.store');
        Route::delete('/{ticket}/tags/{tag}',                  [TicketTagController::class, 'destroy'])->name('tags.destroy');
        Route::post('/{ticket}/watch',                         [TicketWatcherController::class, 'store'])->name('watch');
        Route::delete('/{ticket}/watch',                       [TicketWatcherController::class, 'destroy'])->name('unwatch');
        Route::post('/{ticket}/merge',                         [TicketMergeController::class, 'store'])->name('merge');
        Route::post('/{ticket}/parent',                        [TicketLinkController::class, 'store'])->name('parent.store');
        Route::delete('/{ticket}/parent',                      [TicketLinkController::class, 'destroy'])->name('parent.destroy');
        Route::post('/{ticket}/attachments',                   [TicketAttachmentController::class, 'store'])->name('attachments.store');
        Route::get('/{ticket}/attachments/{attachment}/download', [TicketAttachmentController::class, 'download'])->name('attachments.download');
        Route::delete('/{ticket}/attachments/{attachment}',    [TicketAttachmentController::class, 'destroy'])->name('attachments.destroy');
        Route::post('/{ticket}/sla/pause',                     [TicketSlaController::class, 'pause'])->name('sla.pause');
        Route::post('/{ticket}/sla/resume',                    [TicketSlaController::class, 'resume'])->name('sla.resume');
    });

    Route::get('/profile',           [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile',         [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password',[PasswordUpdateController::class, 'update'])->name('profile.password.update');

    Route::patch('/user/availability', [AvailabilityController::class, 'update'])->name('user.availability.update');
    Route::get('/profile/login-history', [LoginHistoryController::class, 'index'])->name('profile.login-history');

    Route::get('/profile/sessions',                      [SessionController::class, 'index'])->name('profile.sessions');
    Route::delete('/profile/sessions/others',            [SessionController::class, 'destroyOthers'])->name('profile.sessions.destroy-others');
    Route::delete('/profile/sessions/{sessionId}',       [SessionController::class, 'destroy'])->name('profile.sessions.destroy');

    Route::get('/user/two-factor-setup',    [TwoFactorSetupController::class, 'show'])->name('two-factor.setup');
    Route::post('/user/two-factor-setup',   [TwoFactorSetupController::class, 'enable'])->name('two-factor.enable');
    Route::delete('/user/two-factor-setup', [TwoFactorSetupController::class, 'disable'])->name('two-factor.disable');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/users',              [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/users/create',       [AdminUserController::class, 'create'])->name('users.create');
        Route::post('/users',             [AdminUserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit',  [AdminUserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}',       [AdminUserController::class, 'update'])->name('users.update');

        Route::get('/permissions',                          [AdminPermissionsController::class, 'index'])->name('permissions.index');
        Route::put('/roles/{roleName}/permissions',         [AdminPermissionsController::class, 'update'])->name('roles.permissions.update');

        Route::get('/login-history', [AdminLoginHistoryController::class, 'index'])->name('login-history.index');

        Route::get('/sessions',                      [AdminSessionController::class, 'index'])->name('sessions.index');
        Route::delete('/sessions/{sessionId}',       [AdminSessionController::class, 'destroy'])->name('sessions.destroy');

        Route::get('/departments',                [AdminDepartmentController::class, 'index'])->name('departments.index');
        Route::get('/departments/create',         [AdminDepartmentController::class, 'create'])->name('departments.create');
        Route::post('/departments',               [AdminDepartmentController::class, 'store'])->name('departments.store');
        Route::get('/departments/{department}/edit',  [AdminDepartmentController::class, 'edit'])->name('departments.edit');
        Route::put('/departments/{department}',       [AdminDepartmentController::class, 'update'])->name('departments.update');
        Route::delete('/departments/{department}',    [AdminDepartmentController::class, 'destroy'])->name('departments.destroy');

        Route::get('/tags',                 [AdminTagController::class, 'index'])->name('tags.index');
        Route::post('/tags',                [AdminTagController::class, 'store'])->name('tags.store');
        Route::put('/tags/{tag}',           [AdminTagController::class, 'update'])->name('tags.update');
        Route::delete('/tags/{tag}',        [AdminTagController::class, 'destroy'])->name('tags.destroy');

        Route::get('/teams',                [AdminTeamController::class, 'index'])->name('teams.index');
        Route::get('/teams/create',         [AdminTeamController::class, 'create'])->name('teams.create');
        Route::post('/teams',               [AdminTeamController::class, 'store'])->name('teams.store');
        Route::get('/teams/{team}/edit',    [AdminTeamController::class, 'edit'])->name('teams.edit');
        Route::put('/teams/{team}',         [AdminTeamController::class, 'update'])->name('teams.update');
        Route::delete('/teams/{team}',      [AdminTeamController::class, 'destroy'])->name('teams.destroy');

        Route::get('/statuses',              [AdminStatusController::class, 'index'])->name('statuses.index');
        Route::post('/statuses',             [AdminStatusController::class, 'store'])->name('statuses.store');
        Route::put('/statuses/{status}',     [AdminStatusController::class, 'update'])->name('statuses.update');
        Route::delete('/statuses/{status}',  [AdminStatusController::class, 'destroy'])->name('statuses.destroy');

        Route::get('/categories',                [AdminCategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories',               [AdminCategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}',     [AdminCategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}',  [AdminCategoryController::class, 'destroy'])->name('categories.destroy');

        Route::get('/custom-fields',                  [AdminCustomFieldController::class, 'index'])->name('custom-fields.index');
        Route::post('/custom-fields',                 [AdminCustomFieldController::class, 'store'])->name('custom-fields.store');
        Route::put('/custom-fields/{customField}',    [AdminCustomFieldController::class, 'update'])->name('custom-fields.update');
        Route::delete('/custom-fields/{customField}', [AdminCustomFieldController::class, 'destroy'])->name('custom-fields.destroy');

        Route::get('/templates',                 [AdminTemplateController::class, 'index'])->name('templates.index');
        Route::get('/templates/create',          [AdminTemplateController::class, 'create'])->name('templates.create');
        Route::post('/templates',                [AdminTemplateController::class, 'store'])->name('templates.store');
        Route::get('/templates/{template}/edit', [AdminTemplateController::class, 'edit'])->name('templates.edit');
        Route::put('/templates/{template}',      [AdminTemplateController::class, 'update'])->name('templates.update');
        Route::delete('/templates/{template}',   [AdminTemplateController::class, 'destroy'])->name('templates.destroy');

        Route::get('/mailboxes',                         [AdminMailboxController::class, 'index'])->name('mailboxes.index');
        Route::post('/mailboxes',                        [AdminMailboxController::class, 'store'])->name('mailboxes.store');
        Route::put('/mailboxes/{mailbox}',               [AdminMailboxController::class, 'update'])->name('mailboxes.update');
        Route::delete('/mailboxes/{mailbox}',            [AdminMailboxController::class, 'destroy'])->name('mailboxes.destroy');
        Route::post('/mailboxes/{mailbox}/test',         [AdminMailboxController::class, 'test'])->name('mailboxes.test');

        Route::get('/email-templates',                            [AdminEmailTemplateController::class, 'index'])->name('email-templates.index');
        Route::put('/email-templates/{eventName}',                [AdminEmailTemplateController::class, 'update'])->name('email-templates.update');
        Route::delete('/email-templates/{eventName}',             [AdminEmailTemplateController::class, 'destroy'])->name('email-templates.destroy');

        Route::get('/sla-policies',                [AdminSlaPolicyController::class, 'index'])->name('sla-policies.index');
        Route::post('/sla-policies',               [AdminSlaPolicyController::class, 'store'])->name('sla-policies.store');
        Route::put('/sla-policies/{slaPolicy}',    [AdminSlaPolicyController::class, 'update'])->name('sla-policies.update');
        Route::delete('/sla-policies/{slaPolicy}', [AdminSlaPolicyController::class, 'destroy'])->name('sla-policies.destroy');

        Route::get('/business-hours',  [AdminBusinessHourController::class, 'index'])->name('business-hours.index');
        Route::put('/business-hours',  [AdminBusinessHourController::class, 'update'])->name('business-hours.update');

        Route::get('/holidays',              [AdminHolidayController::class, 'index'])->name('holidays.index');
        Route::post('/holidays',             [AdminHolidayController::class, 'store'])->name('holidays.store');
        Route::delete('/holidays/{holiday}', [AdminHolidayController::class, 'destroy'])->name('holidays.destroy');
    });

    Route::get('/users/mention-search', UserMentionController::class)->name('users.mention-search');
});
