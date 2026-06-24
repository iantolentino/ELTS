import { Head, Link, useForm } from '@inertiajs/react';
import { PencilSquareIcon, ArrowLeftIcon, TicketIcon, UserPlusIcon, ArrowUturnLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';

interface Assignment {
    id:          number;
    user:        { id: number; name: string } | null;
    assigned_by: { id: number; name: string } | null;
    assigned_at: string;
    returned_at: string | null;
    notes:       string | null;
    is_active:   boolean;
}

interface LinkedTicket {
    id:            number;
    ticket_number: string;
    subject:       string;
    status:        { name: string; color: string };
    requester:     { name: string } | null;
    created_at:    string;
}

interface AssetDetail {
    id:                   number;
    name:                 string;
    asset_tag:            string;
    type:                 string;
    status:               string;
    serial_number:        string | null;
    make:                 string | null;
    model:                string | null;
    purchase_date:        string | null;
    purchase_price:       string | null;
    warranty_expires_at:  string | null;
    warranty_expired:     boolean;
    location:             string | null;
    notes:                string | null;
    created_at:           string;
    assignee:             { id: number; name: string } | null;
    creator:              { id: number; name: string } | null;
    assignments:          Assignment[];
    tickets:              LinkedTicket[];
}

interface Props {
    asset:  AssetDetail;
    agents: { id: number; name: string }[];
    can:    { edit: boolean; delete: boolean; assign: boolean };
}

const STATUS_COLORS: Record<string, string> = {
    purchased:   'bg-blue-100 text-blue-700',
    in_use:      'bg-green-100 text-green-700',
    maintenance: 'bg-amber-100 text-amber-700',
    retired:     'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
    purchased:   'Purchased',
    in_use:      'In Use',
    maintenance: 'Maintenance',
    retired:     'Retired',
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 py-3 border-b border-[--color-border] last:border-0">
            <span className="text-xs font-medium text-[--color-text-muted] w-36 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-[--color-text] flex-1">{value ?? <span className="text-[--color-text-subtle]">—</span>}</span>
        </div>
    );
}

function formatDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(d: string) {
    return new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ALL_STATUSES = [
    { value: 'purchased',   label: 'Purchased',   cls: 'bg-blue-100 text-blue-700' },
    { value: 'in_use',      label: 'In Use',       cls: 'bg-green-100 text-green-700' },
    { value: 'maintenance', label: 'Maintenance',  cls: 'bg-amber-100 text-amber-700' },
    { value: 'retired',     label: 'Retired',      cls: 'bg-gray-100 text-gray-500' },
];

function StatusPanel({ asset }: { asset: AssetDetail }) {
    const { data, setData, patch, processing } = useForm({ status: asset.status });
    const changed = data.status !== asset.status;

    const willUnassign = asset.assignee !== null && ['maintenance', 'retired'].includes(data.status);
    const current = ALL_STATUSES.find(s => s.value === asset.status);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        patch(route('admin.assets.status.update', asset.id));
    }

    return (
        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[--color-text] mb-3">Lifecycle Status</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setData('status', s.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                                data.status === s.value
                                    ? `${s.cls} border-current`
                                    : 'bg-[--color-bg] text-[--color-text-muted] border-[--color-border] hover:border-primary-300'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {willUnassign && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Moving to <strong>{ALL_STATUSES.find(s => s.value === data.status)?.label}</strong> will automatically return the asset from <strong>{asset.assignee?.name}</strong>.
                    </p>
                )}

                {changed && (
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        {processing ? 'Updating…' : `Change to ${ALL_STATUSES.find(s => s.value === data.status)?.label}`}
                    </button>
                )}
            </form>
        </div>
    );
}

