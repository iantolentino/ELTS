import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Input, Card } from '@/Components/UI';
import { TIMEZONES } from '@/lib/constants';

interface Team       { id: number; name: string; }
interface Department { id: number; name: string; }

interface Props {
    roles:       string[];
    teams:       Team[];
    departments: Department[];
}

export default function UserCreate({ roles, teams, departments }: Props) {
    const [showPw, setShowPw]   = useState(false);
    const [showCon, setShowCon] = useState(false);

    const form = useForm({
        name:                  '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        phone:                 '',
        job_title:             '',
        role:                  '',
        team_id:               null as number | null,
        department_id:         null as number | null,
        timezone:              'UTC',
        locale:                'en',
        is_active:             true,
        is_vip:                false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/admin/users');
    }

    const selectCls = 'w-full h-9 rounded-lg border border-[--color-border] bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary-500';

    return (
        <AppLayout>
            <Head title="Add User" />
            <div className="p-6 max-w-2xl space-y-5">

                <div className="flex items-center gap-3">
                    <Link href="/admin/users" className="text-[--color-text-muted] hover:text-[--color-text]">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold text-[--color-text]">Add User</h1>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <Card header={<span className="text-sm font-semibold">Personal Information</span>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Full name" value={form.data.name} onChange={e => form.setData('name', e.target.value)} error={form.errors.name} required />
                            <Input label="Email address" type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} error={form.errors.email} required />
                            <Input label="Phone" type="tel" value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} error={form.errors.phone} placeholder="+1 555 000 0000" />
                            <Input label="Job title" value={form.data.job_title} onChange={e => form.setData('job_title', e.target.value)} error={form.errors.job_title} placeholder="Support Agent" />
                        </div>
                    </Card>

                    <Card header={<span className="text-sm font-semibold">Account Settings</span>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Role <span className="text-danger-500">*</span></label>
                                <select value={form.data.role} onChange={e => form.setData('role', e.target.value)} className={selectCls}>
                                    <option value="">Select role…</option>
                                    {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                                </select>
                                {form.errors.role && <p className="text-xs text-danger-500">{form.errors.role}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Team</label>
                                <select value={form.data.team_id ?? ''} onChange={e => form.setData('team_id', e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                                    <option value="">No team</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Department</label>
                                <select value={form.data.department_id ?? ''} onChange={e => form.setData('department_id', e.target.value ? Number(e.target.value) : null)} className={selectCls}>
                                    <option value="">No department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Timezone</label>
                                <select value={form.data.timezone} onChange={e => form.setData('timezone', e.target.value)} className={selectCls}>
                                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card header={<span className="text-sm font-semibold">Security &amp; Access</span>}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Password <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} value={form.data.password} onChange={e => form.setData('password', e.target.value)} autoComplete="new-password" required
                                        className={`w-full h-9 rounded-lg border text-sm bg-white pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 ${form.errors.password ? 'border-danger-400' : 'border-[--color-border]'}`} />
                                    <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                                        {showPw ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                                {form.errors.password && <p className="text-xs text-danger-500">{form.errors.password}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[--color-text]">Confirm password <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <input type={showCon ? 'text' : 'password'} value={form.data.password_confirmation} onChange={e => form.setData('password_confirmation', e.target.value)} autoComplete="new-password" required
                                        className="w-full h-9 rounded-lg border border-[--color-border] text-sm bg-white pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                                    <button type="button" tabIndex={-1} onClick={() => setShowCon(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]">
                                        {showCon ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-6">
                            <Toggle label="Active account" checked={form.data.is_active} onChange={v => form.setData('is_active', v)} />
                            <Toggle label="VIP client" checked={form.data.is_vip} onChange={v => form.setData('is_vip', v)} />
                        </div>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Link href="/admin/users" className="text-sm text-[--color-text-muted] hover:text-[--color-text]">Cancel</Link>
                        <Button type="submit" loading={form.processing}>Create user</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-[--color-text]">{label}</span>
        </label>
    );
}
