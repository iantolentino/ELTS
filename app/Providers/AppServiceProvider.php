<?php

namespace App\Providers;

use App\Events\SLABreached;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketReplied;
use App\Events\TicketStatusChanged;
use App\Listeners\SendSLABreachNotification;
use App\Listeners\SendTicketNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Event::listen(TicketCreated::class,       [SendTicketNotification::class, 'handleTicketCreated']);
        Event::listen(TicketReplied::class,        [SendTicketNotification::class, 'handleTicketReplied']);
        Event::listen(TicketStatusChanged::class,  [SendTicketNotification::class, 'handleTicketStatusChanged']);
        Event::listen(TicketAssigned::class,       [SendTicketNotification::class, 'handleTicketAssigned']);
        Event::listen(SLABreached::class,          [SendSLABreachNotification::class, 'handle']);
    }
}
