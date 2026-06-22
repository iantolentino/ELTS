import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/UI';

interface Policy { id: number; name: string; priority: string | null; }
interface DayConfig { is_open: boolean; open_time: string; close_time: string; timezone: string; }
interface Schedule { [day: number]: DayConfig; }

interface Props {
    policies:  Policy[];
    schedules: Record<string | number, Schedule>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COMMON_TZ = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Manila', 'Asia/Singapore',
    'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
];

const INPUT_CLS  = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';
const SELECT_CLS = 'border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none';

function buildDefaultSchedule(): Schedule {
    return Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => [
            i,
            { is_open: i >= 1 && i <= 5, open_time: '09:00', close_time: '17:00', timezone: 'UTC' },
        ])
    );
}

function ScheduleEditor({
    schedule, policyId, onSaved,
}: { schedule: Schedule; policyId: number | null; onSaved: () => void }) {
    const [days, setDays] = useState<Schedule>(() => ({ ...schedule }));
    const [saving, setSaving] = useState(false);

    const setDay = (i: number, patch: Partial<DayConfig>) =>
        setDays(prev => ({ ...prev, [i]: { ...prev[i], ...patch } }));

    // Sync timezone across all days in one click
    const applyTimezoneToAll = (tz: string) =>
        setDays(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, timezone: tz }])));

    const save = () => {
        setSaving(true);
        router.put('/admin/business-hours', {
            policy_id: policyId,
            days: Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, ...days[i] })),
        }, {
            preserveScroll: true,
            onFinish: () => { setSaving(false); onSaved(); },
        });
    };

    const sharedTz = days[0]?.timezone ?? 'UTC';

    return (
        <div className="space-y-4">
            {/* Global timezone shortcut */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 flex-shrink-0">Apply timezone to all days:</label>
                <select value={sharedTz} onChange={e => applyTimezoneToAll(e.target.value)} className={SELECT_CLS}>
                    {COMMON_TZ.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
            </div>

            {/* Day rows */}
            <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-[--color-border]">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-28">Day</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-24">Open</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Timezone</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-border]">
                        {Array.from({ length: 7 }, (_, i) => {
                            const d = days[i];
                            return (
                                <tr key={i} className={d.is_open ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3 font-medium text-[--color-text]">{DAY_NAMES[i]}</td>
                                    <td className="px-4 py-3">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={d.is_open}
                                                onChange={e => setDay(i, { is_open: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                                            <span className={`ml-2 text-xs font-medium ${d.is_open ? 'text-success-700' : 'text-gray-400'}`}>
                                                {d.is_open ? 'Open' : 'Closed'}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="px-4 py-3">
                                        {d.is_open ? (
                                            <div className="flex items-center gap-2">
                                                <input type="time" value={d.open_time}
                                                    onChange={e => setDay(i, { open_time: e.target.value })}
                                                    className={INPUT_CLS} />
                                                <span className="text-gray-400">–</span>
                                                <input type="time" value={d.close_time}
                                                    onChange={e => setDay(i, { close_time: e.target.value })}
                                                    className={INPUT_CLS} />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Closed all day</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <select value={d.timezone} onChange={e => setDay(i, { timezone: e.target.value })} className={SELECT_CLS}>
                                            {COMMON_TZ.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Schedule'}</Button>
        </div>
    );
}

export default function BusinessHoursIndex({ policies, schedules }: Props) {
    const [selected, setSelected] = useState<'global' | number>('global');

    const selectorItems: Array<{ key: 'global' | number; label: string; sub?: string }> = [
        { key: 'global', label: 'Global Default', sub: 'Applies when no policy-specific hours exist' },
        ...policies.map(p => ({
            key: p.id as number,
            label: p.name,
            sub: p.priority ? `Priority: ${p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}` : 'All priorities',
        })),
    ];

    const currentSchedule = schedules[selected] ?? buildDefaultSchedule();

    return (
        <AppLayout>
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[--color-text]">Business Hours</h1>
                    <p className="text-sm text-[--color-text-muted] mt-0.5">
                        Configure when the SLA clock counts time. Set a global default and optional per-policy overrides.
                    </p>
                </div>

                <div className="flex gap-6 items-start">
                    {/* Policy selector */}
                    <div className="w-56 flex-shrink-0 space-y-1">
                        {selectorItems.map(item => (
                            <button key={String(item.key)}
                                onClick={() => setSelected(item.key)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                                    selected === item.key
                                        ? 'bg-primary-50 border border-primary-200 text-primary-700'
                                        : 'hover:bg-gray-50 text-[--color-text]'
                                }`}>
                                <p className="text-sm font-medium">{item.label}</p>
                                {item.sub && <p className="text-[11px] text-[--color-text-muted] mt-0.5">{item.sub}</p>}
                            </button>
                        ))}
                    </div>

                    {/* Schedule editor */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-[--color-text]">
                                {selectorItems.find(i => i.key === selected)?.label ?? 'Schedule'}
                            </h2>
                            {selected === 'global' && (
                                <p className="text-xs text-[--color-text-muted] mt-0.5">
                                    Used as the default when a policy has no specific hours configured.
                                </p>
                            )}
                        </div>
                        <ScheduleEditor
                            key={String(selected)}
                            schedule={currentSchedule}
                            policyId={selected === 'global' ? null : selected}
                            onSaved={() => {}}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
