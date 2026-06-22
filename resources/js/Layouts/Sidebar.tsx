import { Link, usePage } from '@inertiajs/react';
import {
    HomeIcon,
    TicketIcon,
    ChartBarIcon,
    BookOpenIcon,
    UsersIcon,
    UserGroupIcon,
    BuildingOffice2Icon,
    ComputerDesktopIcon,
    Cog6ToothIcon,
    CodeBracketIcon,
    ClipboardDocumentListIcon,
    KeyIcon,
    DevicePhoneMobileIcon,
    TagIcon,
    AdjustmentsHorizontalIcon,
    FolderIcon,
    RectangleStackIcon,
    DocumentDuplicateIcon,
    InboxIcon,
    EnvelopeIcon,
    ClockIcon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type { SharedProps } from '@/types';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    roles: string[];
}

interface NavGroup {
    group: string;
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        group: '',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['super_admin', 'admin', 'supervisor', 'agent', 'client'] },
        ],
    },
    {
        group: 'Tickets',
        items: [
            { label: 'All Tickets', href: '/tickets', icon: TicketIcon, roles: ['super_admin', 'admin', 'supervisor', 'agent'] },
            { label: 'My Tickets', href: '/my-tickets', icon: TicketIcon, roles: ['client'] },
        ],
    },
    {
        group: 'Resources',
        items: [
            { label: 'Knowledge Base', href: '/kb', icon: BookOpenIcon, roles: ['super_admin', 'admin', 'supervisor', 'agent', 'client'] },
            { label: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['super_admin', 'admin', 'supervisor'] },
        ],
    },
    {
        group: 'Administration',
        items: [
            { label: 'Users',         href: '/admin/users',        icon: UsersIcon,           roles: ['super_admin', 'admin', 'supervisor'] },
            { label: 'Teams',         href: '/admin/teams',        icon: UserGroupIcon,       roles: ['super_admin', 'admin', 'supervisor'] },
            { label: 'Departments',   href: '/admin/departments',  icon: BuildingOffice2Icon, roles: ['super_admin', 'admin', 'supervisor'] },
            { label: 'Tags',          href: '/admin/tags',          icon: TagIcon,                  roles: ['super_admin', 'admin', 'supervisor'] },
            { label: 'Statuses',      href: '/admin/statuses',      icon: AdjustmentsHorizontalIcon, roles: ['super_admin', 'admin'] },
            { label: 'Categories',    href: '/admin/categories',    icon: FolderIcon,               roles: ['super_admin', 'admin', 'supervisor'] },
            { label: 'Custom Fields', href: '/admin/custom-fields', icon: RectangleStackIcon,       roles: ['super_admin', 'admin'] },
            { label: 'Templates',     href: '/admin/templates',     icon: DocumentDuplicateIcon,    roles: ['super_admin', 'admin', 'supervisor'] },
            { label: 'Permissions',     href: '/admin/permissions',      icon: KeyIcon,                   roles: ['super_admin', 'admin'] },
            { label: 'Mailboxes',       href: '/admin/mailboxes',        icon: InboxIcon,                 roles: ['super_admin', 'admin'] },
            { label: 'Email Templates', href: '/admin/email-templates',  icon: EnvelopeIcon,              roles: ['super_admin', 'admin'] },
            { label: 'SLA Policies',    href: '/admin/sla-policies',     icon: ClockIcon,                 roles: ['super_admin', 'admin'] },
            { label: 'Business Hours',  href: '/admin/business-hours',   icon: AdjustmentsHorizontalIcon, roles: ['super_admin', 'admin'] },
            { label: 'Holidays',        href: '/admin/holidays',          icon: CalendarDaysIcon,          roles: ['super_admin', 'admin'] },
            { label: 'Assets',          href: '/assets',                 icon: ComputerDesktopIcon,       roles: ['super_admin', 'admin', 'agent'] },
            { label: 'Settings',        href: '/settings',               icon: Cog6ToothIcon,             roles: ['super_admin', 'admin'] },
        ],
    },
    {
        group: 'Developer',
        items: [
            { label: 'Active Sessions', href: '/admin/sessions',    icon: DevicePhoneMobileIcon,    roles: ['super_admin', 'admin'] },
            { label: 'API & Webhooks',  href: '/api',               icon: CodeBracketIcon,           roles: ['super_admin', 'admin'] },
            { label: 'Audit Logs',      href: '/audit',             icon: ClipboardDocumentListIcon, roles: ['super_admin', 'admin'] },
        ],
    },
];

const availabilityColors: Record<string, string> = {
    online:  'bg-success-500',
    busy:    'bg-danger-500',
    away:    'bg-warning-500',
    offline: 'bg-[--color-text-subtle]',
};

interface Props {
    collapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: Props) {
    const { props, url } = usePage<SharedProps>();
    const user = props.auth.user;
    const userRoles = user?.roles ?? [];

    const visibleGroups = navigation
        .map(g => ({ ...g, items: g.items.filter(i => i.roles.some(r => userRoles.includes(r))) }))
        .filter(g => g.items.length > 0);

    return (
        <aside className={`flex flex-col h-screen bg-[--color-sidebar] border-r border-[--color-border] transition-all duration-200 ease-in-out flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>

            {/* Logo */}
            <div className="flex items-center h-16 px-3 border-b border-[--color-border]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <TicketIcon className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && <span className="font-semibold text-sm text-[--color-text] truncate">ELTS</span>}
                </div>
                <button onClick={onToggle} className="p-1 rounded-md text-[--color-text-muted] hover:bg-[--color-bg] transition-colors flex-shrink-0" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
                {visibleGroups.map(({ group, items }) => (
                    <div key={group || '_root'}>
                        {group && !collapsed && (
                            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[--color-text-subtle]">{group}</p>
                        )}
                        <ul className="space-y-0.5">
                            {items.map(item => {
                                const active = url.startsWith(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            title={collapsed ? item.label : undefined}
                                            className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${active ? 'bg-primary-50 text-primary-700' : 'text-[--color-text-muted] hover:bg-[--color-bg] hover:text-[--color-text]'}`}
                                        >
                                            <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : ''}`} />
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User footer */}
            {user && (
                <div className={`border-t border-[--color-border] p-3 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${availabilityColors[user.availability] ?? 'bg-gray-400'}`} />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-[--color-text] truncate">{user.name}</p>
                            <p className="text-[11px] text-[--color-text-muted] truncate capitalize">{user.availability}</p>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}
