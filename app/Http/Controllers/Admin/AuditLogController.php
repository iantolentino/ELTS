<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    private const LOG_NAMES = [
        'system', 'ticket', 'user', 'asset', 'team',
        'department', 'knowledge', 'sla', 'automation',
    ];

    private const MODEL_LINKS = [
        'App\\Models\\Ticket'           => '/tickets/%d',
        'App\\Models\\Asset'            => '/admin/assets/%d',
        'App\\Models\\User'             => '/admin/users/%d/edit',
        'App\\Models\\Team'             => '/admin/teams/%d/edit',
        'App\\Models\\Department'       => '/admin/departments/%d/edit',
        'App\\Models\\KnowledgeArticle' => '/admin/kb/articles/%d/edit',
        'App\\Models\\SlaPolicy'        => '/admin/sla-policies',
        'App\\Models\\AutomationRule'   => '/admin/automations/%d/edit',
    ];

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Activity::class);

        $query = $this->buildFilteredQuery($request)
            ->paginate(50)
            ->withQueryString();

        $logs = $query->through(fn (Activity $a) => [
            'id'           => $a->id,
            'log_name'     => $a->log_name,
            'description'  => $a->description,
            'event'        => $a->event,
            'subject_type' => $this->shortModelName($a->subject_type),
            'subject_id'   => $a->subject_id,
            'subject_link' => $a->subject_id && $a->subject_type
                ? $this->subjectLink($a->subject_type, $a->subject_id)
                : null,
            'causer'       => $a->causer ? ['id' => $a->causer->id, 'name' => $a->causer->name] : null,
            'changes'      => $a->properties->get('attributes', []),
            'old'          => $a->properties->get('old', []),
            'created_at'   => $a->created_at->format('M d, Y g:i A'),
        ]);

        $users = User::orderBy('name')->get(['id', 'name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]);

        return Inertia::render('Admin/AuditLog/Index', [
            'logs'      => $logs,
            'filters'   => $request->only(['log_name', 'event', 'causer_id', 'date_from', 'date_to', 'search']),
            'log_names' => self::LOG_NAMES,
            'users'     => $users,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', Activity::class);

        $activities = $this->buildFilteredQuery($request)->limit(5000)->get();

        $filename = 'audit-log-' . now()->format('Y-m-d') . '.csv';

        return response()->stream(function () use ($activities) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Time', 'User', 'Event', 'Model', 'Subject ID', 'Description', 'Changes']);

            foreach ($activities as $a) {
                $old   = $a->properties->get('old', []);
                $attrs = $a->properties->get('attributes', []);
                $parts = [];
                foreach ($old as $key => $oldVal) {
                    $newVal  = $attrs[$key] ?? '—';
                    $parts[] = "{$key}: " . ($oldVal ?? '—') . ' → ' . ($newVal ?? '—');
                }

                fputcsv($handle, [
                    $a->created_at->format('Y-m-d H:i:s'),
                    $a->causer?->name ?? 'System',
                    $a->event ?? '',
                    $this->shortModelName($a->subject_type) ?? '',
                    $a->subject_id ?? '',
                    $a->description,
                    implode('; ', $parts),
                ]);
            }

            fclose($handle);
        }, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportPdf(Request $request): \Illuminate\Http\Response
    {
        Gate::authorize('viewAny', Activity::class);

        $activities = $this->buildFilteredQuery($request)->limit(500)->get()
            ->map(fn (Activity $a) => [
                'created_at'   => $a->created_at->format('M d, Y g:i A'),
                'causer'       => $a->causer?->name ?? 'System',
                'event'        => $a->event ?? '',
                'subject_type' => $this->shortModelName($a->subject_type) ?? '',
                'subject_id'   => $a->subject_id ?? '',
                'description'  => $a->description,
                'changes_count'=> count($a->properties->get('old', [])),
            ]);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.audit-log-pdf', [
            'activities'   => $activities,
            'filters'      => $request->only(['log_name', 'event', 'causer_id', 'date_from', 'date_to', 'search']),
            'generated_at' => now()->format('M d, Y g:i A'),
            'total'        => $activities->count(),
            'truncated'    => $activities->count() >= 500,
        ]);

        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('audit-log-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildFilteredQuery(Request $request): Builder
    {
        return Activity::with(['causer'])
            ->when($request->input('log_name'), fn ($q, $v) => $q->inLog($v))
            ->when($request->input('event'), fn ($q, $v) => $q->where('event', $v))
            ->when($request->input('causer_id'), function ($q, $v) {
                $user = User::find((int) $v);
                if ($user) {
                    $q->causedBy($user);
                }
            })
            ->when($request->input('date_from'), fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->input('date_to'),   fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('description', 'like', "%{$search}%")
                       ->orWhere('subject_type', 'like', "%{$search}%");
                });
            })
            ->latest();
    }

    private function shortModelName(?string $fqcn): ?string
    {
        if (!$fqcn) {
            return null;
        }

        return class_basename($fqcn);
    }

    private function subjectLink(string $fqcn, int $id): ?string
    {
        $pattern = self::MODEL_LINKS[$fqcn] ?? null;

        return $pattern ? sprintf($pattern, $id) : null;
    }
}
