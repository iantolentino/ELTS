import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input, Badge } from '@/Components/UI';
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    SignalIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

interface Mailbox {
    id: number;
    name: string;
    host: string;
    port: number;
    encryption: string;
    username: string;
    mailbox_folder: string;
    is_active: boolean;
    last_polled_at: string | null;
    incoming_emails_count: number;
}

interface Props {
    mailboxes: Mailbox[];
}

const EMPTY_FORM = {
    name: '', host: '', port: 993, encryption: 'ssl',
    username: '', password: '', mailbox_folder: 'INBOX', is_active: true,
};

function MailboxForm({
    initial, onSave, onCancel, label,
}: {
    initial: typeof EMPTY_FORM & { id?: number };
    onSave: (data: typeof EMPTY_FORM) => void;
    onCancel: () => void;
    label: string;
}) {
    const { data, setData, processing, errors } = useForm({ ...initial });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-lg p-5">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Display Name" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} required />
                <Input label="IMAP Host" value={data.host} onChange={e => setData('host', e.target.value)} error={errors.host} placeholder="mail.example.com" required />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input type="number" value={data.port} onChange={e => setData('port', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
                    <select value={data.encryption} onChange={e => setData('encryption', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        {['ssl', 'tls', 'starttls', 'none'].map(v => (
                            <option key={v} value={v}>{v.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
                <Input label="Mailbox Folder" value={data.mailbox_folder} onChange={e => setData('mailbox_folder', e.target.value)} error={errors.mailbox_folder} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Username / Email" value={data.username} onChange={e => setData('username', e.target.value)} error={errors.username} required />
                <Input label={initial.id ? 'Password (leave blank to keep)' : 'Password'} type="password" value={data.password}
                    onChange={e => setData('password', e.target.value)} error={errors.password} required={!initial.id} />
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="mb-active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded" />
                <label htmlFor="mb-active" className="text-sm text-gray-700">Active (will be polled by scheduler)</label>
            </div>
            <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={processing}>{label}</Button>
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
    );
}

export default function MailboxIndex({ mailboxes }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editId, setEditId]         = useState<number | null>(null);
    const [testing, setTesting]       = useState<number | null>(null);
    const [testResult, setTestResult] = useState<Record<number, { ok: boolean; msg: string }>>({});

    const save = (data: typeof EMPTY_FORM, id?: number) => {
        if (id) {
            router.put(`/admin/mailboxes/${id}`, data, {
                onSuccess: () => setEditId(null),
            });
        } else {
            router.post('/admin/mailboxes', data, {
                onSuccess: () => setShowCreate(false),
            });
        }
    };

    const test = async (id: number) => {
        setTesting(id);
        try {
            const res = await window.axios.post(`/admin/mailboxes/${id}/test`);
            setTestResult(prev => ({ ...prev, [id]: { ok: res.data.success, msg: res.data.message } }));
        } catch {
            setTestResult(prev => ({ ...prev, [id]: { ok: false, msg: 'Request failed.' } }));
        } finally {
            setTesting(null);
        }
    };

    return (
        <AppLayout title="Mailboxes">
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mailboxes</h1>
                        <p className="text-sm text-gray-500 mt-1">IMAP inboxes polled every 2 minutes for new tickets.</p>
                    </div>
                    <Button onClick={() => { setShowCreate(true); setEditId(null); }}>
                        <PlusIcon className="w-4 h-4 mr-1" /> Add Mailbox
                    </Button>
                </div>

                {showCreate && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-2">New Mailbox</h2>
                        <MailboxForm
                            initial={{ ...EMPTY_FORM }}
                            onSave={data => save(data)}
                            onCancel={() => setShowCreate(false)}
                            label="Create Mailbox"
                        />
                    </div>
                )}

                {mailboxes.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">No mailboxes configured yet.</div>
                ) : (
                    <div className="space-y-4">
                        {mailboxes.map(mb => (
                            <div key={mb.id} className="bg-white border border-gray-200 rounded-lg">
                                {editId === mb.id ? (
                                    <div className="p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Mailbox</h3>
                                        <MailboxForm
                                            initial={{ ...mb, password: '' }}
                                            onSave={data => save(data, mb.id)}
                                            onCancel={() => setEditId(null)}
                                            label="Save Changes"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between px-5 py-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-gray-900">{mb.name}</span>
                                                <Badge variant={mb.is_active ? 'success' : 'default'}>
                                                    {mb.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                {testResult[mb.id] && (
                                                    <span className={`text-xs flex items-center gap-1 ${testResult[mb.id].ok ? 'text-green-600' : 'text-red-600'}`}>
                                                        {testResult[mb.id].ok ? <CheckIcon className="w-3.5 h-3.5" /> : <XMarkIcon className="w-3.5 h-3.5" />}
                                                        {testResult[mb.id].msg}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {mb.username} · {mb.host}:{mb.port} ({mb.encryption.toUpperCase()}) · {mb.mailbox_folder}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {mb.incoming_emails_count} emails received
                                                {mb.last_polled_at ? ` · Last polled ${mb.last_polled_at}` : ' · Never polled'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => test(mb.id)}
                                                disabled={testing === mb.id}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                                title="Test connection"
                                            >
                                                <SignalIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditId(mb.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                                                <PencilSquareIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => confirm('Delete this mailbox?') && router.delete(`/admin/mailboxes/${mb.id}`)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