function AssignPanel({ asset, agents, onClose }: {
    asset:   AssetDetail;
    agents:  { id: number; name: string }[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        notes:   '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('admin.assets.assign', asset.id), { onSuccess: onClose });
    }

    return (
        <div className="bg-[--color-bg] border border-primary-200 rounded-xl p-4 mt-3 space-y-3">
            <p className="text-xs font-semibold text-[--color-text]">Assign to user</p>
            <form onSubmit={handleSubmit} className="space-y-2">
                <select
                    value={data.user_id}
                    onChange={e => setData('user_id', e.target.value)}
                    className="w-full h-9 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">— Select user —</option>
                    {agents.map(a => (
                        <option key={a.id} value={String(a.id)}>{a.name}</option>
                    ))}
                </select>
                {errors.user_id && <p className="text-xs text-red-500">{errors.user_id}</p>}
                <input
                    type="text"
                    value={data.notes}
                    onChange={e => setData('notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="w-full h-9 rounded-lg border border-[--color-border] bg-[--color-surface] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={processing || !data.user_id}
                        className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
                    >
                        {processing ? 'Assigning…' : 'Assign'}
                    </button>
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs border border-[--color-border] rounded-lg text-[--color-text-muted]">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function AssetShow({ asset, agents, can }: Props) {
    const [showAssignPanel, setShowAssignPanel] = useState(false);
    const { delete: unassign, processing: unassigning } = useForm({});
    return (
        <AppLayout>
            <Head title={`${asset.name} — Assets`} />

            <div className="px-6 py-6 space-y-6 max-w-5xl">

                {/* Breadcrumb + actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/assets"
                            className="p-1.5 rounded-lg hover:bg-[--color-border] text-[--color-text-muted]"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-[--color-text]">{asset.name}</h1>
                            <p className="text-xs text-[--color-text-muted] mt-0.5 font-mono">{asset.asset_tag}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_COLORS[asset.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {STATUS_LABELS[asset.status] ?? asset.status}
                        </span>
                        {can.edit && (
                            <Link
                                href={`/admin/assets/${asset.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[--color-surface] border border-[--color-border] hover:border-primary-400 text-sm font-medium rounded-lg text-[--color-text]"
                            >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left col: details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Asset details card */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-[--color-text] mb-3">Asset Details</h2>
                            <DetailRow label="Type"           value={<span className="capitalize">{asset.type}</span>} />
                            <DetailRow label="Make / Model"   value={[asset.make, asset.model].filter(Boolean).join(' ') || null} />
                            <DetailRow label="Serial Number"  value={asset.serial_number} />
                            <DetailRow label="Location"       value={asset.location} />
                            <DetailRow label="Purchase Date"  value={formatDate(asset.purchase_date)} />
                            <DetailRow label="Purchase Price" value={asset.purchase_price ? `$${Number(asset.purchase_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : null} />
                            <DetailRow
                                label="Warranty"
                                value={asset.warranty_expires_at
                                    ? <span className={asset.warranty_expired ? 'text-red-500 font-medium' : ''}>
                                        {asset.warranty_expired ? '⚠ Expired — ' : ''}{formatDate(asset.warranty_expires_at)}
                                      </span>
                                    : null}
                            />
                            <DetailRow label="Added"         value={formatDate(asset.created_at)} />
                            <DetailRow label="Added by"      value={asset.creator?.name ?? null} />
                            {asset.notes && (
                                <div className="pt-3">
                                    <p className="text-xs font-medium text-[--color-text-muted] mb-1">Notes</p>
                                    <p className="text-sm text-[--color-text] whitespace-pre-wrap">{asset.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Assignment history */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-[--color-text] mb-3">Assignment History</h2>
                            {asset.assignments.length === 0 ? (
                                <p className="text-sm text-[--color-text-muted]">No assignments recorded.</p>
                            ) : (
                                <div className="space-y-0">
                                    <div className="grid grid-cols-4 gap-3 pb-2 border-b border-[--color-border] text-xs font-medium text-[--color-text-muted]">
                                        <span>Assigned to</span>
                                        <span>Assigned by</span>
                                        <span>Assigned</span>
                                        <span>Returned</span>
                                    </div>
                                    {asset.assignments.map(a => (
                                        <div key={a.id} className={`grid grid-cols-4 gap-3 py-2.5 border-b border-[--color-border] last:border-0 text-sm ${a.is_active ? 'bg-green-50/40' : ''}`}>
                                            <span className={`font-medium ${a.is_active ? 'text-green-700' : 'text-[--color-text]'}`}>
                                                {a.user?.name ?? '—'}
                                                {a.is_active && <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Current</span>}
                                            </span>
                                            <span className="text-[--color-text-muted]">{a.assigned_by?.name ?? '—'}</span>
                                            <span className="text-[--color-text-muted] text-xs">{formatDateTime(a.assigned_at)}</span>
                                            <span className="text-[--color-text-muted] text-xs">{a.returned_at ? formatDateTime(a.returned_at) : '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right col: current assignee + linked tickets */}
                    <div className="space-y-6">

                        {/* Current assignee */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-[--color-text] mb-3">Current Assignee</h2>
                            {asset.assignee ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0">
                                        {asset.assignee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-[--color-text]">{asset.assignee.name}</span>
                                </div>
                            ) : (
                                <p className="text-sm text-[--color-text-muted]">Unassigned</p>
                            )}

                            {can.assign && (
                                <div className="mt-3 flex flex-col gap-2">
                                    <button
                                        onClick={() => setShowAssignPanel(v => !v)}
                                        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium border border-[--color-border] rounded-lg text-[--color-text] hover:border-primary-400"
                                    >
                                        <UserPlusIcon className="w-3.5 h-3.5" />
                                        {asset.assignee ? 'Reassign' : 'Assign to user'}
                                    </button>
                                    {asset.assignee && (
                                        <button
                                            onClick={() => unassign(route('admin.assets.unassign', asset.id))}
                                            disabled={unassigning}
                                            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium border border-[--color-border] rounded-lg text-red-600 hover:border-red-300 disabled:opacity-50"
                                        >
                                            <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                                            Return Asset
                                        </button>
                                    )}
                                </div>
                            )}

                            {showAssignPanel && can.assign && (
                                <AssignPanel
                                    asset={asset}
                                    agents={agents}
                                    onClose={() => setShowAssignPanel(false)}
                                />
                            )}
                        </div>

                        {/* Lifecycle status */}
                        {can.edit && <StatusPanel asset={asset} />}

                        {/* Linked tickets */}
                        <div className="bg-[--color-surface] border border-[--color-border] rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-[--color-text] mb-3">
                                Linked Tickets
                                {asset.tickets.length > 0 && (
                                    <span className="ml-2 text-xs font-normal text-[--color-text-muted]">({asset.tickets.length})</span>
                                )}
                            </h2>
                            {asset.tickets.length === 0 ? (
                                <p className="text-sm text-[--color-text-muted]">No tickets linked.</p>
                            ) : (
                                <div className="space-y-2">
                                    {asset.tickets.map(t => (
                                        <Link
                                            key={t.id}
                                            href={`/tickets/${t.id}`}
                                            className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[--color-border] hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                                        >
                                            <TicketIcon className="w-4 h-4 text-[--color-text-muted] mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-mono text-[--color-text-muted]">{t.ticket_number}</p>
                                                <p className="text-sm font-medium text-[--color-text] truncate">{t.subject}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span
                                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                                        style={{ background: `${t.status.color}22`, color: t.status.color }}
                                                    >
                                                        {t.status.name}
                                                    </span>
                                                    <span className="text-[10px] text-[--color-text-muted]">{t.created_at}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
