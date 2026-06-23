import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ScheduledReport {
    id:            number;
    name:          string;
    type:          'overview' | 'custom';
    format:        'pdf' | 'excel' | 'csv';
    schedule:      'daily' | 'weekly' | 'monthly';
    day_of_week:   number | null;
    day_of_month:  number | null;
    time_of_day:   string;
    recipients:    string[];
    params:        Record<string, string> | null;
    is_active:     boolean;
    creator?:      { id: number; name: string } | null;
    created_at:    string;
}

interface Props {
    reports: ScheduledReport[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FORMAT_BADGE: Record<string, string> = {
    pdf:   'bg-red-100 text-red-700',
    excel: 'bg-green-100 text-green-700',
    csv:   'bg-blue-100 text-blue-700',
};

function scheduleLabel(r: ScheduledReport): string {
    const time = r.time_of_day.slice(0, 5);
    if (r.schedule === 'daily')   return `Daily at ${time}`;
    if (r.schedule === 'weekly')  return `Weekly · ${DAY_NAMES[r.day_of_week ?? 1]} at ${time}`;
    if (r.schedule === 'monthly') return `Monthly · day ${r.day_of_month ?? 1} at ${time}`;
    return r.schedule;
}

function toggle(id: number) {
    router.patch(`/admin/scheduled-reports/${id}/toggle`, {}, { preserveScroll: true });
}

function destroy(id: number, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    router.delete(`/admin/scheduled-reports/${id}`);
}

export default function ScheduledReportsIndex({ reports }: Props) {
    return (
        <AppLayout>
            <Head title="Scheduled Reports" />

            <div className="px-6 py-6 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Scheduled Reports</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">
                            Automatically generate and email reports on a schedule
                        </p>
                    </div>
                    <Link
                        href="/admin/scheduled-reports/create"
                        className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-[--color-primary] text-white text-sm font-medium hover:opacity-90"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New Schedule
                    </Link>
                </div>

                {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 h-48 bg-[--color-surface] border border-[--color-border] rounded-xl text-[--color-text-muted]">
                        <span className="text-3xl">📅</span>
                        <p className="text-sm">No scheduled reports yet</p>
                        <Link href="/admin/scheduled-reports/create" className="text-sm text-[--color-primary] hover:underline">
                            Create the first one
                        </Link>
                    </div>
                ) : (
                    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[--color-border] bg-[--color-bg]">
                                    <th className="text-left py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">Name</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">Type</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">Format</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">Schedule</th>
                                    <th className="text-left py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">Recipients</th>
                                    <th className="text-center py-2.5 px-4 text-xs font-medium text-[--color-text-muted]">Active</th>
                                    <th className="py-2.5 px-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map(r => (
                                    <tr key={r.id} className="border-b border-[--color-border] last:border-0 hover:bg-[--color-bg]">
                                        <td className="py-3 px-4">
                                            <p className="font-medium text-[--color-text]">{r.name}</p>
                                            {r.creator && (
                                                <p className="text-xs text-[--color-text-muted]">by {r.creator.name}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 capitalize text-[--color-text]">{r.type}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${FORMAT_BADGE[r.format] ?? ''}`}>
                                                {r.format}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-[--color-text]">{scheduleLabel(r)}</td>
                                        <td className="py-3 px-4 text-[--color-text-muted]">
                                            {r.recipients.length === 1
                                                ? r.recipients[0]
                                                : `${r.recipients[0]} +${r.recipients.length - 1}`}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => toggle(r.id)}
                                                className={[
                                                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                                                    'transition-colors duration-200 focus:outline-none',
                                                    r.is_active ? 'bg-[--color-primary]' : 'bg-[--color-border]',
                                                ].join(' ')}
                                                title={r.is_active ? 'Pause' : 'Activate'}
                                            >
                                                <span className={[
                                                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                                                    r.is_active ? 'translate-x-4' : 'translate-x-0',
                                                ].join(' ')} />
                                            </button>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/admin/scheduled-reports/${r.id}/edit`}
                                                    className="p-1.5 rounded hover:bg-[--color-bg] text-[--color-text-muted]"
                                                    title="Edit"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => destroy(r.id, r.name)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-[--color-text-muted] hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
