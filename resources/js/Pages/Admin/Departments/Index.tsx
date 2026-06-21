import { Head, Link, router } from '@inertiajs/react';
import { PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/UI';
import Table, { Column } from '@/Components/UI/Table';

interface DeptRow {
    id:          number;
    name:        string;
    description: string | null;
    teams_count: number;
    users_count: number;
    is_active:   boolean;
}

interface Props {
    departments: DeptRow[];
}

export default function DepartmentsIndex({ departments }: Props) {
    const columns: Column<DeptRow>[] = [
        {
            key: 'name', label: 'Department',
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
            key: 'teams_count', label: 'Teams',
            render: (row) => (
                <span className="text-sm text-[--color-text-muted]">
                    {row.teams_count} {row.teams_count === 1 ? 'team' : 'teams'}
                </span>
            ),
        },
        {
            key: 'users_count', label: 'Users',
            render: (row) => (
                <span className="text-sm text-[--color-text-muted]">
                    {row.users_count} {row.users_count === 1 ? 'user' : 'users'}
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
                    href={`/admin/departments/${row.id}/edit`}
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
            <Head title="Departments" />
            <div className="p-6 space-y-5">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Departments</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">{departments.length} total</p>
                    </div>
                    <Link
                        href="/admin/departments/create"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 h-9 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New department
                    </Link>
                </div>

                <Table<DeptRow>
                    columns={columns}
                    data={departments}
                    rowKey={row => row.id}
                    emptyMessage="No departments yet. Create one to start organising your teams."
                    onRowClick={row => router.visit(`/admin/departments/${row.id}/edit`)}
                />

            </div>
        </AppLayout>
    );
}
