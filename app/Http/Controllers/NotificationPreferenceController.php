<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationPreferencesRequest;
use App\Models\NotificationPreference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    private const EVENTS = [
        'ticket_assigned' => 'Ticket Assigned',
        'reply_received'  => 'Reply Received',
        'mention'         => 'Mentioned in Ticket',
        'sla_warning'     => 'SLA Warning',
        'sla_breach'      => 'SLA Breach',
    ];

    public function index(Request $request): Response
    {
        $saved = $request->user()
            ->notificationPreferences()
            ->get()
            ->keyBy('event');

        $preferences = collect(self::EVENTS)
            ->map(function (string $label, string $event) use ($saved) {
                $pref = $saved->get($event);
                return [
                    'event'  => $event,
                    'label'  => $label,
                    'in_app' => $pref ? (bool) $pref->in_app : true,
                    'email'  => $pref ? (bool) $pref->email  : true,
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Notifications/Preferences', [
            'preferences' => $preferences,
        ]);
    }

    public function update(UpdateNotificationPreferencesRequest $request): RedirectResponse
    {
        $user      = $request->user();
        $data      = $request->validated()['preferences'];
        $validKeys = array_keys(self::EVENTS);

        foreach ($data as $event => $channels) {
            if (!in_array($event, $validKeys, strict: true)) {
                continue;
            }

            NotificationPreference::updateOrCreate(
                ['user_id' => $user->id, 'event' => $event],
                [
                    'in_app' => (bool) ($channels['in_app'] ?? true),
                    'email'  => (bool) ($channels['email']  ?? true),
                ]
            );
        }

        return back()->with('success', 'Notification preferences saved.');
    }
}