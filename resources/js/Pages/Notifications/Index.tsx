import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    BellIcon, CheckIcon, TrashIcon, TicketIcon,
    ChatBubbleLeftIcon, AtSymbolIcon, ClockIcon, ExclamationTriangleIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import type { AppNotification, PaginatedData } from '@/types';

function notifMeta(event?: string): { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string } {
    switch (event) {
        case 'ticket_assigned': return { Icon: TicketIcon,               color: 'bg-primary-100 text-primary-600' };
        case 'reply_received':  return { Icon: ChatBubbleLeftIcon,       color: 'bg-green-100 text-green-600' };
        case 'mention':         return { Icon: AtSymbolIcon,             color: 'bg-violet-100 text-violet-600' };
        case 'sla_warning':     return { Icon: ClockIcon,                color: 'bg-yellow-100 text-yellow-600' };
        case 'sla_breach':      return { Icon: ExclamationTriangleIcon,  color: 'bg-red-100 text-red-600' };
        default:                return { Icon: BellIcon,                 color: 'bg-[--color-bg] text-[--color-text-muted]' };
    }
}

interface Props {
    notifications: PaginatedData<AppNotification>;
    filter:        'all' | 'unread';
}

function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationRow({ n, onMarkRead, onDelete }: {
    n:          AppNotification;
    onMarkRead: (id: string) => void;
    onDelete:   (id: string) => void;
}) {
    const isUnread = n.read_at === null;
    const title    = n.data.title ?? 'Notification';
    const body     = n.data.body  ?? '';
    const { Icon, color } = notifMeta(n.data.event);

    const inner = (
        <div className={`flex items-start gap-4 px-5 py-4 hover:bg-[--color-bg] transition-colors group ${isUnread ? 'bg-primary-50/20' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUnread ? color : 'bg-[--color-bg] text-[--color-text-muted]'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${isUnread ? 'font-medium text-[--color-text]' : 'text-[--color-text]'}`}>{title}</p>
                {body && <p className="text-sm text-[--color-text-muted] mt-0.5">{body}</p>}
                <p className="text-xs text-[--color-text-subtle] mt-1">{timeAgo(n.created_at)}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {isUnread && (
                    <button
                        onClick={e => { e.preventDefault(); onMarkRead(n.id); }}
                        title="Mark as read"
                        className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-border] hover:text-primary-600 transition-colors"
                    >
                        <CheckIcon className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={e => { e.preventDefault(); onDelete(n.id); }}
                    title="Delete"
                    className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            {isUnread && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
        </div>
    );

    return n.data.url ? (
        <Link href={n.data.url}>{inner}</Link>
    ) : (
        <>{inner}</>
    );
}

export default function NotificationsIndex({ notifications, filter }: Props) {
    function setFilter(f: 'all' | 'unread') {
        router.get('/notifications', f === 'unread' ? { filter: 'unread' } : {}, { preserveScroll: true });
    }

    function markRead(id: string) {
        router.patch(`/notifications/${id}/read`, {}, { preserveScroll: true });
    }

    function markAllRead() {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    }

    function destroy(id: string) {
        router.delete(`/notifications/${id}`, { preserveScroll: true });
    }

    const TAB = (active: boolean) =>
        `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-primary-50 text-primary-700' : 'text-[--color-text-muted] hover:text-[--color-text] hover:bg-[--color-bg]'}`;

    return (
        <AppLayout>
            <Head title="Notifications" />
            <div className="px-6 py-6 space-y-6 max-w-3xl">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Notifications</h1>
                        <p className="mt-1 text-sm text-[--color-text-muted]">Your activity updates and alerts.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {notifications.total > 0 && (
                            <button
                                onClick={markAllRead}
                                className="px-4 h-9 text-sm font-medium bg-[--color-surface] border border-[--color-border] rounded-lg text-[--color-text] hover:bg-[--color-bg] transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                        <Link
                            href="/notifications/preferences"
                            className="p-2 rounded-lg text-[--color-text-muted] hover:bg-[--color-surface] border border-transparent hover:border-[--color-border] transition-colors"
                            title="Notification preferences"
                        >
                            <Cog6ToothIcon className="w-5 h-5" />
                        </Link>
                    </div>
                </div>

                <div className="bg-[--color-surface] border border-[--color-border] rounded-xl overflow-hidden">

                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 px-3 py-2 border-b border-[--color-border]">
                        <button onClick={() => setFilter('all')}    className={TAB(filter === 'all')}>All</button>
                        <button onClick={() => setFilter('unread')} className={TAB(filter === 'unread')}>Unread</button>
                    </div>

                    {/* List */}
                    {notifications.data.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-[--color-text-muted]">
                            <BellIcon className="w-10 h-10 opacity-25" />
                            <p className="text-sm">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[--color-border]">
                            {notifications.data.map(n => (
                                <NotificationRow key={n.id} n={n} onMarkRead={markRead} onDelete={destroy} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {notifications.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-[--color-border] text-sm text-[--color-text-muted]">
                            <span>{notifications.from}–{notifications.to} of {notifications.total}</span>
                            <div className="flex gap-1">
                                {notifications.links.map((link, i) => (
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-3 py-1 rounded-lg text-xs transition-colors ${link.active ? 'bg-primary-600 text-white' : 'hover:bg-[--color-bg]'}`}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className="px-3 py-1 rounded-lg text-xs opacity-40"
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
