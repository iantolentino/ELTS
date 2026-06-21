import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input } from '@/Components/UI';
import { PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { TicketTag } from '@/types';

interface TagWithCount extends TicketTag { tickets_count: number; }

interface Props { tags: TagWithCount[]; }

const PRESET_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#22C55E',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${selected ? 'border-[--color-text] scale-110' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: color }} />
    );
}

function TagRow({ tag, onSaved }: { tag: TagWithCount; onSaved: () => void }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        name:  tag.name,
        color: tag.color ?? '#6B7280',
    });

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/tags/${tag.id}`, { onSuccess: () => { setEditing(false); onSaved(); } });
    };

    const cancel = () => { reset(); setEditing(false); };

    if (editing) {
        return (
            <tr className="bg-primary-50/50">
                <td className="px-4 py-3">
                    <Input value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} />
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_COLORS.map(c => (
                            <ColorDot key={c} color={c} selected={data.color === c} onClick={() => setData('color', c)} />
                        ))}
                        <input type="color" value={data.color} onChange={e => setData('color', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border border-[--color-border]" title="Custom color" />
                    </div>
                </td>
                <td className="px-4 py-3 text-sm text-[--color-text-muted]">{tag.tickets_count}</td>
                <td className="px-4 py-3">
                    <form onSubmit={save} className="flex items-center gap-1">
                        <button type="submit" disabled={processing} className="p-1.5 rounded text-success-600 hover:bg-success-50 transition-colors"><CheckIcon className="w-4 h-4" /></button>
                        <button type="button" onClick={cancel} className="p-1.5 rounded text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"><XMarkIcon className="w-4 h-4" /></button>
                    </form>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-[--color-bg] transition-colors">
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color ?? '#6B7280' }} />
                    <span className="text-sm font-medium text-[--color-text]">{tag.name}</span>
                </span>
            </td>
            <td className="px-4 py-3">
                <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: tag.color ?? '#6B7280' }}>{tag.name}</span>
            </td>
            <td className="px-4 py-3 text-sm text-[--color-text-muted]">{tag.tickets_count}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded text-[--color-text-muted] hover:bg-[--color-bg] hover:text-primary-600 transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`Delete tag "${tag.name}"? It will be removed from all tickets.`)) router.delete(`/admin/tags/${tag.id}`); }}
                        className="p-1.5 rounded text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
}

export default function Index({ tags }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', color: '#3B82F6' });
    const [key, setKey] = useState(0);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/tags', { onSuccess: () => { reset(); setKey(k => k + 1); } });
    };

    return (
        <AppLayout>
            <Head title="Tag Management" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-semibold text-[--color-text]">Tag Management</h1>
                    <p className="text-sm text-[--color-text-muted] mt-1">Organize tickets with color-coded labels.</p>
                </div>

                {/* Create form */}
                <div className="bg-white rounded-xl border border-[--color-border] p-5">
                    <h2 className="text-sm font-semibold text-[--color-text] mb-4">Create New Tag</h2>
                    <form key={key} onSubmit={handleCreate} className="flex items-end gap-4 flex-wrap">
                        <div className="flex-1 min-w-48">
                            <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Name</label>
                            <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Bug, Feature Request…" error={errors.name} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Color</label>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {PRESET_COLORS.map(c => (
                                    <ColorDot key={c} color={c} selected={data.color === c} onClick={() => setData('color', c)} />
                                ))}
                                <input type="color" value={data.color} onChange={e => setData('color', e.target.value)}
                                    className="w-6 h-6 rounded cursor-pointer border border-[--color-border]" title="Custom color" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: data.color }}>{data.name || 'Preview'}</span>
                            <Button type="submit" variant="primary" size="sm" disabled={processing}>Add Tag</Button>
                        </div>
                    </form>
                </div>

                {/* Tag list */}
                <div className="bg-white rounded-xl border border-[--color-border] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[--color-border] bg-[--color-bg]">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Preview</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Tickets</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[--color-border]">
                            {tags.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[--color-text-muted]">No tags yet. Create one above.</td></tr>
                            ) : (
                                tags.map(tag => <TagRow key={tag.id} tag={tag} onSaved={() => {}} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
