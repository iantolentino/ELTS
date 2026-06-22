import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input } from '@/Components/UI';
import { PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface SlaPolicy {
    id: number;
    name: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'critical' | null;
    first_response_minutes: number;
    first_response_label: string;
    resolution_minutes: number;
    resolution_label: string;
    uses_business_hours: boolean;
    is_active: boolean;
    sla_records_count: number;
}

interface Props { policies: SlaPolicy[]; }

const EMPTY_FORM = {
    name: '', description: '', priority: '' as string,
    first_response_minutes: 240, resolution_minutes: 480,
    uses_business_hours: false, is_active: true,
};

const PRIORITY_LABELS: Record<string, string> = {
    '': 'All priorities (catch-all)',
    low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'bg-success-100 text-success-700',
    medium: 'bg-primary-100 text-primary-700',
    high: 'bg-warning-100 text-warning-700',
    critical: 'bg-danger-100 text-danger-700',
};

const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

function minutesToForm(min: number): string { return String(min); }

function PolicyForm({
    initial, onSave, onCancel, label,
}: {
    initial: typeof EMPTY_FORM & { id?: number };
    onSave: (data: typeof EMPTY_FORM) => void;
    onCancel: () => void;
    label: string;
}) {
    const { data, setData, processing, errors } = useForm({ ...initial });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Policy Name" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applies to Priority</label>
                    <select value={data.priority} onChange={e => setData('priority', e.target.value)} className={INPUT_CLS}>
                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={data.description} onChange={e => setData('description', e.target.value)}
                    rows={2} className={INPUT_CLS} placeholder="Optional notes about this policy" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Response (minutes)</label>
                    <input type="number" min={1} value={minutesToForm(data.first_response_minutes)}
                        onChange={e => setData('first_response_minutes', Number(e.target.value))}
                        className={INPUT_CLS} required />
                    {errors.first_response_minutes && <p className="text-xs text-danger-600 mt-1">{errors.first_response_minutes}</p>}
                    <p className="text-xs text-gray-400 mt-1">e.g. 240 = 4 hours, 60 = 1 hour</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution (minutes)</label>
                    <input type="number" min={1} value={minutesToForm(data.resolution_minutes)}
                        onChange={e => setData('resolution_minutes', Number(e.target.value))}
                        className={INPUT_CLS} required />
                    {errors.resolution_minutes && <p className="text-xs text-danger-600 mt-1">{errors.resolution_minutes}</p>}
                    <p className="text-xs text-gray-400 mt-1">e.g. 480 = 8 hours, 1440 = 24 hours</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={data.uses_business_hours}
                        onChange={e => setData('uses_business_hours', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-700">Count only business hours</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={data.is_active}
                        onChange={e => setData('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                    <span className="text-sm text-gray-700">Active</span>
                </label>
            </div>
            <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={processing}>{label}</Button>
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    );
}

export default function SlaPoliciesIndex({ policies }: Props) {
    const [creating, setCreating]                = useState(false);
    const [editingId, setEditingId]              = useState<number | null>(null);

    const handleCreate = (data: typeof EMPTY_FORM) => {
        router.post('/admin/sla-policies', data, {
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: typeof EMPTY_FORM) => {
        router.put(`/admin/sla-policies/${id}`, data, {
            onSuccess: () => setEditingId(null),
        });
    };

    const handleDelete = (policy: SlaPolicy) => {
        if (!confirm(`Delete policy "${policy.name}"? This cannot be undone.`)) return;
        router.delete(`/admin/sla-policies/${policy.id}`);
    };

    return (
        <AppLayout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">SLA Policies</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">Define response and resolution time targets per ticket priority.</p>
                    </div>
                    {!creating && (
                        <Button onClick={() => { setCreating(true); setEditingId(null); }} className="flex items-center gap-1.5">
                            <PlusIcon className="w-4 h-4" /> New Policy
                        </Button>
                    )}
                </div>

                {creating && (
                    <PolicyForm
                        initial={{ ...EMPTY_FORM }}
                        onSave={handleCreate}
                        onCancel={() => setCreating(false)}
                        label="Create Policy"
                    />
                )}

                <div className="space-y-3">
                    {policies.length === 0 && !creating && (
                        <div className="bg-white border border-[--color-border] rounded-xl p-8 text-center text-[--color-text-muted] text-sm">
                            No SLA policies yet. Create one to start tracking response targets.
                        </div>
                    )}

                    {policies.map(policy => (
                        <div key={policy.id}>
                            {editingId === policy.id ? (
                                <PolicyForm
                                    initial={{
                                        id: policy.id,
                                        name: policy.name,
                                        description: policy.description ?? '',
                                        priority: policy.priority ?? '',
                                        first_response_minutes: policy.first_response_minutes,
                                        resolution_minutes: policy.resolution_minutes,
                                        uses_business_hours: policy.uses_business_hours,
                                        is_active: policy.is_active,
                                    }}
                                    onSave={data => handleUpdate(policy.id, data)}
                                    onCancel={() => setEditingId(null)}
                                    label="Save Changes"
                                />
                            ) : (
                                <div className="bg-white border border-[--color-border] rounded-xl p-4 flex items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm text-[--color-text]">{policy.name}</span>
                                            {policy.priority ? (
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_COLORS[policy.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                                                    {policy.priority.charAt(0).toUpperCase() + policy.priority.slice(1)}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">All priorities</span>
                                            )}
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${policy.is_active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {policy.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {policy.description && (
                                            <p className="text-xs text-[--color-text-muted] mb-2">{policy.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-4 text-xs text-[--color-text-muted]">
                                            <span>1st response: <strong className="text-[--color-text]">{policy.first_response_label}</strong></span>
                                            <span>Resolution: <strong className="text-[--color-text]">{policy.resolution_label}</strong></span>
                                            <span>{policy.uses_business_hours ? '⏱ Business hours' : '🕐 Calendar time'}</span>
                                            <span>{policy.sla_records_count} ticket{policy.sla_records_count !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button onClick={() => { setEditingId(policy.id); setCreating(false); }}
                                            className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Edit">
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(policy)}
                                            className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors" title="Delete">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
