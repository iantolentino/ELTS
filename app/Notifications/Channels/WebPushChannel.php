<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Services\WebPushService;
use Illuminate\Notifications\Notification;

class WebPushChannel
{
    public function __construct(private readonly WebPushService $service) {}

    public function send(mixed $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toWebPush')) {
            return;
        }

        $data = $notification->toWebPush($notifiable);

        $this->service->send(
            $notifiable,
            $data['title'] ?? 'Notification',
            $data['body']  ?? '',
            $data['url']   ?? '/'
        );
    }
}