import { Link, router } from '@inertiajs/react';
import { BoltIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

interface Rule {
    id: number;
    name: string;
    event: string;
    match_type: 'all' | 'any';
    is_active: boolean;
    sort_order: number;
    conditions_count: number;
    actions_count: number;
}

interface Props extends PageProps {
    rules: Rule[];
}

const EVENT_LABELS: Record<string, string> = {
    ticket_created:        'Ticket Created',
    ticket_updated:        'Ticket Updated',
    ticket_replied:        'Ticket Replied',
    ticket_status_changed: 'Status Changed',
    ticket_assigned:       'Ticket Assigned',
};

export default function AutomationsIndex({ rules }: Props) {
    const toggle = (rule: Rule) => {
        router.patch(`/admin/automations/${rule.id}/toggle`, {}, { preserveScroll: true });
    };

    const destroy = (rule: Rule) => {
        if (!confirm(`Delete rule "${rule.name}"?`)) return;
        router.delete(`/admin/automations/${rule.id}`);
    };

    return (
        <AppLayout title="Automation Rules">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <BoltIcon className="w-6 h-6 text-indigo-600" />
                    <h1 className="text-xl font-semibold text-gray-900">Automation Rules</h1>
                </div>
                <Link
                    href="/admin/automations/create"
                    className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Rule
                </Link>
            </div>

            {rules.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <BoltIcon className="mx-auto w-10 h-10 text-gray-300 mb-3" />
                    <p className="font-medium">No automation rules yet.</p>
                    <p className="text-sm mt-1">Create your first rule to automatically act on tickets.</p>
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg overflow-hidden ring-1 ring-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rule</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trigger</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Conditions</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                                        <p className="text-xs text-gray-400">Match {rule.match_type} conditions</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {EVENT_LABELS[rule.event] ?? rule.event}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {rule.conditions_count}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {rule.actions_count}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggle(rule)}
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                rule.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-500'
                                            }`}
                                        >
                                            {rule.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/automations/${rule.id}/edit`}
                                                className="text-gray-400 hover:text-indigo-600"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => destroy(rule)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppLayout>
    );
}
