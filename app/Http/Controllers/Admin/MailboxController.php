<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Mailboxes\CreateMailboxRequest;
use App\Http\Requests\Admin\Mailboxes\UpdateMailboxRequest;
use App\Models\Mailbox;
use App\Services\MailboxService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MailboxController extends Controller
{
    public function __construct(private readonly MailboxService $mailboxService) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Mailbox::class);

        return Inertia::render('Admin/Mailboxes/Index', [
            'mailboxes' => Mailbox::withCount('incomingEmails')
                ->orderBy('name')
                ->get()
                ->map(fn (Mailbox $m) => [
                    'id'                  => $m->id,
                    'name'                => $m->name,
                    'host'                => $m->host,
                    'port'                => $m->port,
                    'encryption'          => $m->encryption,
                    'username'            => $m->username,
                    'mailbox_folder'      => $m->mailbox_folder,
                    'is_active'           => $m->is_active,
                    'last_polled_at'      => $m->last_polled_at?->diffForHumans(),
                    'incoming_emails_count' => $m->incoming_emails_count,
                ]),
        ]);
    }

    public function store(CreateMailboxRequest $request): RedirectResponse
    {
        $data               = $request->validated();
        $data['created_by'] = Auth::id();

        Mailbox::create($data);

        return redirect()->route('admin.mailboxes.index')->with('success', 'Mailbox created.');
    }

    public function update(UpdateMailboxRequest $request, Mailbox $mailbox): RedirectResponse
    {
        $data = $request->validated();

        // Keep existing password if not provided
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $mailbox->update($data);

        return redirect()->route('admin.mailboxes.index')->with('success', 'Mailbox updated.');
    }

    public function destroy(Mailbox $mailbox): RedirectResponse
    {
        Gate::authorize('delete', $mailbox);
        $mailbox->delete();

        return redirect()->route('admin.mailboxes.index')->with('success', 'Mailbox deleted.');
    }

    public function test(Mailbox $mailbox): JsonResponse
    {
        Gate::authorize('update', $mailbox);
        $ok = $this->mailboxService->testConnection($mailbox);

        return response()->json([
            'success' => $ok,
            'message' => $ok ? 'Connection successful.' : 'Connection failed. Check your credentials.',
        ]);
    }
}
