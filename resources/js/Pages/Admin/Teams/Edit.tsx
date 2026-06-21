import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input, Card, Badge } from '@/Components/UI';

interface Department { id: number; name: string; }

interface Agent {
    id:           number;
    name:         string;
    email:        string;
    job_title:    string | null;
    current_team: string | null;
}

interface EditTeam {
    id:            number;
    name:          string;
    description:   string | null;
    department_id: number | null;
    is_active:     boolean;
}

interface Props {
    team:        EditTeam;
    departments: Department[];
    agents:      Agent[];
    member_ids:  number[];
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

export default function TeamEdit({ team, departments, agents, member_ids }: Props) {
    const [agentSearch, setAgentSearch] = useState('');

    const form = useForm({
        name:          team.name,
        description:   team.description ?? '',
        department_id: team.department_id,
        is_active:     team.is_active,
        member_ids:    member_ids,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.put(`/admin/teams/${team.id}`);
    }

    function handleDelete() {
        if (confirm(`Delete "${team.name}"? All members will be unassigned.`)) {
            router.delete(`/admin/teams/${team.id}`);
        }
    }

    function toggleMember(id: number, checked: boolean) {
        form.setData('member_ids', checked
            ? [...form.data.member_ids, id]
            : form.data.member_ids.filter(m => m !== id)
        );
    }

    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        a.email.toLowerCase().includes(agentSearch.toLowerCase())
    );

    const selectCls = 'w-full h-9 rounded-lg border border-[--color-border] bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary-500';

    return (
        <AppLayout>
            <Head title={`Edit: ${team.name}`} />
            <div className="p-6 max-w-2xl space-y-5">

                <div className="flex items-center gap-3">
                    <Link href="/admin/teams" className="text-[--color-text-muted] hover:text-[--color-text]">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">Edit Team</h1>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <Card header={<span className="text-sm font-semibold">Team Details</span>}>
                        <div className="space-y-4">
                            <Input label="Team name" value={form.data.name} onChange={e => form.setData('name', e.target.value)} error={form.errors.name} required />
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Description</label>
                                <textarea value={form.data.description} onChange={e => form.setData('description', e.target.value)} rows={3}
                                    className="w-full rounded-lg border border-[--color-border] bg-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Department</label>
                                <select value={form.data.department_id ?? ''} onChange={e => form.setData('department_id', e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                                    <option value="">No department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <Toggle label="Active" checked={form.data.is_active} onChange={v => form.setData('is_active', v)} />
                        </div>
                    </Card>

                    <Card header={
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Members</span>
                            <Badge variant="info">{form.data.member_ids.length} selected</Badge>
                        </div>
                    }>
                        <div className="space-y-3">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
                                <input type="text" value={agentSearch} onChange={e => setAgentSearch(e.target.value)}
                                    placeholder="Search agents or supervisors…"
                                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[--color-border] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                            </div>
                            {agents.length === 0 ? (
                                <p className="text-sm text-[--color-text-muted] py-4 text-center">No agents or supervisors found.</p>
                            ) : (
                                <div className="max-h-72 overflow-y-auto border border-[--color-border] rounded-lg divide-y divide-[--color-border]">
                                    {filtered.map(agent => {
                                        const checked = form.data.member_ids.includes(agent.id);
                                        const inOtherTeam = agent.current_team && agent.current_team !== team.name;
                                        return (
                                            <label key={agent.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-[--color-bg] cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={e => toggleMember(agent.id, e.target.checked)}
                                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-[--color-text]">{agent.name}</p>
                                                    <p className="text-xs text-[--color-text-muted]">{agent.job_title ?? agent.email}</p>
                                                    {inOtherTeam && (
                                                        <p className="text-xs text-warning-600 mt-0.5">Currently in: {agent.current_team}</p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <p className="text-sm text-[--color-text-muted] py-4 text-center">No results.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="flex items-center justify-between">
                        <button type="button" onClick={handleDelete}
                            className="inline-flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700 font-medium">
                            <TrashIcon className="w-4 h-4" />
                            Delete team
                        </button>
                        <div className="flex items-center gap-3">
                            <Link href="/admin/teams" className="text-sm text-[--color-text-muted] hover:text-[--color-text]">Cancel</Link>
                            <Button type="submit" loading={form.processing}>Save changes</Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
