import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input } from '@/Components/UI';
import { PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Policy  { id: number; name: string; priority: string | null; }
interface HolidayItem { id: number; name: string; date: string; date_label: string; recurring_yearly: boolean; }

interface Props {
    policies: Policy[];
    holidays: Record<string | number, HolidayItem[]>;
}

const EMPTY = { name: '', date: '', recurring_yearly: false };

function AddHolidayForm({ policyId, onAdded }: { policyId: number | null; onAdded: () => void }) {
    const { data, setData, processing, errors, reset } = useForm({ ...EMPTY });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/holidays', { ...data, policy_id: policyId }, {
            preserveScroll: true,
            onSuccess: () => { reset(); onAdded(); },
        });
    };

    return (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 border-t border-[--color-border]">
            <div className="flex-1 min-w-40">
                <label className="block text-xs font-medium text-gray-600 mb-1">Holiday Name</label>
                <input value={data.name} onChange={e => setData('name', e.target.value)}
                    placeholder="e.g. Christmas Day" required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                {errors.name && <p className="text-xs text-danger-600 mt-0.5">{errors.name}</p>}
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                {errors.date && <p className="text-xs text-danger-600 mt-0.5">{errors.date}</p>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input type="checkbox" checked={data.recurring_yearly}
                    onChange={e => setData('recurring_yearly', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-700">Repeats yearly</span>
            </label>
            <Button type="submit" disabled={processing} className="flex items-center gap-1.5 pb-2">
                <PlusIcon className="w-4 h-4" /> Add
            </Button>
        </form>
    );
}

export default function HolidaysIndex({ policies, holidays }: Props) {
    const [selected, setSelected] = useState<'global' | number>('global');

    const selectorItems: Array<{ key: 'global' | number; label: string; sub?: string }> = [
        { key: 'global', label: 'Global', sub: 'Applies to all policies' },
        ...policies.map(p => ({
            key: p.id as number,
            label: p.name,
            sub: p.priority ? `Priority: ${p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}` : 'All priorities',
        })),
    ];

    const currentList: HolidayItem[] = holidays[selected] ?? [];
    const policyId = selected === 'global' ? null : selected;

    const remove = (id: number) => {
        if (!confirm('Remove this holiday?')) return;
        router.delete(`/admin/holidays/${id}`, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[--color-text]">Holiday Calendar</h1>
                    <p className="text-sm text-[--color-text-muted] mt-0.5">
                        Define non-working days. The SLA clock skips these dates when counting business hours.
                    </p>
                </div>

                <div className="flex gap-6 items-start">
                    {/* Policy selector */}
                    <div className="w-48 flex-shrink-0 space-y-1">
                        {selectorItems.map(item => (
                            <button key={String(item.key)} onClick={() => setSelected(item.key)}
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

                    {/* Holiday list */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-[--color-text]">
                                {selectorItems.find(i => i.key === selected)?.label} Holidays
                            </h2>
                            {selected === 'global' && (
                                <p className="text-xs text-[--color-text-muted] mt-0.5">
                                    These dates are blocked for all SLA policies.
                                </p>
                            )}
                        </div>

                        <div className="bg-white border border-[--color-border] rounded-xl overflow-hidden">
                            {currentList.length === 0 ? (
                                <p className="text-sm text-[--color-text-muted] italic px-4 py-6 text-center">
                                    No holidays configured. Add one below.
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-[--color-border]">
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Holiday</th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-36">Date</th>
                                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase w-28">Recurring</th>
                                            <th className="w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[--color-border]">
                                        {currentList.map(h => (
                                            <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-[--color-text]">{h.name}</td>
                                                <td className="px-4 py-3 text-[--color-text-muted]">{h.date_label}</td>
                                                <td className="px-4 py-3">
                                                    {h.recurring_yearly ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                                                            <ArrowPathIcon className="w-3 h-3" /> Yearly
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-[--color-text-muted]">Once</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 text-right">
                                                    <button onClick={() => remove(h.id)}
                                                        className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <AddHolidayForm key={String(selected)} policyId={policyId} onAdded={() => {}} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
