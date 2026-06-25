<?php

namespace App\Providers;

use App\Events\SLABreached;
use App\Events\SLAWarning;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketReplied;
use App\Events\TicketStatusChanged;
use App\Listeners\SendSLABreachNotification;
use App\Listeners\SendSLAWarningNotification;
use App\Listeners\SendTicketNotification;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\ServiceProvider;
use Spatie\Activitylog\Models\Activity;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Activity::class, \App\Policies\AuditLogPolicy::class);

        Event::listen(TicketCreated::class,       [SendTicketNotification::class, 'handleTicketCreated']);
        Event::listen(TicketReplied::class,        [SendTicketNotification::class, 'handleTicketReplied']);
        Event::listen(TicketStatusChanged::class,  [SendTicketNotification::class, 'handleTicketStatusChanged']);
        Event::listen(TicketAssigned::class,       [SendTicketNotification::class, 'handleTicketAssigned']);
        Event::listen(SLABreached::class,          [SendSLABreachNotification::class, 'handle']);
        Event::listen(SLAWarning::class,           [SendSLAWarningNotification::class, 'handle']);

        Notification::extend('webpush', fn ($app) => $app->make(WebPushChannel::class));
    }
}
