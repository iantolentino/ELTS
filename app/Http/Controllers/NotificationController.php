<?php
declare(strict_types=1);
namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->get('filter', 'all');
        $query  = $filter === 'unread'
            ? $request->user()->unreadNotifications()
            : $request->user()->notifications();

        $paginated = $query->paginate(20)->through(
            fn (DatabaseNotification $n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'data'       => is_array($n->data) ? $n->data : [],
                'read_at'    => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at->toIso8601String(),
            ]
        );

        return Inertia::render('Notifications/Index', [
            'notifications' => $paginated,
            'filter'        => $filter,
        ]);
    }

    public function markRead(Request $request, string $id): RedirectResponse
    {
        $request->user()->notifications()->findOrFail($id)->markAsRead();
        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);
        return back()->with('success', 'All notifications marked as read.');
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $request->user()->notifications()->findOrFail($id)->delete();
        return back();
    }
}
