import { useForm, Link } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface AssetFormData {
    name:                string;
    asset_tag:           string;
    type:                string;
    status:              string;
    serial_number:       string;
    make:                string;
    model:               string;
    purchase_date:       string;
    purchase_price:      string;
    warranty_expires_at: string;
    location:            string;
    notes:               string;
    assigned_to:         string;
}

interface Agent { id: number; name: string }

interface Props {
    initialData?: Partial<AssetFormData>;
    agents:       Agent[];
    asset_types:  string[];
    submitUrl:    string;
    method:       'post' | 'put';
    title:        string;
    assetId?:     number;
}

const STATUS_OPTIONS = [
    { value: 'purchased',   label: 'Purchased' },
    { value: 'in_use',      label: 'In Use' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'retired',     label: 'Retired' },
];

function Field({ label, error, required, children }: {
    label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[--color-text] mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

const inputCls = 'w-full h-9 rounded-lg border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500';
const selectCls = inputCls;

export default function AssetForm({ initialData = {}, agents, asset_types, submitUrl, method, title, assetId }: Props) {
    const { data, setData, submit, processing, errors } = useForm<AssetFormData>({
        name:                initialData.name                ?? '',
        asset_tag:           initialData.asset_tag           ?? '',
        type:                initialData.type                ?? '',
        status:              initialData.status              ?? 'purchased',
        serial_number:       initialData.serial_number       ?? '',
        make:                initialData.make                ?? '',
        model:               initialData.model               ?? '',
        purchase_date:       initialData.purchase_date       ?? '',
        purchase_price:      initialData.purchase_price      ?? '',
        warranty_expires_at: initialData.warranty_expires_at ?? '',
        location:            initialData.location            ?? '',
        notes:               initialData.notes               ?? '',
        assigned_to:         initialData.assigned_to         ? String(initialData.assigned_to) : '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, submitUrl);
    }

    return (
        <div className="px-6 py-6 max-w-3xl space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href={assetId ? `/admin/assets/${assetId}` : '/admin/assets'}
                    className="p-1.5 rounded-lg hover:bg-[--color-border] text-[--color-text-muted]"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                </Link>
                <h1 className="text-xl font-semibold text-[--color-text]">{title}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Identity */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[--color-text]">Identity</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Asset Name" error={errors.name} required>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. MacBook Pro 14"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Asset Tag" error={errors.asset_tag} required>
                            <input
                                type="text"
                                value={data.asset_tag}
                                onChange={e => setData('asset_tag', e.target.value)}
                                placeholder="e.g. ASSET-00042"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Type" error={errors.type} required>
                            <input
                                type="text"
                                list="asset-types-list"
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                                placeholder="laptop, monitor, phone…"
                                className={inputCls}
                            />
                            <datalist id="asset-types-list">
                                {asset_types.map(t => <option key={t} value={t} />)}
                            </datalist>
                        </Field>
                        <Field label="Status" error={errors.status} required>
                            <select value={data.status} onChange={e => setData('status', e.target.value)} className={selectCls}>
                                {STATUS_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Serial Number" error={errors.serial_number}>
                            <input
                                type="text"
                                value={data.serial_number}
                                onChange={e => setData('serial_number', e.target.value)}
                                placeholder="Manufacturer serial"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Location" error={errors.location}>
                            <input
                                type="text"
                                value={data.location}
                                onChange={e => setData('location', e.target.value)}
                                placeholder="e.g. HQ Floor 2"
                                className={inputCls}
                            />
                        </Field>
                    </div>
                </div>

                {/* Hardware details */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[--color-text]">Hardware Details</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Make / Brand" error={errors.make}>
                            <input
                                type="text"
                                value={data.make}
                                onChange={e => setData('make', e.target.value)}
                                placeholder="e.g. Apple"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Model" error={errors.model}>
                            <input
                                type="text"
                                value={data.model}
                                onChange={e => setData('model', e.target.value)}
                                placeholder="e.g. MacBook Pro M3"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Purchase Date" error={errors.purchase_date}>
                            <input
                                type="date"
                                value={data.purchase_date}
                                onChange={e => setData('purchase_date', e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Purchase Price ($)" error={errors.purchase_price}>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.purchase_price}
                                onChange={e => setData('purchase_price', e.target.value)}
                                placeholder="0.00"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Warranty Expires" error={errors.warranty_expires_at}>
                            <input
                                type="date"
                                value={data.warranty_expires_at}
                                onChange={e => setData('warranty_expires_at', e.target.value)}
                                className={inputCls}
                            />
                        </Field>
                    </div>
                </div>

                {/* Assignment */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[--color-text]">Assignment</h2>
                    <Field label="Assign to User" error={errors.assigned_to}>
                        <select value={data.assigned_to} onChange={e => setData('assigned_to', e.target.value)} className={selectCls}>
                            <option value="">— Unassigned —</option>
                            {agents.map(a => (
                                <option key={a.id} value={String(a.id)}>{a.name}</option>
                            ))}
                        </select>
                    </Field>
                </div>

                {/* Notes */}
                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-[--color-text]">Notes</h2>
                    <Field label="Notes" error={errors.notes}>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            rows={3}
                            placeholder="Any additional information…"
                            className="w-full rounded-lg border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        />
                    </Field>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : 'Save Asset'}
                    </button>
                    <Link
                        href={assetId ? `/admin/assets/${assetId}` : '/admin/assets'}
                        className="px-4 py-2 text-sm text-[--color-text-muted] hover:text-[--color-text] border border-[--color-border] rounded-lg"
                    >
                        Cancel
                    </Link>
                </div>

            </form>
        </div>
    );
}
