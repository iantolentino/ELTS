import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input, Card, Badge } from '@/Components/UI';

interface DeptTeam {
    id:            number;
    name:          string;
    members_count: number;
    is_active:     boolean;
}

interface EditDepartment {
    id:          number;
    name:        string;
    description: string | null;
    is_active:   boolean;
}

interface Props {
    department: EditDepartment;
    teams:      DeptTeam[];
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-[--color-text]">{label}</span>
        </label>
    );
}

export default function DepartmentEdit({ department, teams }: Props) {
    const form = useForm({
        name:        department.name,
        description: department.description ?? '',
        is_active:   department.is_active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/admin/departments/${department.id}`);
    }

    function handleDelete() {
        if (confirm(`Delete "${department.name}"? All teams and users in this department will be unassigned.`)) {
            router.delete(`/admin/departments/${department.id}`);
        }
    }

    return (
        <AppLayout>
            <Head title={`Edit: ${department.name}`} />
            <div className="p-6 max-w-xl space-y-5">

                <div className="flex items-center gap-3">
                    <Link href="/admin/departments" className="text-[--color-text-muted] hover:text-[--color-text]">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">Edit Department</h1>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <Card header={<span className="text-sm font-semibold">Department Details</span>}>
                        <div className="space-y-4">
                            <Input label="Department name" value={form.data.name} onChange={e => form.setData('name', e.target.value)} error={form.errors.name} required />
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Description</label>
                                <textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} rows={3}
                                    className="w-full rounded-lg border border-[--color-border] bg-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                                {form.errors.description && <p className="text-xs text-danger-500">{form.errors.description}</p>}
                            </div>
                            <Toggle label="Active" checked={form.data.is_active} onChange={v => form.setData('is_active', v)} />
                        </div>
                    </Card>

                    <Card header={<span className="text-sm font-semibold">Teams in this Department</span>}>
                        {teams.length === 0 ? (
                            <p className="text-sm text-[--color-text-muted]">
                                No teams assigned yet.{' '}
                                <Link href="/admin/teams/create" className="text-primary-600 hover:text-primary-700">Create a team</Link>
                                {' '}and assign it to this department.
                            </p>
                        ) : (
                            <div className="divide-y divide-[--color-border] border border-[--color-border] rounded-lg overflow-hidden">
                                {teams.map(team => (
                                    <div key={team.id} className="flex items-center justify-between px-4 py-2.5">
                                        <div>
                                            <p className="text-sm font-medium text-[--color-text]">{team.name}</p>
                                            <p className="text-xs text-[--color-text-muted]">
                                                {team.members_count} {team.members_count === 1 ? 'member' : 'members'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={team.is_active ? 'success' : 'danger'} size="sm">
                                                {team.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Link href={`/admin/teams/${team.id}/edit`}
                                                className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                                Edit →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <div className="flex items-center justify-between">
                        <button type="button" onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700 font-medium">
                            <TrashIcon className="w-4 h-4" />
                            Delete department
                        </button>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/departments" className="text-sm text-[--color-text-muted] hover:text-[--color-text]">Cancel</Link>
                            <Button type="submit" loading={form.processing}>Save changes</Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
