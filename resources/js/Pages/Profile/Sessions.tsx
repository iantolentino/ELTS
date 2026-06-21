import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeftIcon, ComputerDesktopIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, Button, Card } from '@/Components/UI';

interface SessionEntry {
    id:            string;
    ip_address:    string | null;
    user_agent:    string | null;
    last_activity: number;
    is_current:    boolean;
}

interface Props {
    sessions:   SessionEntry[];
    current_id: string;
}

function parseBrowser(ua: string | null): string {
    if (!ua) return 'Unknown browser';
    if (/Edg\//.test(ua))     return 'Microsoft Edge';
    if (/OPR\//.test(ua))     return 'Opera';
    if (/Chrome\//.test(ua))  return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua))  return 'Safari';
    return ua.slice(0, 40);
}

function parseOS(ua: string | null): string {
    if (!ua) return '';
    if (/Windows NT/.test(ua))  return 'Windows';
    if (/Mac OS X/.test(ua))    return 'macOS';
    if (/Android/.test(ua))     return 'Android';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    if (/Linux/.test(ua))       return 'Linux';
    return '';
}

function timeAgo(unix: number): string {
    const diff = Math.floor(Date.now() / 1000) - unix;
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function ProfileSessions({ sessions }: Props) {
    function revoke(id: string) {
        router.delete(`/profile/sessions/${id}`, { preserveScroll: true });
    }

    function revokeOthers() {
        if (!confirm('Sign out of all other sessions?')) return;
        router.delete('/profile/sessions/others', { preserveScroll: true });
    }

    const otherCount = sessions.filter(s => !s.is_current).length;

    return (
        <AppLayout>
            <Head title="Active Sessions" />
            <div className="p-6 max-w-2xl space-y-4">
                <div className="flex items-center gap-3">
                    <Link href="/profile" className="text-[--color-text-muted] hover:text-[--color-text]">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">Active Sessions</h1>
                </div>

                <p className="text-sm text-[--color-text-muted]">
                    These are all devices currently signed into your account. If you don't recognize a session, revoke it immediately.
                </p>

                {otherCount > 0 && (
                    <div className="flex justify-end">
                        <Button variant="danger" size="sm" onClick={revokeOthers}>
                            Sign out of {otherCount} other session{otherCount !== 1 ? 's' : ''}
                        </Button>
                    </div>
                )}

                <Card>
                    {sessions.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[--color-text-muted]">No active sessions.</p>
                    ) : (
                        <ul className="divide-y divide-[--color-border]">
                            {sessions.map(session => {
                                const browser = parseBrowser(session.user_agent);
                                const os      = parseOS(session.user_agent);

                                return (
                                    <li key={session.id} className="flex items-center gap-4 px-4 py-3">
                                        <ComputerDesktopIcon className="w-8 h-8 text-[--color-text-muted] flex-shrink-0" />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-[--color-text]">
                                                    {browser}{os ? ` on ${os}` : ''}
                                                </span>
                                                {session.is_current && (
                                                    <Badge variant="success" size="sm">
                                                        <ShieldCheckIcon className="w-3 h-3 mr-1 inline" />
                                                        This device
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-[--color-text-muted] font-mono mt-0.5">
                                                {session.ip_address ?? '—'}
                                                <span className="font-sans ml-2">· {timeAgo(session.last_activity)}</span>
                                            </p>
                                        </div>

                                        {!session.is_current && (
                                            <button
                                                onClick={() => revoke(session.id)}
                                                title="Revoke session"
                                                className="p-1.5 rounded-lg text-danger-600 hover:bg-danger-50 transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
