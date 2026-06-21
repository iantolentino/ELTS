import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Status {
    id: number;
    name: string;
    color: string;
    sort_order: number;
    is_default: boolean;
    is_closed: boolean;
    tickets_count: number;
}

interface Props { statuses: Status[]; }

const PRESET_COLORS = ['#6B7280', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

function StatusForm({ initial, onSave, onCancel }: {
    initial?: Partial<Status>;
    onSave: (data: Partial<Status>) => void;
    onCancel: () => void;
}) {
    const [name, setName]             = useState(initial?.name ?? '');
    const [color, setColor]           = useState(initial?.color ?? '#6B7280');
    const [sortOrder, setSortOrder]   = useState(initial?.sort_order ?? 0);
    const [isDefault, setIsDefault]   = useState(initial?.is_default ?? false);
    const [isClosed, setIsClosed]     = useState(initial?.is_closed ?? false);

    return (
        <div className="grid grid-cols-12 gap-3 items-end p-3 bg-[--color-bg] rounded-xl border border-[--color-border]">
            <div className="col-span-3">
                <label className="text-xs text-[--color-text-muted] block mb-1">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. In Progress" maxLength={50}
                    className="w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="col-span-3">
                <label className="text-xs text-[--color-text-muted] block mb-1">Color</label>
                <div className="space-y-2">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-[--color-border] cursor-pointer p-0.5" />
                    <div className="flex flex-wrap gap-1">
                        {PRESET_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setColor(c)}
                                className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-[--color-text]' : 'border-transparent'}`}
                                style={{ backgroundColor: c }} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="col-span-2">
                <label className="text-xs text-[--color-text-muted] block mb-1">Sort order</label>
                <input type="number" value={sortOrder} min={0} onChange={e => setSortOrder(Number(e.target.value))}
                    className="w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
                    <span>Default</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input type="checkbox" checked={isClosed} onChange={e => setIsClosed(e.target.checked)} className="rounded" />
                    <span>Is closed</span>
                </label>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => onSave({ name, color, sort_order: sortOrder, is_default: isDefault, is_closed: isClosed })}
                    disabled={!name.trim()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5" />Save
                </button>
                <button type="button" onClick={onCancel}
                    className="px-3 py-2 text-sm text-[--color-text-muted] hover:bg-white rounded-lg transition-colors">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function StatusesIndex({ statuses }: Props) {
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleCreate = (data: Partial<Status>) => {
        router.post('/admin/statuses', data as Record<string, unknown>, {
            preserveScroll: true,
            onSuccess: () => setCreating(false),
        });
    };

    const handleUpdate = (id: number, data: Partial<Status>) => {
        router.put(`/admin/statuses/${id}`, data as Record<string, unknown>, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const handleDelete = (status: Status) => {
        if (status.tickets_count > 0) return alert('Cannot delete a status with existing tickets.');
        if (status.is_default) return alert('Cannot delete the default status.');
        if (!confirm(`Delete status "${status.name}"?`)) return;
        router.delete(`/admin/statuses/${status.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Ticket Statuses" />
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Ticket Statuses</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">Manage the lifecycle states for tickets.</p>
                    </div>
                    <button onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <PlusIcon className="w-4 h-4" />New Status
                    </button>
                </div>

                <div className="space-y-2">
                    {creating && (
                        <StatusForm onSave={handleCreate} onCancel={() => setCreating(false)} />
                    )}
                    {statuses.map(status => (
                        <div key={status.id}>
                            {editingId === status.id ? (
                                <StatusForm initial={status} onSave={d => handleUpdate(status.id, d)} onCancel={() => setEditingId(null)} />
                            ) : (
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[--color-border] group">
                                    <span className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-white shadow" style={{ backgroundColor: status.color }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[--color-text]">{status.name}</span>
                                            {status.is_default && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary-100 text-primary-700 rounded">DEFAULT</span>}
                                            {status.is_closed && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[--color-bg] text-[--color-text-muted] rounded">CLOSED</span>}
                                        </div>
                                        <p className="text-xs text-[--color-text-muted] mt-0.5">Sort: {status.sort_order} · {status.tickets_count} ticket{status.tickets_count !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingId(status.id)}
                                            className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] hover:text-[--color-text] transition-colors">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(status)}
                                            className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {statuses.length === 0 && !creating && (
                        <div className="text-center py-12 text-[--color-text-muted] text-sm">No statuses yet. Create one above.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
