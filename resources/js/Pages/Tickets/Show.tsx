import { useState, useMemo, useRef, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Button } from '@/Components/UI';
import TiptapEditor from '@/Components/editor/TiptapEditor';
import { ArrowLeftIcon, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { LockClosedIcon, TrashIcon, PlusIcon, XMarkIcon, BellIcon, BellSlashIcon, ArrowsRightLeftIcon, MagnifyingGlassIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { TicketStatus, TicketTag } from '@/types';

interface UserMin { id: number | null; name: string; avatar_url: string | null; email?: string; }
interface TeamMin { id: number; name: string; }
interface AgentMin { id: number; name: string; }
interface ActivityEntry { id: number; description: string; causer: { name: string } | null; changes: Record<string, unknown>; old: Record<string, unknown>; created_at: string; }
interface TicketReplyData { id: number; user: UserMin; body: string; is_html: boolean; cc: string[] | null; created_at: string; }
interface TicketNoteData { id: number; user: UserMin; body: string; is_html: boolean; created_at: string; }
interface CFValue { field: { id: number; label: string; type: string }; value: string | null; }

interface TicketData {
    id: number; ticket_number: string; subject: string; description: string;
    priority: 'low' | 'medium' | 'high' | 'critical'; source: string; is_vip: boolean;
    due_at: string | null; first_response_at: string | null; resolved_at: string | null;
    closed_at: string | null; created_at: string; updated_at: string;
    status: TicketStatus; category: { id: number; name: string } | null;
    requester: UserMin; assignee: UserMin | null; team: TeamMin | null;
    tags: TicketTag[]; watchers: UserMin[]; is_watching: boolean;
    replies: TicketReplyData[]; notes: TicketNoteData[];
    activity: ActivityEntry[]; custom_field_values: CFValue[];
}

interface Perms { reply: boolean; note_internal: boolean; assign: boolean; change_status: boolean; change_priority: boolean; update: boolean; watch: boolean; merge: boolean; delete: boolean; }

interface Props {
    ticket:   TicketData;
    can:      Perms;
    statuses: TicketStatus[];
    agents:   AgentMin[];
    teams:    TeamMin[];
    allTags:  TicketTag[];
}

const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const SELECT_CLS = 'w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm bg-white text-[--color-text] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none';

interface SearchResult { id: number; ticket_number: string; subject: string; status: { name: string; color: string }; }

function MergeModal({ ticket, onClose }: { ticket: TicketData; onClose: () => void }) {
    const [query, setQuery]       = useState('');
    const [results, setResults]   = useState<SearchResult[]>([]);
    const [target, setTarget]     = useState<SearchResult | null>(null);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const search = (value: string) => {
        setQuery(value);
        setTarget(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 2) { setResults([]); return; }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await window.axios.get('/tickets/search', { params: { q: value, exclude: ticket.id } });
                setResults(res.data);
            } finally {
                setSearching(false);
            }
        }, 350);
    };

    const submit = () => {
        if (!target) return;
        setSubmitting(true);
        router.post(`/tickets/${ticket.id}/merge`, { target_ticket_id: target.id }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border]">
                    <div className="flex items-center gap-2">
                        <ArrowsRightLeftIcon className="w-5 h-5 text-primary-600" />
                        <h2 className="text-base font-semibold text-[--color-text]">Merge Ticket</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"><XMarkIcon className="w-4 h-4" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                        <strong>{ticket.ticket_number}</strong> will be closed and all its replies, notes, and attachments will move to the target ticket.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[--color-text] mb-1.5">Search for target ticket</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => search(e.target.value)}
                                placeholder="Ticket # or subject…"
                                autoFocus
                                className="w-full border border-[--color-border] rounded-lg pl-9 pr-4 py-2 text-sm text-[--color-text] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                        </div>

                        {(results.length > 0 || searching) && !target && (
                            <div className="mt-1 border border-[--color-border] rounded-lg overflow-hidden shadow-sm">
                                {searching ? (
                                    <div className="px-4 py-3 text-sm text-[--color-text-muted]">Searching…</div>
                                ) : results.map(r => (
                                    <button key={r.id} onClick={() => { setTarget(r); setResults([]); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[--color-bg] transition-colors border-b border-[--color-border] last:border-0">
                                        <span className="font-mono text-xs font-semibold text-primary-600 flex-shrink-0">{r.ticket_number}</span>
                                        <span className="text-sm text-[--color-text] truncate flex-1">{r.subject}</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex-shrink-0" style={{ backgroundColor: r.status.color }}>{r.status.name}</span>
                                    </button>
                                ))}
                                {!searching && results.length === 0 && query.length >= 2 && (
                                    <div className="px-4 py-3 text-sm text-[--color-text-muted]">No tickets found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {target && (
                        <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-lg px-4 py-3">
                            <CheckCircleIcon className="w-5 h-5 text-success-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[--color-text]">
                                    <span className="font-mono text-primary-600">{target.ticket_number}</span> — {target.subject}
                                </p>
                                <p className="text-xs text-[--color-text-muted] mt-0.5">This will be the target ticket</p>
                            </div>
                            <button onClick={() => { setTarget(null); setQuery(''); }} className="text-[--color-text-muted] hover:text-[--color-text]"><XMarkIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[--color-border]">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[--color-text] hover:bg-[--color-bg] rounded-lg transition-colors">Cancel</button>
                    <button onClick={submit} disabled={!target || submitting}
                        className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {submitting ? 'Merging…' : 'Merge Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TagPicker({ ticket, allTags, canUpdate }: { ticket: TicketData; allTags: TicketTag[]; canUpdate: boolean }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const attachedIds = new Set(ticket.tags.map(t => t.id));
    const available   = allTags.filter(t => !attachedIds.has(t.id));

    const addTag    = (tagId: number) => router.post(`/tickets/${ticket.id}/tags`, { tag_id: tagId }, { preserveScroll: true });
    const removeTag = (tagId: number) => router.delete(`/tickets/${ticket.id}/tags/${tagId}`, { preserveScroll: true });

    return (
        <div className="p-4 space-y-2">
            <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Tags</label>
            <div className="flex flex-wrap gap-1">
                {ticket.tags.map(tag => (
                    <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: tag.color ?? '#6B7280' }}>
                        {tag.name}
                        {canUpdate && (
                            <button onClick={() => removeTag(tag.id)} className="opacity-70 hover:opacity-100 ml-0.5">
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        )}
                    </span>
                ))}
                {canUpdate && available.length > 0 && (
                    <div ref={ref} className="relative">
                        <button onClick={() => setOpen(o => !o)}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium border border-dashed border-[--color-border] text-[--color-text-muted] hover:border-primary-400 hover:text-primary-600 transition-colors">
                            <PlusIcon className="w-3 h-3" /> Add
                        </button>
                        {open && (
                            <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-lg border border-[--color-border] shadow-lg z-20 py-1 max-h-48 overflow-y-auto">
                                {available.map(tag => (
                                    <button key={tag.id} onClick={() => { addTag(tag.id); setOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[--color-bg] text-left transition-colors">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color ?? '#6B7280' }} />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {ticket.tags.length === 0 && !canUpdate && <span className="text-xs text-[--color-text-muted] italic">None</span>}
            </div>
        </div>
    );
}

export default function Show({ ticket, can, statuses, agents, teams, allTags }: Props) {
    const [activeTab, setActiveTab] = useState<'reply' | 'note'>(can.reply ? 'reply' : 'note');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [mergeOpen, setMergeOpen] = useState(false);

    const thread = useMemo(() => [
        ...ticket.replies.map(r => ({ ...r, type: 'reply' as const })),
        ...ticket.notes.map(n => ({ ...n, type: 'note' as const })),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [ticket]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!body || body === '<p></p>') return;
        setSubmitting(true);
        const url = activeTab === 'reply' ? `/tickets/${ticket.id}/replies` : `/tickets/${ticket.id}/notes`;
        router.post(url, { body }, { onSuccess: () => setBody(''), onFinish: () => setSubmitting(false) });
    };

    const patchStatus   = (v: string) => router.patch(`/tickets/${ticket.id}/status`,   { status_id: v },    { preserveScroll: true });
    const patchPriority = (v: string) => router.patch(`/tickets/${ticket.id}/priority`, { priority: v },     { preserveScroll: true });
    const patchAssignee = (v: string) => router.patch(`/tickets/${ticket.id}/assign`,   { assignee_id: v || null }, { preserveScroll: true });
    const patchTeam     = (v: string) => router.patch(`/tickets/${ticket.id}/assign`,   { team_id: v || null },     { preserveScroll: true });

    const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <AppLayout>
            <Head title={`${ticket.ticket_number} · ${ticket.subject}`} />
            {mergeOpen && <MergeModal ticket={ticket} onClose={() => setMergeOpen(false)} />}
            <div className="p-6 max-w-7xl mx-auto space-y-4">

                {/* Header */}
                <div className="flex items-start gap-3">
                    <Link href="/tickets" className="mt-1 p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[--color-text-muted] mb-1">
                            <span className="font-mono">{ticket.ticket_number}</span>
                            <span>·</span>
                            <span>via {ticket.source}</span>
                            {ticket.first_response_at && <><span>·</span><span>First reply {ticket.first_response_at}</span></>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {ticket.is_vip && <StarSolid className="w-4 h-4 text-warning-500 flex-shrink-0" />}
                            <h1 className="text-xl font-semibold text-[--color-text]">{ticket.subject}</h1>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ticket.status.color }}>{ticket.status.name}</span>
                            <Badge priority={ticket.priority} dot>{ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</Badge>
                        </div>
                    </div>
                    {can.merge && (
                        <button onClick={() => setMergeOpen(true)}
                            title="Merge ticket"
                            className="p-2 rounded-lg text-[--color-text-muted] hover:bg-primary-50 hover:text-primary-600 transition-colors">
                            <ArrowsRightLeftIcon className="w-4 h-4" />
                        </button>
                    )}
                    {can.delete && (
                        <button onClick={() => { if (confirm('Delete this ticket?')) router.delete(`/tickets/${ticket.id}`); }}
                            className="p-2 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-3 gap-6 items-start">

                    {/* Left: Thread + Form */}
                    <div className="col-span-2 space-y-4">
                        {/* Original description */}
                        <div className="bg-white rounded-xl border border-[--color-border] p-5">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[--color-border]">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">{initials(ticket.requester.name)}</div>
                                <div>
                                    <p className="text-sm font-medium text-[--color-text]">{ticket.requester.name}</p>
                                    <p className="text-xs text-[--color-text-muted]">{ticket.created_at}</p>
                                </div>
                            </div>
                            <div className="ticket-body text-sm" dangerouslySetInnerHTML={{ __html: ticket.description }} />
                        </div>

                        {/* Thread */}
                        {thread.map(entry => (
                            <div key={`${entry.type}-${entry.id}`}
                                className={`rounded-xl border p-5 ${entry.type === 'note' ? 'bg-warning-50 border-warning-200' : 'bg-white border-[--color-border]'}`}>
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[--color-border]/50">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${entry.type === 'note' ? 'bg-warning-200 text-warning-800' : 'bg-success-100 text-success-700'}`}>
                                        {initials(entry.user.name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[--color-text]">{entry.user.name}</p>
                                        <p className="text-xs text-[--color-text-muted]">{entry.created_at}</p>
                                    </div>
                                    {entry.type === 'note' && (
                                        <span className="flex items-center gap-1 text-xs text-warning-700 font-medium">
                                            <LockClosedIcon className="w-3 h-3" />Internal note
                                        </span>
                                    )}
                                </div>
                                <div className="ticket-body text-sm" dangerouslySetInnerHTML={{ __html: entry.body }} />
                            </div>
                        ))}

                        {/* Reply / Note form */}
                        {(can.reply || can.note_internal) && (
                            <div className="bg-white rounded-xl border border-[--color-border] p-5">
                                <div className="flex border-b border-[--color-border] mb-4 -mx-5 px-5">
                                    {can.reply && <button onClick={() => setActiveTab('reply')} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'reply' ? 'border-primary-600 text-primary-700' : 'border-transparent text-[--color-text-muted] hover:text-[--color-text]'}`}>Reply</button>}
                                    {can.note_internal && <button onClick={() => setActiveTab('note')} className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${activeTab === 'note' ? 'border-warning-500 text-warning-700' : 'border-transparent text-[--color-text-muted] hover:text-[--color-text]'}`}><LockClosedIcon className="w-3.5 h-3.5" />Internal Note</button>}
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <TiptapEditor content={body} onChange={setBody} placeholder={activeTab === 'reply' ? 'Write a reply…' : 'Add an internal note (not visible to client)…'} minHeight={140} />
                                    <div className="flex justify-end">
                                        <Button variant={activeTab === 'note' ? 'warning' : 'primary'} size="sm" disabled={submitting || !body || body === '<p></p>'}>
                                            {submitting ? 'Sending…' : activeTab === 'reply' ? 'Send Reply' : 'Add Note'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Right: Sidebar */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-[--color-border] divide-y divide-[--color-border]">
                            {/* Status */}
                            <div className="p-4 space-y-1">
                                <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Status</label>
                                {can.change_status ? (
                                    <select defaultValue={ticket.status.id} onChange={e => patchStatus(e.target.value)} className={SELECT_CLS}>
                                        {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                ) : (
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ticket.status.color }}>{ticket.status.name}</span>
                                )}
                            </div>
                            {/* Priority */}
                            <div className="p-4 space-y-1">
                                <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Priority</label>
                                {can.change_priority ? (
                                    <select defaultValue={ticket.priority} onChange={e => patchPriority(e.target.value)} className={SELECT_CLS}>
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                    </select>
                                ) : (
                                    <Badge priority={ticket.priority} dot>{ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}</Badge>
                                )}
                            </div>
                            {/* Assignee */}
                            <div className="p-4 space-y-1">
                                <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Assignee</label>
                                {can.assign ? (
                                    <select defaultValue={ticket.assignee?.id ?? ''} onChange={e => patchAssignee(e.target.value)} className={SELECT_CLS}>
                                        <option value="">Unassigned</option>
                                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                ) : (
                                    <span className="text-sm text-[--color-text]">{ticket.assignee?.name ?? <em className="text-[--color-text-muted]">Unassigned</em>}</span>
                                )}
                            </div>
                            {/* Team */}
                            <div className="p-4 space-y-1">
                                <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Team</label>
                                {can.assign ? (
                                    <select defaultValue={ticket.team?.id ?? ''} onChange={e => patchTeam(e.target.value)} className={SELECT_CLS}>
                                        <option value="">No team</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                ) : (
                                    <span className="text-sm text-[--color-text]">{ticket.team?.name ?? <em className="text-[--color-text-muted]">None</em>}</span>
                                )}
                            </div>
                            {/* Category */}
                            <div className="p-4 space-y-1">
                                <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Category</label>
                                <p className="text-sm text-[--color-text]">{ticket.category?.name ?? <em className="text-[--color-text-muted]">None</em>}</p>
                            </div>
                            {/* Tags */}
                            <TagPicker ticket={ticket} allTags={allTags} canUpdate={can.update} />
                        </div>

                        {/* Requester info */}
                        <div className="bg-white rounded-xl border border-[--color-border] p-4 space-y-3">
                            <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Requester</label>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{initials(ticket.requester.name)}</div>
                                <div>
                                    <p className="text-sm font-medium text-[--color-text]">{ticket.requester.name}</p>
                                    {ticket.requester.email && <p className="text-xs text-[--color-text-muted]">{ticket.requester.email}</p>}
                                </div>
                            </div>
                            <div className="space-y-1 text-xs text-[--color-text-muted]">
                                <p>Created <span className="text-[--color-text]">{ticket.created_at}</span></p>
                                <p>Updated <span className="text-[--color-text]">{ticket.updated_at}</span></p>
                                {ticket.due_at && <p>Due <span className="text-danger-600 font-medium">{ticket.due_at}</span></p>}
                            </div>
                        </div>

                        {/* Watchers */}
                        <div className="bg-white rounded-xl border border-[--color-border] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider">Watchers</label>
                                {can.watch && (
                                    ticket.is_watching ? (
                                        <button onClick={() => router.delete(`/tickets/${ticket.id}/watch`, { preserveScroll: true })}
                                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors">
                                            <BellSlashIcon className="w-3.5 h-3.5" /> Unwatch
                                        </button>
                                    ) : (
                                        <button onClick={() => router.post(`/tickets/${ticket.id}/watch`, {}, { preserveScroll: true })}
                                            className="flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-primary-600 font-medium transition-colors">
                                            <BellIcon className="w-3.5 h-3.5" /> Watch
                                        </button>
                                    )
                                )}
                            </div>
                            {ticket.watchers.length === 0 ? (
                                <p className="text-xs text-[--color-text-muted] italic">No watchers yet.</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {ticket.watchers.map(w => (
                                        <span key={w.id} title={w.name}
                                            className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold cursor-default">
                                            {initials(w.name)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Activity */}
                        {ticket.activity.length > 0 && (
                            <div className="bg-white rounded-xl border border-[--color-border] p-4">
                                <p className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider mb-3">Activity</p>
                                <ol className="space-y-2.5">
                                    {ticket.activity.map(a => (
                                        <li key={a.id} className="flex gap-2 text-xs">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[--color-text-subtle] flex-shrink-0 mt-1.5" />
                                            <div>
                                                <span className="text-[--color-text]">{a.causer?.name ?? 'System'} </span>
                                                <span className="text-[--color-text-muted]">{a.description} · {a.created_at}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
