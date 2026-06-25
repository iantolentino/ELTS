<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StorePushSubscriptionRequest;
use App\Models\PushSubscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(StorePushSubscriptionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        PushSubscription::updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id'          => $request->user()->id,
                'public_key'       => $data['public_key'],
                'auth_token'       => $data['auth_token'],
                'content_encoding' => $data['content_encoding'] ?? 'aesgcm',
            ]
        );

        return back()->with('success', 'Push notifications enabled.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->user()
            ->pushSubscriptions()
            ->where('endpoint', $request->input('endpoint'))
            ->delete();

        return back()->with('success', 'Push notifications disabled.');
    }
}