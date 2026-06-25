<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PushSubscription;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    public function send(mixed $notifiable, string $title, string $body, string $url = '/'): void
    {
        $publicKey  = config('webpush.vapid.public_key');
        $privateKey = config('webpush.vapid.private_key');
        $subject    = config('webpush.vapid.subject');

        if (empty($publicKey) || empty($privateKey)) {
            return;
        }

        $subscriptions = $notifiable->pushSubscriptions()->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject'    => $subject,
                    'publicKey'  => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ]);

            $payload = json_encode(
                ['title' => $title, 'body' => $body, 'url' => $url],
                JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE
            );

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint'        => $sub->endpoint,
                        'publicKey'       => $sub->public_key,
                        'authToken'       => $sub->auth_token,
                        'contentEncoding' => $sub->content_encoding,
                    ]),
                    $payload
                );
            }

            foreach ($webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                }
            }
        } catch (\Throwable) {
            // Push is best-effort — fail silently to avoid blocking notifications
        }
    }
}