import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';

interface Field {
    id: number;
    name: string;
    label: string;
    type: FieldType;
    options: string[] | null;
    category_id: number | null;
    category: { id: number; name: string } | null;
    is_required: boolean;
    sort_order: number;
    is_active: boolean;
    values_count: number;
}

interface Category { id: number; name: string; }
interface Props { fields: Field[]; categories: Category[]; }

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select (dropdown)' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio buttons' },
];

const SELECT_CLS = 'w-full border border-[--color-border] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none';

function FieldForm({ initial, categories, onSave, onCancel }: {
    initial?: Partial<Field>;
    categories: Category[];
    onSave: (data: Record<string, unknown>) => void;
    onCancel: () => void;
}) {
    const [label, setLabel]         = useState(initial?.label ?? '');
    const [name, setName]           = useState(initial?.name ?? '');
    const [type, setType]           = useState<FieldType>(initial?.type ?? 'text');
    const [categoryId, setCatId]    = useState(initial?.category_id?.toString() ?? '');
    const [isRequired, setRequired] = useState(initial?.is_required ?? false);
    const [sortOrder, setSort]      = useState(initial?.sort_order ?? 0);
    const [isActive, setIsActive]   = useState(initial?.is_active ?? true);
    const [optionInput, setOptIn]   = useState('');
    const [options, setOptions]     = useState<string[]>(initial?.options ?? []);

    const needsOptions = type === 'select' || type === 'radio';
    const isEdit       = !!initial?.id;

    const autoName = (l: string) => l.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    const handleLabelChange = (v: string) => {
        setLabel(v);
        if (!isEdit) setName(autoName(v));
    };

    const addOption = () => {
        const v = optionInput.trim();
        if (v && !options.includes(v)) { setOptions(o => [...o, v]); setOptIn(''); }
    };

    return (
        <div className="p-4 bg-[--color-bg] rounded-xl border border-[--color-border] space-y-3">
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Label *</label>
                    <input value={label} onChange={e => handleLabelChange(e.target.value)} placeholder="e.g. Customer Region" className={SELECT_CLS} />
                </div>
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Field name (key)</label>
                    <input value={name} onChange={e => !isEdit && setName(e.target.value)} readOnly={isEdit}
                        className={`${SELECT_CLS} ${isEdit ? 'bg-[--color-bg] text-[--color-text-muted]' : ''}`} placeholder="auto-generated" />
                </div>
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Type *</label>
                    <select value={type} onChange={e => setType(e.target.value as FieldType)} className={SELECT_CLS}>
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            {needsOptions && (
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Options *</label>
                    <div className="flex gap-2 mb-2">
                        <input value={optionInput} onChange={e => setOptIn(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                            placeholder="Type option and press Enter" className={`${SELECT_CLS} flex-1`} />
                        <button type="button" onClick={addOption}
                            className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Add</button>
                    </div>
                    {options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {options.map((opt, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[--color-border] rounded text-xs">
                                    {opt}
                                    <button onClick={() => setOptions(o => o.filter((_, j) => j !== i))}><XMarkIcon className="w-3 h-3 text-[--color-text-muted]" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Category (scoped to)</label>
                    <select value={categoryId} onChange={e => setCatId(e.target.value)} className="border border-[--color-border] rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                        <option value="">All categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-[--color-text-muted] block mb-1">Sort order</label>
                    <input type="number" value={sortOrder} min={0} onChange={e => setSort(Number(e.target.value))}
                        className="w-20 border border-[--color-border] rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                    <input type="checkbox" checked={isRequired} onChange={e => setRequired(e.target.checked)} className="rounded" />
                    Required
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                    Active
                </label>
                <div className="flex-1" />
                <div className="flex gap-2 mt-4">
                    <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-[--color-text-muted] hover:bg-white rounded-lg transition-colors">Cancel</button>
                    <button type="button" disabled={!label.trim() || !name.trim() || (needsOptions && options.length === 0)}
                        onClick={() => onSave({ label, name, type, options: needsOptions ? options : null, category_id: categoryId ? parseInt(categoryId) : null, is_required: isRequired, sort_order: sortOrder, is_active: isActive })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                        <CheckIcon className="w-3.5 h-3.5" />Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CustomFieldsIndex({ fields, categories }: Props) {
    const [creating, setCreating]   = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const handleCreate = (data: Record<string, unknown>) =>
        router.post('/admin/custom-fields', data, { preserveScroll: true, onSuccess: () => setCreating(false) });

    const handleUpdate = (id: number, data: Record<string, unknown>) =>
        router.put(`/admin/custom-fields/${id}`, data, { preserveScroll: true, onSuccess: () => setEditingId(null) });

    const handleDelete = (field: Field) => {
        if (!confirm(`Delete field "${field.label}"? This will also remove all ${field.values_count} stored value(s).`)) return;
        router.delete(`/admin/custom-fields/${field.id}`, { preserveScroll: true });
    };

    const typeLabel = (t: FieldType) => FIELD_TYPES.find(f => f.value === t)?.label ?? t;

    return (
        <AppLayout>
            <Head title="Custom Fields" />
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Custom Fields</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">Add extra data fields to tickets, optionally scoped to a category.</p>
                    </div>
                    <button onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <PlusIcon className="w-4 h-4" />New Field
                    </button>
                </div>

                <div className="space-y-2">
                    {creating && <FieldForm categories={categories} onSave={handleCreate} onCancel={() => setCreating(false)} />}
                    {fields.map(field => (
                        <div key={field.id}>
                            {editingId === field.id ? (
                                <FieldForm initial={field} categories={categories} onSave={d => handleUpdate(field.id, d)} onCancel={() => setEditingId(null)} />
                            ) : (
                                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[--color-border] group">
                                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                                        {field.type.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[--color-text]">{field.label}</span>
                                            <code className="text-[10px] font-mono bg-[--color-bg] px-1 py-0.5 rounded text-[--color-text-muted]">{field.name}</code>
                                            {field.is_required && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-danger-50 text-danger-600 rounded">REQUIRED</span>}
                                            {!field.is_active && <span className="px-1.5 py-0.5 text-[10px] bg-[--color-bg] text-[--color-text-muted] rounded">INACTIVE</span>}
                                        </div>
                                        <p className="text-xs text-[--color-text-muted] mt-0.5">
                                            {typeLabel(field.type)}
                                            {field.category ? ` · ${field.category.name}` : ' · All categories'}
                                            {field.options && field.options.length > 0 ? ` · Options: ${field.options.join(', ')}` : ''}
                                            {' · '}{field.values_count} stored value{field.values_count !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingId(field.id)} className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(field)} className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {fields.length === 0 && !creating && (
                        <div className="text-center py-12 text-[--color-text-muted] text-sm">No custom fields yet.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
