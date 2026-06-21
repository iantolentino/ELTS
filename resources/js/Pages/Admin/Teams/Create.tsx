import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input, Card } from '@/Components/UI';

interface Department { id: number; name: string; }

interface Props {
    departments: Department[];
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

export default function TeamCreate({ departments }: Props) {
    const form = useForm({
        name:          '',
        description:   '',
        department_id: null as number | null,
        is_active:     true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/teams');
    }

    const selectCls = 'w-full h-9 rounded-lg border border-[--color-border] bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary-500';

    return (
        <AppLayout>
            <Head title="New Team" />
            <div className="p-6 max-w-xl space-y-5">

                <div className="flex items-center gap-3">
                    <Link href="/admin/teams" className="text-[--color-text-muted] hover:text-[--color-text]">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">New Team</h1>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <Card header={<span className="text-sm font-semibold">Team Details</span>}>
                        <div className="space-y-4">
                            <Input
                                label="Team name"
                                value={form.data.name}
                                onChange={e => form.setData('name', e.target.value)}
                                error={form.errors.name}
                                required
                                placeholder="e.g. Tier 1 Support"
                            />
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Description</label>
                                <textarea
                                    value={form.data.description}
                                    onChange={e => form.setData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Optional description…"
                                    className="w-full rounded-lg border border-[--color-border] bg-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                />
                                {form.errors.description && <p className="text-xs text-danger-500">{form.errors.description}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Department</label>
                                <select
                                    value={form.data.department_id ?? ''}
                                    onChange={e => form.setData('department_id', e.target.value ? Number(e.target.value) : null)}
                                    className={selectCls}
                                >
                                    <option value="">No department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <Toggle label="Active" checked={form.data.is_active} onChange={v => form.setData('is_active', v)} />
                        </div>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Link href="/admin/teams" className="text-sm text-[--color-text-muted] hover:text-[--color-text]">Cancel</Link>
                        <Button type="submit" loading={form.processing}>Create team</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
