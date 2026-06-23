import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    PlusIcon, PencilSquareIcon, TrashIcon,
    XMarkIcon, CheckIcon, FolderOpenIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';

interface KbCategory {
    id:              number;
    name:            string;
    slug:            string;
    description:     string | null;
    icon:            string | null;
    parent_id:       number | null;
    parent:          { id: number; name: string } | null;
    sort_order:      number;
    is_active:       boolean;
    published_count: number;
    total_count:     number;
    can_edit:        boolean;
    can_delete:      boolean;
}

interface Props {
    categories: KbCategory[];
    can_create: boolean;
}

interface FormState {
    name:        string;
    slug:        string;
    description: string;
    icon:        string;
    parent_id:   number | '';
    sort_order:  number;
    is_active:   boolean;
}

const INPUT_CLS = 'w-full h-9 rounded-md border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500';

function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CategoryPanel({
    title,
    initial,
    categories,
    excludeId,
    submitLabel,
    onSubmit,
    onClose,
    processing,
    errors,
}: {
    title:       string;
    initial:     FormState;
    categories:  KbCategory[];
    excludeId?:  number;
    submitLabel: string;
    onSubmit:    (data: FormState) => void;
    onClose:     () => void;
    processing:  boolean;
    errors:      Partial<Record<keyof FormState, string>>;
}) {
    const [form, setForm] = useState<FormState>(initial);
    const [autoSlug, setAutoSlug] = useState(!initial.slug);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm(prev => {
            const next = { ...prev, [key]: value };
            if (key === 'name' && autoSlug) next.slug = slugify(value as string);
            return next;
        });
    }

    const parents = categories.filter(c => c.id !== excludeId && !c.parent_id);

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="fixed inset-0 bg-black/30" onClick={onClose} />
            <div className="relative z-50 w-full max-w-md bg-[--color-card] border-l border-[--color-border] shadow-xl flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-border]">
                    <h2 className="font-semibold text-[--color-text]">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded text-[--color-text-muted] hover:text-[--color-text]">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <form
                    onSubmit={e => { e.preventDefault(); onSubmit(form); }}
                    className="flex-1 overflow-y-auto p-5 space-y-4"
                >
                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Name <span className="text-danger-500">*</span></label>
                        <input value={form.name} onChange={e => set('name', e.target.value)} className={INPUT_CLS} placeholder="Getting Started" />
                        {errors.name && <p className="mt-1 text-xs text-danger-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Slug <span className="text-danger-500">*</span></label>
                        <input
                            value={form.slug}
                            onChange={e => { setAutoSlug(false); set('slug', slugify(e.target.value)); }}
                            className={INPUT_CLS}
                            placeholder="getting-started"
                        />
                        {errors.slug && <p className="mt-1 text-xs text-danger-500">{errors.slug}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Brief description shown on the Help Center"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Icon (emoji)</label>
                            <input value={form.icon} onChange={e => set('icon', e.target.value)} className={INPUT_CLS} placeholder="📚" maxLength={10} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Sort Order</label>
                            <input
                                type="number"
                                value={form.sort_order}
                                onChange={e => set('sort_order', Number(e.target.value))}
                                className={INPUT_CLS}
                                min={0}
                                max={999}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Parent Category</label>
                        <select
                            value={form.parent_id}
                            onChange={e => set('parent_id', e.target.value ? Number(e.target.value) : '')}
                            className={INPUT_CLS}
                        >
                            <option value="">None (top-level)</option>
                            {parents.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.parent_id && <p className="mt-1 text-xs text-danger-500">{errors.parent_id}</p>}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={e => set('is_active', e.target.checked)}
                            className="w-4 h-4 rounded border-[--color-border] text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-[--color-text]">Active (visible on Help Center)</span>
                    </label>

                    <div className="flex items-center gap-3 pt-2 border-t border-[--color-border]">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {processing ? 'Saving…' : submitLabel}
                        </button>
                        <button type="button" onClick={onClose} className="text-sm text-[--color-text-muted] hover:text-[--color-text]">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const BLANK: FormState = { name: '', slug: '', description: '', icon: '', parent_id: '', sort_order: 0, is_active: true };

export default function KbCategoriesIndex({ categories, can_create }: Props) {
    const [creating, setCreating]       = useState(false);
    const [editing, setEditing]         = useState<KbCategory | null>(null);
    const { post, put, processing, errors, reset } = useForm<FormState>(BLANK);

    function handleStore(data: FormState) {
        post(route('admin.kb.categories.store'), {
            data,
            onSuccess: () => { setCreating(false); reset(); },
        });
    }

    function handleUpdate(data: FormState) {
        if (!editing) return;
        put(route('admin.kb.categories.update', editing.id), {
            data,
            onSuccess: () => { setEditing(null); reset(); },
        });
    }

    function handleDestroy(cat: KbCategory) {
        if (!confirm(`Delete "${cat.name}"? Its sub-categories will become top-level.`)) return;
        router.delete(route('admin.kb.categories.destroy', cat.id));
    }

    return (
        <AppLayout title="KB Categories">
            <Head title="KB Categories" />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-[--color-text]">KB Categories</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">{categories.length} categories</p>
                    </div>
                    {can_create && (
                        <button
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Category
                        </button>
                    )}
                </div>

                <div className="bg-[--color-card] border border-[--color-border] rounded-xl overflow-hidden">
                    {categories.length === 0 ? (
                        <div className="py-16 text-center">
                            <FolderOpenIcon className="w-10 h-10 mx-auto text-[--color-text-subtle] mb-3 opacity-40" />
                            <p className="text-sm text-[--color-text-subtle]">No categories yet. Create one to organise your Help Center.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-[--color-border] bg-[--color-bg]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-[--color-text-muted]">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-[--color-text-muted] hidden sm:table-cell">Parent</th>
                                    <th className="text-center px-4 py-3 font-medium text-[--color-text-muted] hidden md:table-cell">Articles</th>
                                    <th className="text-center px-4 py-3 font-medium text-[--color-text-muted] hidden md:table-cell">Order</th>
                                    <th className="text-center px-4 py-3 font-medium text-[--color-text-muted]">Active</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-border]">
                                {categories.map(cat => (
                                    <tr key={cat.id} className="hover:bg-[--color-bg] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {cat.parent_id && <span className="text-[--color-text-subtle] text-xs pl-3">↳</span>}
                                                {cat.icon && <span className="text-base">{cat.icon}</span>}
                                                <div>
                                                    <div className="font-medium text-[--color-text]">{cat.name}</div>
                                                    <div className="text-xs text-[--color-text-subtle]">/kb/category/{cat.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[--color-text-muted] hidden sm:table-cell">
                                            {cat.parent?.name ?? <span className="text-[--color-text-subtle]">—</span>}
                                        </td>
                                        <td className="px-4 py-3 text-center text-[--color-text-muted] hidden md:table-cell">
                                            <span title={`${cat.total_count} total`}>
                                                {cat.published_count}
                                                <span className="text-[--color-text-subtle] text-xs"> / {cat.total_count}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-[--color-text-muted] hidden md:table-cell">{cat.sort_order}</td>
                                        <td className="px-4 py-3 text-center">
                                            {cat.is_active
                                                ? <CheckIcon className="w-4 h-4 text-success-500 mx-auto" />
                                                : <XMarkIcon className="w-4 h-4 text-[--color-text-subtle] mx-auto" />}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {cat.can_edit && (
                                                    <button
                                                        onClick={() => setEditing(cat)}
                                                        className="p-1.5 rounded-md text-[--color-text-subtle] hover:text-[--color-text] hover:bg-[--color-border] transition-colors"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {cat.can_delete && (
                                                    <button
                                                        onClick={() => handleDestroy(cat)}
                                                        className="p-1.5 rounded-md text-[--color-text-subtle] hover:text-danger-600 hover:bg-danger-50 transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {creating && (
                <CategoryPanel
                    title="New Category"
                    initial={BLANK}
                    categories={categories}
                    submitLabel="Create Category"
                    onSubmit={handleStore}
                    onClose={() => setCreating(false)}
                    processing={processing}
                    errors={errors}
                />
            )}

            {editing && (
                <CategoryPanel
                    title="Edit Category"
                    initial={{
                        name:        editing.name,
                        slug:        editing.slug,
                        description: editing.description ?? '',
                        icon:        editing.icon ?? '',
                        parent_id:   editing.parent_id ?? '',
                        sort_order:  editing.sort_order,
                        is_active:   editing.is_active,
                    }}
                    categories={categories}
                    excludeId={editing.id}
                    submitLabel="Save Changes"
                    onSubmit={handleUpdate}
                    onClose={() => setEditing(null)}
                    processing={processing}
                    errors={errors}
                />
            )}
        </AppLayout>
    );
}
