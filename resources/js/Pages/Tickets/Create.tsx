import { Head, Link, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input } from '@/Components/UI';
import TiptapEditor from '@/Components/editor/TiptapEditor';
import KbSuggestions from '@/Components/KB/KbSuggestions';
import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon, ServerStackIcon } from '@heroicons/react/24/outline';
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

const ASSET_STATUS_COLORS: Record<string, string> = {
    purchased:   'bg-blue-100 text-blue-700',
    in_use:      'bg-green-100 text-green-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired:     'bg-gray-100 text-gray-500',
};

interface AssetOption { id: number; name: string; asset_tag: string; type: string; status: string; }

function AssetPicker({ selected, onChange }: { selected: AssetOption[]; onChange: (assets: AssetOption[]) => void }) {
    const [query, setQuery]         = useState('');
    const [results, setResults]     = useState<AssetOption[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedIds = new Set(selected.map(a => a.id));

    const search = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 2) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const r = await window.axios.get('/assets/search', {
                    params: { q: value, exclude: Array.from(selectedIds) },
                });
                setResults(r.data);
            } finally { setSearching(false); }
        }, 350);
    };

    const add = (asset: AssetOption) => {
        onChange([...selected, asset]);
        setQuery('');
        setResults([]);
    };

    const remove = (id: number) => onChange(selected.filter(a => a.id !== id));

    return (
        <div className="space-y-2">
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                <input
                    type="text"
                    value={query}
                    onChange={e => search(e.target.value)}
                    placeholder="Search assets by name or tag…"
                    className={SELECT_CLS + ' pl-9'}
                />
            </div>
            {(results.length > 0 || searching) && (
                <div className="border border-[--color-border] rounded-lg overflow-hidden shadow-sm">
                    {searching
                        ? <div className="px-4 py-3 text-sm text-[--color-text-muted]">Searching…</div>
                        : results.map(r => (
                            <button key={r.id} type="button" onClick={() => add(r)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[--color-bg] border-b border-[--color-border] last:border-0 text-sm">
                                <ServerStackIcon className="w-4 h-4 text-[--color-text-muted] shrink-0" />
                                <span className="flex-1 truncate font-medium text-[--color-text]">{r.name}</span>
                                <span className="font-mono text-xs text-[--color-text-muted] shrink-0">{r.asset_tag}</span>
                            </button>
                        ))
                    }
                </div>
            )}
            {selected.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    {selected.map(a => (
                        <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[--color-border] bg-[--color-bg]">
                            <ServerStackIcon className="w-3.5 h-3.5 text-[--color-text-muted] shrink-0" />
                            <span className="text-sm font-medium text-[--color-text] flex-1 truncate">{a.name}</span>
                            <span className="font-mono text-xs text-[--color-text-muted]">{a.asset_tag}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ASSET_STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                {a.status.replace('_', ' ')}
                            </span>
                            <button type="button" onClick={() => remove(a.id)}
                                className="p-0.5 text-[--color-text-muted] hover:text-danger-600 transition-colors shrink-0">
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Create({ statuses, categories, agents, teams, customFields }: Props) {
    const [selectedAssets, setSelectedAssets] = useState<AssetOption[]>([]);
    const { data, setData, post, processing, errors } = useForm<{
        subject: string; description: string; priority: string;
        category_id: string | number; status_id: string | number;
        assignee_id: string | number; team_id: string | number;
        is_vip: boolean; due_at: string; asset_ids: number[];
    }>({
        subject:     '',
        description: '',
        priority:    'medium',
        category_id: '' as string | number,
        status_id:   (statuses.find(s => s.is_default)?.id ?? '') as string | number,
        assignee_id: '' as string | number,
        team_id:     '' as string | number,
        is_vip:      false,
        due_at:      '',
        asset_ids:   [],
    });

    const handleAssetChange = (assets: AssetOption[]) => {
        setSelectedAssets(assets);
        setData('asset_ids', assets.map(a => a.id));
    };

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
                        <KbSuggestions query={data.subject} />
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

                    {/* Assets */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-[--color-text]">Linked Assets</label>
                        <AssetPicker selected={selectedAssets} onChange={handleAssetChange} />
                    </div>

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
