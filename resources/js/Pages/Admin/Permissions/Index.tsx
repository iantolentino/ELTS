import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/UI';

interface RoleItem        { id: number; name: string; }
interface PermissionItem  { name: string; label: string; }
interface PermissionGroup { module: string; permissions: PermissionItem[]; }

interface Props {
    roles:             RoleItem[];
    permission_groups: PermissionGroup[];
    role_permissions:  Record<string, string[]>;
}

const LOCKED = ['super_admin', 'admin'];

const MODULE_LABELS: Record<string, string> = {
    tickets:          'Tickets',
    users:            'Users',
    teams:            'Teams',
    departments:      'Departments',
    sla:              'SLA',
    automation:       'Automation',
    reports:          'Reports',
    kb:               'Knowledge Base',
    assets:           'Assets',
    audit:            'Audit Logs',
    settings:         'Settings',
    canned_responses: 'Canned Responses',
    notifications:    'Notifications',
    api:              'API & Webhooks',
};

export default function PermissionsIndex({ roles, permission_groups, role_permissions }: Props) {
    const [perms, setPerms] = useState<Record<string, Set<string>>>(
        () => Object.fromEntries(roles.map(r => [r.name, new Set(role_permissions[r.name] ?? [])]))
    );
    const [dirty,  setDirty]  = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState<string | null>(null);

    function toggle(role: string, perm: string) {
        if (LOCKED.includes(role)) return;
        setPerms(prev => {
            const s = new Set(prev[role]);
            s.has(perm) ? s.delete(perm) : s.add(perm);
            return { ...prev, [role]: s };
        });
        setDirty(prev => new Set([...prev, role]));
    }

    function save(roleName: string) {
        setSaving(roleName);
        router.put(`/admin/roles/${roleName}/permissions`, {
            permissions: [...perms[roleName]],
        }, {
            preserveState:  true,
            preserveScroll: true,
            onSuccess: () => setDirty(prev => { const s = new Set(prev); s.delete(roleName); return s; }),
            onFinish:  () => setSaving(null),
        });
    }

    const roleLabel = (name: string) => name.replace(/_/g, ' ');

    return (
        <AppLayout>
            <Head title="Role Permissions" />
            <div className="p-6 space-y-4">

                <div>
                    <h1 className="text-xl font-semibold text-[--color-text]">Role Permissions</h1>
                    <p className="text-sm text-[--color-text-muted] mt-0.5">
                        Manage what each role can do. <span className="font-medium">super_admin</span> and <span className="font-medium">admin</span> are locked to full access.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[--color-border]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[--color-bg] border-b border-[--color-border]">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-text-muted] uppercase tracking-wider w-52 sticky left-0 bg-[--color-bg]">
                                    Permission
                                </th>
                                {roles.map(role => (
                                    <th key={role.name} className="px-3 py-2 text-center min-w-[110px]">
                                        <div className="text-xs font-semibold text-[--color-text] capitalize mb-1.5">
                                            {roleLabel(role.name)}
                                        </div>
                                        {LOCKED.includes(role.name) ? (
                                            <Badge variant="default" size="sm">Full access</Badge>
                                        ) : (
                                            <button
                                                onClick={() => save(role.name)}
                                                disabled={!dirty.has(role.name) || saving !== null}
                                                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                                    dirty.has(role.name)
                                                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                                                        : 'bg-[--color-bg] text-[--color-text-muted] border border-[--color-border] cursor-default'
                                                }`}
                                            >
                                                {saving === role.name ? 'Saving…' : dirty.has(role.name) ? 'Save' : 'Saved ✓'}
                                            </button>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {permission_groups.map(group => (
                                <>
                                    <tr key={`grp-${group.module}`} className="bg-[--color-bg]/60 border-t border-[--color-border]">
                                        <td
                                            colSpan={roles.length + 1}
                                            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted]"
                                        >
                                            {MODULE_LABELS[group.module] ?? group.module}
                                        </td>
                                    </tr>
                                    {group.permissions.map(perm => (
                                        <tr key={perm.name} className="border-t border-[--color-border]/50 hover:bg-primary-50/20 transition-colors">
                                            <td className="px-4 py-2 pl-6 text-sm text-[--color-text] sticky left-0 bg-white capitalize">
                                                {perm.label}
                                            </td>
                                            {roles.map(role => {
                                                const checked = perms[role.name]?.has(perm.name) ?? false;
                                                const locked  = LOCKED.includes(role.name);
                                                return (
                                                    <td key={role.name} className="text-center py-2">
                                                        {locked ? (
                                                            <CheckCircleIcon className="w-4 h-4 text-success-400 mx-auto" />
                                                        ) : (
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggle(role.name, perm.name)}
                                                                disabled={saving !== null}
                                                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </AppLayout>
    );
}
