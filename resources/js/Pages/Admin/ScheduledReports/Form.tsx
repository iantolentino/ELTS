import { Link } from '@inertiajs/react';

const INPUT_CLS =
    'w-full h-9 rounded-md border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary]';

const SELECT_CLS = INPUT_CLS;

const DAY_NAMES = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

interface FormData {
    name:         string;
    type:         'overview' | 'custom';
    format:       'pdf' | 'excel' | 'csv';
    schedule:     'daily' | 'weekly' | 'monthly';
    day_of_week:  number;
    day_of_month: number;
    time_of_day:  string;
    recipients:   string;
    params: { metric: string; group_by: string };
    is_active: boolean;
}

interface Props {
    form:        { data: FormData; setData: (key: keyof FormData, value: unknown) => void; errors: Partial<Record<keyof FormData | string, string>>; processing: boolean };
    onSubmit:    (e: React.FormEvent) => void;
    submitLabel: string;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[--color-text]">{label}</label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default function ScheduledReportForm({ form, onSubmit, submitLabel }: Props) {
    const { data, setData, errors, processing } = form;

    return (
        <form onSubmit={onSubmit} className="space-y-5">

            {/* Name */}
            <Field label="Name" error={errors.name}>
                <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    placeholder="Weekly overview for management"
                    className={INPUT_CLS}
                />
            </Field>

            {/* Type + Format */}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Report Type" error={errors.type}>
                    <select value={data.type} onChange={e => setData('type', e.target.value)} className={SELECT_CLS}>
                        <option value="overview">Overview (KPIs + breakdown)</option>
                        <option value="custom">Custom report</option>
                    </select>
                </Field>
                <Field label="Export Format" error={errors.format}>
                    <select value={data.format} onChange={e => setData('format', e.target.value)} className={SELECT_CLS}>
                        <option value="excel">Excel (.xlsx)</option>
                        <option value="csv">CSV (.csv)</option>
                        <option value="pdf">PDF (.pdf)</option>
                    </select>
                </Field>
            </div>

            {/* Custom report params */}
            {data.type === 'custom' && (
                <div className="rounded-lg border border-[--color-border] p-4 space-y-4 bg-[--color-bg]">
                    <p className="text-xs font-medium text-[--color-text-muted] uppercase tracking-wide">Custom Report Parameters</p>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Metric" error={errors['params.metric']}>
                            <select
                                value={data.params.metric}
                                onChange={e => setData('params', { ...data.params, metric: e.target.value })}
                                className={SELECT_CLS}
                            >
                                <option value="volume">Ticket Volume</option>
                                <option value="avg_resolution">Avg Resolution Time</option>
                            </select>
                        </Field>
                        <Field label="Group By" error={errors['params.group_by']}>
                            <select
                                value={data.params.group_by}
                                onChange={e => setData('params', { ...data.params, group_by: e.target.value })}
                                className={SELECT_CLS}
                            >
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="priority">Priority</option>
                                <option value="status">Status</option>
                                <option value="category">Category</option>
                                <option value="agent">Agent</option>
                                <option value="team">Team</option>
                            </select>
                        </Field>
                    </div>
                </div>
            )}

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
                <Field label="Frequency" error={errors.schedule}>
                    <select value={data.schedule} onChange={e => setData('schedule', e.target.value)} className={SELECT_CLS}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </Field>
                <Field label="Time" error={errors.time_of_day}>
                    <input
                        type="time"
                        value={data.time_of_day}
                        onChange={e => setData('time_of_day', e.target.value)}
                        className={INPUT_CLS}
                    />
                </Field>
            </div>

            {/* Day selector (conditional) */}
            {data.schedule === 'weekly' && (
                <Field label="Day of Week" error={errors.day_of_week}>
                    <select value={data.day_of_week} onChange={e => setData('day_of_week', parseInt(e.target.value))} className={SELECT_CLS}>
                        {DAY_NAMES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </Field>
            )}

            {data.schedule === 'monthly' && (
                <Field label="Day of Month" error={errors.day_of_month}>
                    <select value={data.day_of_month} onChange={e => setData('day_of_month', parseInt(e.target.value))} className={SELECT_CLS}>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </Field>
            )}

            {/* Recipients */}
            <Field label="Recipients" error={errors.recipients}>
                <textarea
                    value={data.recipients}
                    onChange={e => setData('recipients', e.target.value)}
                    rows={4}
                    placeholder="manager@company.com&#10;director@company.com"
                    className="w-full rounded-md border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary] resize-none"
                />
                <p className="text-xs text-[--color-text-muted]">One email per line, or comma-separated</p>
            </Field>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setData('is_active', !data.is_active)}
                    className={[
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                        'transition-colors duration-200',
                        data.is_active ? 'bg-[--color-primary]' : 'bg-[--color-border]',
                    ].join(' ')}
                >
                    <span className={[
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                        data.is_active ? 'translate-x-4' : 'translate-x-0',
                    ].join(' ')} />
                </button>
                <span className="text-sm text-[--color-text]">
                    {data.is_active ? 'Active — will run on schedule' : 'Paused — will not send'}
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={processing}
                    className="h-9 px-5 rounded-md bg-[--color-primary] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                    {submitLabel}
                </button>
                <Link
                    href="/admin/scheduled-reports"
                    className="h-9 px-4 rounded-md border border-[--color-border] text-sm text-[--color-text-muted] hover:bg-[--color-bg] flex items-center"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
