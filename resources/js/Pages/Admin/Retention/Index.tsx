import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArchiveBoxXMarkIcon, PlayIcon, ClockIcon, TableCellsIcon, KeyIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Settings {
    activity_log_days:  number;
    login_history_days: number;
}

interface LastRun {
    ran_at:          string;
    activity_pruned: number;
    login_pruned:    number;
    activity_days:   number;
    login_days:      number;
}

interface Props {
    settings:      Settings;
    lastRun:       LastRun | null;
    activityCount: number;
    loginCount:    number;
}

function StatCard({ label, count, icon: Icon, color }: {
    label: string;
    count: number;
    icon:  React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
}) {
    return (
        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-2xl font-semibold text-[--color-text]">{count.toLocaleString()}</p>
                <p className="text-xs text-[--color-text-muted] mt-0.5">{label}</p>
            </div>
        </div>
    );
}

export default function RetentionIndex({ settings, lastRun, activityCount, loginCount }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        activity_log_days:  settings.activity_log_days,
        login_history_days: settings.login_history_days,
    });

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/retention', { preserveScroll: true });
    };

    const runNow = () => {
        if (!confirm('Run log prune now? This will permanently delete old records.')) return;
        router.post('/admin/retention/run', {}, { preserveScroll: true });
    };

    const INPUT = 'w-32 border border-[--color-border] rounded-lg px-3 h-9 text-sm bg-[--color-surface] text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500';

    return (
        <AppLayout>
            <Head title="Data Retention" />
            <div className="px-6 py-6 space-y-6 max-w-4xl">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Data Retention</h1>
                        <p className="mt-1 text-sm text-[--color-text-muted]">
                            Configure how long audit and login records are kept before automatic deletion.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                        label="Activity log records"
                        count={activityCount}
                        icon={TableCellsIcon}
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        label="Login history records"
                        count={loginCount}
                        icon={KeyIcon}
                        color="bg-violet-50 text-violet-600"
                    />
                </div>

                {/* Last run banner */}
                {lastRun && (
                    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-green-800">
                            <span className="font-medium">Last prune:</span>
                            {' '}
                            {new Date(lastRun.ran_at).toLocaleString()}
                            {' — '}
                            removed <strong>{lastRun.activity_pruned.toLocaleString()}</strong> activity log rows
                            and <strong>{lastRun.login_pruned.toLocaleString()}</strong> login history rows.
                        </div>
                    </div>
                )}

                {/* Settings form */}
                <form onSubmit={save}>
                    <div className="bg-[--color-surface] border border-[--color-border] rounded-xl divide-y divide-[--color-border]">

                        <div className="px-5 py-4 flex items-center gap-3">
                            <ArchiveBoxXMarkIcon className="w-5 h-5 text-[--color-text-muted] flex-shrink-0" />
                            <h2 className="font-medium text-[--color-text]">Retention Periods</h2>
                        </div>

                        <div className="px-5 py-5 space-y-5">

                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[--color-text]">Activity Log</p>
                                    <p className="text-xs text-[--color-text-muted] mt-0.5">
                                        Admin audit trail — all model creates, updates, and deletes.
                                    </p>
                                    {errors.activity_log_days && (
                                        <p className="text-xs text-red-600 mt-1">{errors.activity_log_days}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                        type="number"
                                        min={1}
                                        max={3650}
                                        value={data.activity_log_days}
                                        onChange={e => setData('activity_log_days', parseInt(e.target.value) || 1)}
                                        className={INPUT}
                                    />
                                    <span className="text-sm text-[--color-text-muted] whitespace-nowrap">days</span>
                                </div>
                            </div>

                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[--color-text]">Login History</p>
                                    <p className="text-xs text-[--color-text-muted] mt-0.5">
                                        All login attempts (successful and failed) for all users.
                                    </p>
                                    {errors.login_history_days && (
                                        <p className="text-xs text-red-600 mt-1">{errors.login_history_days}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                        type="number"
                                        min={1}
                                        max={3650}
                                        value={data.login_history_days}
                                        onChange={e => setData('login_history_days', parseInt(e.target.value) || 1)}
                                        className={INPUT}
                                    />
                                    <span className="text-sm text-[--color-text-muted] whitespace-nowrap">days</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                {processing ? 'Saving…' : 'Save settings'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Run now */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl divide-y divide-[--color-border]">
                    <div className="px-5 py-4 flex items-center gap-3">
                        <ClockIcon className="w-5 h-5 text-[--color-text-muted] flex-shrink-0" />
                        <h2 className="font-medium text-[--color-text]">Scheduled Pruning</h2>
                    </div>
                    <div className="px-5 py-5 flex items-center justify-between gap-6">
                        <div>
                            <p className="text-sm text-[--color-text]">
                                The <code className="bg-[--color-bg] px-1.5 py-0.5 rounded text-xs font-mono">logs:prune</code> command
                                runs automatically every day via Laravel Scheduler. You can also trigger it manually below.
                            </p>
                            <p className="text-xs text-[--color-text-muted] mt-1">
                                Records will be permanently deleted — this action cannot be undone.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={runNow}
                            className="inline-flex items-center gap-2 px-4 h-9 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex-shrink-0 transition-colors"
                        >
                            <PlayIcon className="w-4 h-4" />
                            Run now
                        </button>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
