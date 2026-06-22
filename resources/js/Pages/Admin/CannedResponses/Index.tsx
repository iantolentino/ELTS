import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { ChatBubbleLeftEllipsisIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

interface Team { id: number; name: string; }

interface CannedResponse {
    id: number;
    title: string;
    body: string;
    scope: 'global' | 'team' | 'personal';
    is_active: boolean;
    user: { id: number; name: string } | null;
    team: { id: number; name: string } | null;
    can_edit: boolean;
    can_delete: boolean;
}

interface Props extends PageProps {
    responses: CannedResponse[];
    teams: Team[];
    is_admin: boolean;
}

const SCOPE_LABELS: Record<string, string> = { global: 'Global', team: 'Team', personal: 'Personal' };
const SCOPE_COLORS: Record<string, string> = {
    global:   'bg-indigo-100 text-indigo-700',
    team:     'bg-amber-100 text-amber-700',
    personal: 'bg-green-100 text-green-700',
};

const emptyForm = { title: '', body: '', scope: 'global' as string, team_id: '' };

export default function CannedResponsesIndex({ responses, teams, is_admin }: Props) {
    const [editing, setEditing] = useState<CannedResponse | null>(null);
    const [showForm, setShowForm] = useState(false);

    const form = useForm({ ...emptyForm });

    const openCreate = () => {
        form.reset();
        form.setData({ ...emptyForm, scope: is_admin ? 'global' : 'personal' });
        setEditing(null);
        setShowForm(true);
    };

    const openEdit = (cr: CannedResponse) => {
        form.setData({
            title:   cr.title,
            body:    cr.body,
            scope:   cr.scope,
            team_id: cr.team?.id?.toString() ?? '',
        });
        setEditing(cr);
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditing(null); form.reset(); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const opts = { onSuccess: closeForm };
        if (editing) {
            form.put(`/admin/canned-responses/${editing.id}`, opts);
        } else {
            form.post('/admin/canned-responses', opts);
        }
    };

    const destroy = (cr: CannedResponse) => {
        if (!confirm(`Delete "${cr.title}"?`)) return;
        router.delete(`/admin/canned-responses/${cr.id}`, { preserveScroll: true });
    };

    const byScope = (scope: string) => responses.filter(r => r.scope === scope);

    const ScopeGroup = ({ scope, label }: { scope: string; label: string }) => {
        const items = byScope(scope);
        if (items.length === 0) return null;
        return (
            <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</h3>
                <div className="space-y-2">
                    {items.map(cr => (
                        <div key={cr.id} className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-start gap-3 hover:border-indigo-200 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-900 truncate">{cr.title}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SCOPE_COLORS[cr.scope]}`}>
                                        {SCOPE_LABELS[cr.scope]}
                                        {cr.team && ` · ${cr.team.name}`}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: cr.body }} />
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {cr.can_edit && (
                                    <button onClick={() => openEdit(cr)} className="text-gray-300 hover:text-indigo-600 p-1">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                )}
                                {cr.can_delete && (
                                    <button onClick={() => destroy(cr)} className="text-gray-300 hover:text-red-500 p-1">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AppLayout title="Canned Responses">
            <div className="max-w-3xl mx-auto py-6 px-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-indigo-600" />
                        <h1 className="text-xl font-semibold text-gray-900">Canned Responses</h1>
                    </div>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <PlusIcon className="w-4 h-4" /> New Response
                    </button>
                </div>

                <p className="text-xs text-gray-400 mb-5">
                    Use <code className="bg-gray-100 px-1 rounded">{'{{client_name}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{agent_name}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{ticket_number}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{ticket_id}}'}</code> as placeholders — they are filled in automatically when inserting.
                </p>

                {responses.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <ChatBubbleLeftEllipsisIcon className="mx-auto w-10 h-10 text-gray-300 mb-3" />
                        <p className="font-medium">No canned responses yet.</p>
                        <p className="text-sm mt-1">Create one to quickly insert common replies.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {is_admin && <ScopeGroup scope="global" label="Global" />}
                        {is_admin && <ScopeGroup scope="team" label="Team" />}
                        <ScopeGroup scope="personal" label="Personal" />
                        {!is_admin && byScope('global').length > 0 && <ScopeGroup scope="global" label="Global (read-only)" />}
                        {!is_admin && byScope('team').length > 0 && <ScopeGroup scope="team" label="Team (read-only)" />}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900">
                                {editing ? 'Edit Canned Response' : 'New Canned Response'}
                            </h2>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    className="border rounded px-3 py-2 text-sm w-full"
                                    value={form.data.title}
                                    onChange={e => form.setData('title', e.target.value)}
                                    placeholder="e.g. Password reset instructions"
                                />
                                {form.errors.title && <p className="text-red-500 text-xs mt-1">{form.errors.title}</p>}
                            </div>

                            {is_admin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                                    <select
                                        className="border rounded px-3 py-2 text-sm w-full"
                                        value={form.data.scope}
                                        onChange={e => form.setData('scope', e.target.value)}
                                    >
                                        <option value="global">Global (all agents)</option>
                                        <option value="team">Team</option>
                                        <option value="personal">Personal</option>
                                    </select>
                                </div>
                            )}

                            {is_admin && form.data.scope === 'team' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
                                    <select
                                        className="border rounded px-3 py-2 text-sm w-full"
                                        value={form.data.team_id}
                                        onChange={e => form.setData('team_id', e.target.value)}
                                    >
                                        <option value="">— select team —</option>
                                        {teams.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
                                <textarea
                                    className="border rounded px-3 py-2 text-sm w-full font-mono"
                                    rows={8}
                                    value={form.data.body}
                                    onChange={e => form.setData('body', e.target.value)}
                                    placeholder="Hi {{client_name}}, thank you for reaching out…"
                                />
                                {form.errors.body && <p className="text-red-500 text-xs mt-1">{form.errors.body}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50">
                                    {form.processing ? 'Saving…' : (editing ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
