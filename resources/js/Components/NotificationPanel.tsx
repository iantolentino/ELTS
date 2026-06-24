import { Link, router, usePage } from '@inertiajs/react';
import {
    BellIcon, TicketIcon, ChatBubbleLeftIcon,
    AtSymbolIcon, ClockIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { SharedProps, AppNotification } from '@/types';

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
    isOpen:  boolean;
    onClose: () => void;
}

function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationItem({ n, onMarkRead, onNavigate }: {
    n:          AppNotification;
    onMarkRead: (id: string) => void;
    onNavigate: () => void;
}) {
    const isUnread = n.read_at === null;
    const title    = n.data.title ?? 'Notification';
    const body     = n.data.body  ?? '';

    const { Icon, color } = notifMeta(n.data.event);

    const inner = (
        <>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUnread ? color : 'bg-[--color-bg] text-[--color-text-muted]'}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${isUnread ? 'font-medium text-[--color-text]' : 'text-[--color-text]'}`}>{title}</p>
                {body && <p className="text-xs text-[--color-text-muted] mt-0.5 truncate">{body}</p>}
                <p className="text-[11px] text-[--color-text-subtle] mt-1">{timeAgo(n.created_at)}</p>
            </div>
            {isUnread && (
                <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); onMarkRead(n.id); }}
                    className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-2 hover:bg-primary-700 transition-colors"
                    title="Mark as read"
                />
            )}
        </>
    );

    const cls = `px-4 py-3 flex items-start gap-3 hover:bg-[--color-bg] transition-colors ${isUnread ? 'bg-primary-50/30' : ''}`;

    return n.data.url ? (
        <Link href={n.data.url} onClick={onNavigate} className={cls}>{inner}</Link>
    ) : (
        <div className={cls}>{inner}</div>
    );
}

export default function NotificationPanel({ isOpen, onClose }: Props) {
    const { props } = usePage<SharedProps>();
    const { unread_count, recent } = props.notifications;

    if (!isOpen) return null;

    function markAllRead() {
        router.post('/notifications/read-all', {}, { preserveScroll: true, preserveState: true });
        onClose();
    }

    function markRead(id: string) {
        router.patch(`/notifications/${id}/read`, {}, { preserveScroll: true, preserveState: true });
    }

    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose} />
            <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-[--color-border] rounded-xl shadow-xl z-20 overflow-hidden">

                <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-border]">
                    <p className="text-sm font-semibold text-[--color-text]">Notifications</p>
                    {unread_count > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="divide-y divide-[--color-border] max-h-80 overflow-y-auto">
                    {recent.length === 0 ? (
                        <div className="py-10 flex flex-col items-center gap-2 text-[--color-text-muted]">
                            <BellIcon className="w-8 h-8 opacity-30" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        recent.map(n => (
                            <NotificationItem key={n.id} n={n} onMarkRead={markRead} onNavigate={onClose} />
                        ))
                    )}
                </div>

                <div className="px-4 py-3 border-t border-[--color-border] bg-[--color-bg]">
                    <Link href="/notifications" onClick={onClose} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                        View all notifications →
                    </Link>
                </div>
            </div>
        </>
    );
}
