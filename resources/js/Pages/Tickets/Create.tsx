import { Head, Link, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input } from '@/Components/UI';
import TiptapEditor from '@/Components/editor/TiptapEditor';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { TicketStatus, TicketCategory } from '@/types';

interface AgentOption { id: number; name: string; }
interface TeamOption  { id: number; name: string; }
interface CustomFieldOption { id: number; label: string; type: string; options: string[] | null; is_required: boolean; }

interface Props {
    statuses:     TicketStatus[];
    categories:   TicketCategory[];
    agents:       AgentOption[];
    teams:        TeamOption[];
    customFields: CustomFieldOption[];
}

const PRIORITIES = [
    { value: 'low',      label: 'Low' },
    { value: 'medium',   label: 'Medium' },
    { value: 'high',     label: 'High' },
    { value: 'critical', label: 'Critical' },
];

const SELECT_CLS = 'w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm bg-white text-[--color-text] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

export default function Create({ statuses, categories, agents, teams, customFields }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        subject:     '',
        description: '',
        priority:    'medium' as string,
        category_id: '' as string | number,
        status_id:   (statuses.find(s => s.is_default)?.id ?? '') as string | number,
        assignee_id: '' as string | number,
        team_id:     '' as string | number,
        is_vip:      false,
        due_at:      '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tickets');
    };

    return (
        <AppLayout>
            <Head title="New Ticket" />
            <div className="p-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/tickets" className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">New Ticket</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text] mb-1.5">Subject <span className="text-danger-500">*</span></label>
                        <Input
                            value={data.subject}
                            onChange={e => setData('subject', e.target.value)}
                            placeholder="Brief summary of the issue…"
                            error={errors.subject}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[--color-text] mb-1.5">Description <span className="text-danger-500">*</span></label>
                        <TiptapEditor content={data.description} onChange={v => setData('description', v)} placeholder="Describe the issue in detail…" minHeight={200} />
                        {errors.description && <p className="mt-1 text-xs text-danger-600">{errors.description}</p>}
                    </div>

                    {/* Priority + Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[--color-text] mb-1.5">Priority <span className="text-danger-500">*</span></label>
                            <select value={data.priority} onChange={e => setData('priority', e.target.value)} className={SELECT_CLS}>
                                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[--color-text] mb-1.5">Category</label>
                            <select value={data.category_id} onChange={e => setData('category_id', e.target.value)} className={SELECT_CLS}>
                                <option value="">No category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Assignee + Team */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[--color-text] mb-1.5">Assignee</label>
                            <select value={data.assignee_id} onChange={e => setData('assignee_id', e.target.value)} className={SELECT_CLS}>
                                <option value="">Unassigned</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[--color-text] mb-1.5">Team</label>
                            <select value={data.team_id} onChange={e => setData('team_id', e.target.value)} className={SELECT_CLS}>
                                <option value="">No team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status + Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[--color-text] mb-1.5">Status</label>
                            <select value={data.status_id} onChange={e => setData('status_id', e.target.value)} className={SELECT_CLS}>
                                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[--color-text] mb-1.5">Due Date</label>
                            <input type="date" value={data.due_at} onChange={e => setData('due_at', e.target.value)}
                                className={SELECT_CLS} />
                        </div>
                    </div>

                    {/* Custom Fields */}
                    {customFields.length > 0 && (
                        <div className="space-y-4 pt-2">
                            <p className="text-sm font-semibold text-[--color-text-muted] uppercase tracking-wider">Additional Fields</p>
                            {customFields.map(field => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-[--color-text] mb-1.5">
                                        {field.label}{field.is_required && <span className="text-danger-500"> *</span>}
                                    </label>
                                    {field.type === 'textarea' ? (
                                        <textarea rows={3} className={SELECT_CLS + ' resize-none'} />
                                    ) : field.type === 'select' && field.options ? (
                                        <select className={SELECT_CLS}>
                                            <option value="">Select…</option>
                                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} className={SELECT_CLS} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* VIP */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_vip} onChange={e => setData('is_vip', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded border-[--color-border]" />
                        <span className="text-sm text-[--color-text]">Mark as VIP ticket</span>
                    </label>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" variant="primary" disabled={processing}>
                            {processing ? 'Creating…' : 'Create Ticket'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => router.visit('/tickets')}>Cancel</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
