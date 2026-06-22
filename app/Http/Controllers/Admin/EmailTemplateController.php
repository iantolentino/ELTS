<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmailTemplateController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', \App\Models\Mailbox::class); // reuse email settings permission

        $stored = EmailTemplate::all()->keyBy('event_name');

        $templates = collect(EmailTemplate::$events)->map(fn (string $label, string $event) => [
            'event_name'  => $event,
            'label'       => $label,
            'subject'     => $stored[$event]?->subject ?? null,
            'body'        => $stored[$event]?->body ?? null,
            'is_active'   => $stored[$event]?->is_active ?? true,
            'is_custom'   => isset($stored[$event]),
        ])->values();

        return Inertia::render('Admin/EmailTemplates/Index', [
            'templates' => $templates,
            'variables' => EmailTemplate::$variables,
        ]);
    }

    public function update(Request $request, string $eventName): RedirectResponse
    {
        Gate::authorize('viewAny', \App\Models\Mailbox::class);

        $request->validate([
            'event_name' => ['required', Rule::in(array_keys(EmailTemplate::$events))],
            'subject'    => ['nullable', 'string', 'max:500'],
            'body'       => ['nullable', 'string'],
            'is_active'  => ['boolean'],
        ]);

        EmailTemplate::updateOrCreate(
            ['event_name' => $eventName],
            [
                'subject'   => $request->input('subject') ?: null,
                'body'      => $request->input('body') ?: null,
                'is_active' => $request->boolean('is_active', true),
            ]
        );

        return back()->with('success', 'Email template saved.');
    }

    public function destroy(string $eventName): RedirectResponse
    {
        Gate::authorize('viewAny', \App\Models\Mailbox::class);

        EmailTemplate::where('event_name', $eventName)->delete();

        return back()->with('success', 'Custom template removed — system default will be used.');
    }
}
