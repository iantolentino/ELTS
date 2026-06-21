import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Category {
    id: number;
    name: string;
    description: string | null;
    parent_id: number | null;
    parent: { id: number; name: string } | null;
    sort_order: number;
    is_active: boolean;
    tickets_count: number;
    children_count: number;
}

interface Props { categories: Category[]; }

const SELECT_CLS = 'w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none';

function CategoryForm({ initial, categories, onSave, onCancel }: {
    initial?: Partial<Category>;
    categories: Category[];
    onSave: (data: Record<string, unknown>) => void;
    onCancel: () => void;
}) {
    const [name, setName]           = useState(initial?.name ?? '');
    const [description, setDesc]    = useState(initial?.description ?? '');
    const [parentId, setParentId]   = useState<string>(initial?.parent_id?.toString() ?? '');
    const [sortOrder, setSort]      = useState(initial?.sort_order ?? 0);
    const [isActive, setIsActive]   = useState(initial?.is_active ?? true);

    const eligible = categories.filter(c => c.id !== initial?.id && !c.parent_id);

    return (
        <div className="p-4 bg-[--color-bg] rounded-xl border border-[--color-border] space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className={SELECT_CLS} />
                </div>
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Parent category</label>
                    <select value={parentId} onChange={e => setParentId(e.target.value)} className={SELECT_CLS}>
                        <option value="">None (top level)</option>
                        {eligible.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="text-xs text-[--color-text-muted] block mb-1">Description</label>
                <input value={description} onChange={e => setDesc(e.target.value)} placeholder="Optional description" className={SELECT_CLS} />
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-[--color-text-muted]">Sort order</label>
                    <input type="number" value={sortOrder} min={0} onChange={e => setSort(Number(e.target.value))}
                        className="w-20 border border-[--color-border] rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                    Active
                </label>
                <div className="flex-1" />
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-[--color-text-muted] hover:bg-white rounded-lg transition-colors">Cancel</button>
                <button type="button" disabled={!name.trim()}
                    onClick={() => onSave({ name, description: description || null, parent_id: parentId ? parseInt(parentId) : null, sort_order: sortOrder, is_active: isActive })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    <CheckIcon className="w-3.5 h-3.5" />Save
                </button>
            </div>
        </div>
    );
}

export default function CategoriesIndex({ categories }: Props) {
    const [creating, setCreating]   = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const roots     = categories.filter(c => !c.parent_id);
    const children  = (parentId: number) => categories.filter(c => c.parent_id === parentId);

    const handleCreate = (data: Record<string, unknown>) =>
        router.post('/admin/categories', data, { preserveScroll: true, onSuccess: () => setCreating(false) });

    const handleUpdate = (id: number, data: Record<string, unknown>) =>
        router.put(`/admin/categories/${id}`, data, { preserveScroll: true, onSuccess: () => setEditingId(null) });

    const handleDelete = (cat: Category) => {
        if (!confirm(`Delete category "${cat.name}"? Child categories will become top-level.`)) return;
        router.delete(`/admin/categories/${cat.id}`, { preserveScroll: true });
    };

    const renderRow = (cat: Category, depth = 0) => (
        <div key={cat.id}>
            {editingId === cat.id ? (
                <div className={depth > 0 ? 'ml-6' : ''}>
                    <CategoryForm initial={cat} categories={categories} onSave={d => handleUpdate(cat.id, d)} onCancel={() => setEditingId(null)} />
                </div>
            ) : (
                <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border border-[--color-border] group ${depth > 0 ? 'ml-6' : ''}`}>
                    {depth > 0 && <ChevronRightIcon className="w-3 h-3 text-[--color-text-muted] flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[--color-text]">{cat.name}</span>
                            {!cat.is_active && <span className="px-1.5 py-0.5 text-[10px] bg-[--color-bg] text-[--color-text-muted] rounded">INACTIVE</span>}
                        </div>
                        {cat.description && <p className="text-xs text-[--color-text-muted] truncate mt-0.5">{cat.description}</p>}
                        <p className="text-xs text-[--color-text-subtle] mt-0.5">{cat.tickets_count} ticket{cat.tickets_count !== 1 ? 's' : ''} · {cat.children_count} child{cat.children_count !== 1 ? 'ren' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingId(cat.id)} className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
            {children(cat.id).map(child => renderRow(child, depth + 1))}
        </div>
    );

    return (
        <AppLayout>
            <Head title="Categories" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Ticket Categories</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">Organize tickets into categories and subcategories.</p>
                    </div>
                    <button onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <PlusIcon className="w-4 h-4" />New Category
                    </button>
                </div>

                <div className="space-y-2">
                    {creating && <CategoryForm categories={categories} onSave={handleCreate} onCancel={() => setCreating(false)} />}
                    {roots.map(cat => renderRow(cat))}
                    {categories.length === 0 && !creating && (
                        <div className="text-center py-12 text-[--color-text-muted] text-sm">No categories yet.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
