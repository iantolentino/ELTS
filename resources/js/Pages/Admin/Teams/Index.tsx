import { Head, Link, router } from '@inertiajs/react';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/UI';
import Table, { Column } from '@/Components/UI/Table';

interface TeamRow {
    id:            number;
    name:          string;
    description:   string | null;
    department:    string | null;
    members_count: number;
    is_active:     boolean;
}

interface Props {
    teams: TeamRow[];
}

export default function TeamsIndex({ teams }: Props) {
    const columns: Column<TeamRow>[] = [
        {
            key: 'name', label: 'Team',
            render: (row) => (
                <div>
                    <p className="text-sm font-medium text-[--color-text]">{row.name}</p>
                    {row.description && (
                        <p className="text-xs text-[--color-text-muted] truncate max-w-xs">{row.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'department', label: 'Department',
            render: (row) => <span className="text-sm text-[--color-text-muted]">{row.department ?? '—'}</span>,
        },
        {
            key: 'members_count', label: 'Members',
            render: (row) => (
                <span className="text-sm font-medium text-[--color-text]">
                    {row.members_count} {row.members_count === 1 ? 'member' : 'members'}
                </span>
            ),
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
            key: 'actions', label: '',
            render: (row) => (
                <Link
                    href={`/admin/teams/${row.id}/edit`}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                    onClick={e => e.stopPropagation()}
                >
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit
                </Link>
            ),
        },
    ];

    return (
        <AppLayout>
            <Head title="Teams" />
            <div className="p-6 space-y-5">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Teams</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">{teams.length} total</p>
                    </div>
                    <Link
                        href="/admin/teams/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 h-9 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New team
                    </Link>
                </div>

                <Table<TeamRow>
                    columns={columns}
                    data={teams}
                    rowKey={row => row.id}
                    emptyMessage="No teams yet. Create your first team to get started."
                    onRowClick={row => router.visit(`/admin/teams/${row.id}/edit`)}
                />

            </div>
        </AppLayout>
    );
}
