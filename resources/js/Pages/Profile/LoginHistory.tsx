import { Head, Link } from '@inertiajs/react';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Card } from '@/Components/UI';

interface LoginEntry {
    id:         number;
    ip_address: string;
    user_agent: string | null;
    status:     'success' | 'failed';
    created_at: string;
}

interface Props {
    entries: LoginEntry[];
}

function parseBrowser(ua: string | null): string {
    if (!ua) return '—';
    if (/Edg\//.test(ua))     return 'Edge';
    if (/OPR\//.test(ua))     return 'Opera';
    if (/Chrome\//.test(ua))  return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua))  return 'Safari';
    return ua.slice(0, 40);
}

export default function ProfileLoginHistory({ entries }: Props) {
    return (
        <AppLayout>
            <Head title="Login History" />
            <div className="p-6 max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="text-[--color-text-muted] hover:text-[--color-text]">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">Login History</h1>
                </div>
                <p className="text-sm text-[--color-text-muted]">
                    Your last {entries.length} login attempts. If you see unfamiliar activity, change your password immediately.
                </p>

                <Card>
                    {entries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[--color-text-muted]">No login history yet.</p>
                    ) : (
                        <ul className="divide-y divide-[--color-border]">
                            {entries.map(entry => (
                                <li key={entry.id} className="flex items-center justify-between py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        {entry.status === 'success'
                                            ? <CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0" />
                                            : <XCircleIcon    className="w-4 h-4 text-danger-500 flex-shrink-0" />}
                                        <div>
                                            <p className="text-sm font-medium text-[--color-text]">
                                                {parseBrowser(entry.user_agent)}
                                            </p>
                                            <p className="text-xs text-[--color-text-muted] font-mono">
                                                {entry.ip_address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-right">
                                        <Badge
                                            variant={entry.status === 'success' ? 'success' : 'danger'}
                                            size="sm"
                                        >
                                            {entry.status === 'success' ? 'Success' : 'Failed'}
                                        </Badge>
                                        <span className="text-xs text-[--color-text-muted] whitespace-nowrap">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
