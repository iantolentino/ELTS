import { useState, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { MagnifyingGlassIcon, UserPlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/UI';
import Table, { Column } from '@/Components/UI/Table';

type AvailabilityStatus = 'online' | 'busy' | 'away' | 'offline';

interface UserRow {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    job_title: string | null;
    roles: string[];
    team: string | null;
    department: string | null;
    availability_status: AvailabilityStatus;
    is_active: boolean;
    is_vip: boolean;
    last_login_at: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedUsers {
    data: UserRow[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Filters {
    search: string;
    role: string;
    status: string;
    sort_by: string;
    sort_dir: string;
    per_page: number;
}

interface Props {
    users: PaginatedUsers;
    filters: Filters;
    roles: string[];
}

const AVAILABILITY_DOT: Record<AvailabilityStatus, string> = {
    online:  'bg-success-500',
    busy:    'bg-danger-500',
    away:    'bg-warning-500',
    offline: 'bg-gray-400',
};

const ROLE_VARIANT: Record<string, 'purple' | 'info' | 'warning' | 'default' | 'success'> = {
    super_admin: 'purple',
    admin:       'info',
    supervisor:  'warning',
    agent:       'default',
    client:      'success',
};

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function UsersIndex({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search);

    const applyFilter = useCallback((patch: Partial<Filters & { page?: number }>) => {
        router.get('/admin/users', { ...filters, page: 1, ...patch }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [filters]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search !== filters.search) {
                router.get('/admin/users', { ...filters, search, page: 1 }, {
                    preserveState: true, preserveScroll: true, replace: true,
                });
            }
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    function handleSort(key: string): void {
        applyFilter({
            sort_by:  key,
            sort_dir: filters.sort_by === key && filters.sort_dir === 'asc' ? 'desc' : 'asc',
        });
    }

    const columns: Column<UserRow>[] = [
        {
            key: 'name', label: 'User', sortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        {row.avatar ? (
                            <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                                {getInitials(row.name)}
                            </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${AVAILABILITY_DOT[row.availability_status] ?? 'bg-gray-400'}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-[--color-text] truncate">
                            {row.name}{row.is_vip && <span className="ml-1 text-warning-500 text-xs">★</span>}
                        </p>
                        <p className="text-xs text-[--color-text-muted] truncate">{row.job_title ?? '—'}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'email', label: 'Email', sortable: true,
            render: (row) => <span className="text-sm text-[--color-text-muted]">{row.email}</span>,
        },
        {
            key: 'roles', label: 'Role',
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roles.map(role => (
                        <Badge key={role} variant={ROLE_VARIANT[role] ?? 'default'} size="sm">
                            {role.replace(/_/g, ' ')}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'team', label: 'Team',
            render: (row) => <span className="text-sm text-[--color-text-muted]">{row.team ?? '—'}</span>,
        },
        {
            key: 'is_active', label: 'Status',
            render: (row) => (
                <Badge variant={row.is_active ? 'success' : 'danger'}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'last_login_at', label: 'Last login', sortable: true,
            render: (row) => <span className="text-sm text-[--color-text-muted]">{row.last_login_at ?? 'Never'}</span>,
        },
        {
            key: 'created_at', label: 'Joined', sortable: true,
            render: (row) => <span className="text-sm text-[--color-text-muted]">{row.created_at}</span>,
        },
        {
            key: 'actions', label: '',
            render: (row) => (
                <Link
                    href={`/admin/users/${row.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    onClick={e => e.stopPropagation()}
                >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                </Link>
            ),
        },
    ];

    const hasActiveFilters = filters.search || filters.role || filters.status;

    return (
        <AppLayout>
            <Head title="Users" />
            <div className="p-6 space-y-5">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Users</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">{users.total} total</p>
                    </div>
                    <Link
                        href="/admin/users/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 h-9 transition-colors"
                    >
                        <UserPlusIcon className="w-4 h-4" />
                        Add user
                    </Link>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or email…"
                            className="h-9 pl-9 pr-3 rounded-lg border border-[--color-border] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                        />
                    </div>
                    <select
                        value={filters.role}
                        onChange={e => applyFilter({ role: e.target.value })}
                        className="h-9 px-3 rounded-lg border border-[--color-border] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All roles</option>
                        {roles.map(r => (
                            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={e => applyFilter({ status: e.target.value })}
                        className="h-9 px-3 rounded-lg border border-[--color-border] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {hasActiveFilters && (
                        <button
                            onClick={() => { setSearch(''); applyFilter({ search: '', role: '', status: '' }); }}
                            className="text-sm text-[--color-text-muted] hover:text-[--color-text] underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                <Table<UserRow>
                    columns={columns}
                    data={users.data}
                    rowKey={row => row.id}
                    sortKey={filters.sort_by}
                    sortDir={filters.sort_dir as 'asc' | 'desc'}
                    onSort={handleSort}
                    emptyMessage="No users match the current filters."
                />

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-[--color-text-muted]">
                        <span>{users.from ?? 0}–{users.to ?? 0} of {users.total}</span>
                        <div className="flex items-center gap-1">
                            {users.links.map((link, i) => (
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        preserveState
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${link.active ? 'bg-primary-600 text-white border-primary-600' : 'border-[--color-border] hover:bg-[--color-bg] text-[--color-text]'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[--color-border] text-[--color-text-muted] opacity-40 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                        <select
                            value={filters.per_page}
                            onChange={e => applyFilter({ per_page: Number(e.target.value) })}
                            className="h-8 px-2 rounded-lg border border-[--color-border] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {[15, 25, 50, 100].map(n => (
                                <option key={n} value={n}>{n} per page</option>
                            ))}
                        </select>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
