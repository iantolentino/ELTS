import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import TiptapEditor from '@/Components/editor/TiptapEditor';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Category { id: number; name: string; }
interface Tag      { id: number; name: string; color: string; }
interface Props    { categories: Category[]; tags: Tag[]; }

const SELECT_CLS = 'w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white';

export default function TemplateCreate({ categories, tags }: Props) {
    const form = useForm({
        name:        '',
        description: '',
        subject:     '',
        body:        '',
        category_id: '' as string | number,
        priority:    '' as string,
        tag_ids:     [] as number[],
        is_active:   true,
    });

    const toggleTag = (id: number) => {
        form.setData('tag_ids', form.data.tag_ids.includes(id)
            ? form.data.tag_ids.filter(t => t !== id)
            : [...form.data.tag_ids, id]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/templates');
    };

    return (
        <AppLayout>
            <Head title="New Template" />
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/admin/templates" className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">New Template</h1>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="bg-white rounded-xl border border-[--color-border] p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-[--color-text]">Basic Info</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs text-[--color-text-muted] block mb-1">Template name *</label>
                                <input value={form.data.name} onChange={e => form.setData('name', e.target.value)}
                                    placeholder="e.g. Hardware Issue" className={SELECT_CLS} required />
                                {form.errors.name && <p className="text-xs text-danger-600 mt-1">{form.errors.name}</p>}
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-[--color-text-muted] block mb-1">Description (internal)</label>
                                <input value={form.data.description} onChange={e => form.setData('description', e.target.value)}
                                    placeholder="Short note about this template" className={SELECT_CLS} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)} className="rounded" />
                            Active (visible when creating tickets)
                        </label>
                    </div>

                    <div className="bg-white rounded-xl border border-[--color-border] p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-[--color-text]">Ticket Fields</h2>
                        <div>
                            <label className="text-xs text-[--color-text-muted] block mb-1">Subject</label>
                            <input value={form.data.subject} onChange={e => form.setData('subject', e.target.value)}
                                placeholder="Pre-fill the ticket subject" className={SELECT_CLS} />
                        </div>
                        <div>
                            <label className="text-xs text-[--color-text-muted] block mb-1">Body</label>
                            <TiptapEditor content={form.data.body} onChange={v => form.setData('body', v)} minHeight={180} placeholder="Pre-fill the ticket body…" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-[--color-text-muted] block mb-1">Category</label>
                                <select value={form.data.category_id} onChange={e => form.setData('category_id', e.target.value)} className={SELECT_CLS}>
                                    <option value="">None</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-[--color-text-muted] block mb-1">Priority</label>
                                <select value={form.data.priority} onChange={e => form.setData('priority', e.target.value)} className={SELECT_CLS}>
                                    <option value="">None</option>
                                    {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-[--color-text-muted] block mb-2">Tags</label>
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map(tag => {
                                    const selected = form.data.tag_ids.includes(tag.id);
                                    return (
                                        <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border-2 transition-all ${selected ? 'text-white border-transparent' : 'bg-white border-[--color-border] text-[--color-text-muted]'}`}
                                            style={selected ? { backgroundColor: tag.color } : {}}>
                                            {tag.name}
                                            {selected && <XMarkIcon className="w-3 h-3" />}
                                        </button>
                                    );
                                })}
                                {tags.length === 0 && <span className="text-xs text-[--color-text-muted] italic">No tags available.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/admin/templates" className="px-4 py-2 text-sm text-[--color-text-muted] hover:bg-[--color-bg] rounded-lg transition-colors">Cancel</Link>
                        <button type="submit" disabled={form.processing || !form.data.name.trim()}
                            className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                            {form.processing ? 'Saving…' : 'Create Template'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
