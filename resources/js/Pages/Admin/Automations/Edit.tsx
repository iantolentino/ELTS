import { useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';

interface Option { id: number; name: string; }
interface StatusOption { id: number; name: string; is_closed: boolean; }

interface Props {
    rule: null | {
        id: number;
        name: string;
        description: string | null;
        event: string;
        match_type: 'all' | 'any';
        is_active: boolean;
        sort_order: number;
        conditions: Array<{ field: string; operator: string; value: string | null }>;
        actions: Array<{ action_type: string; value: string | null }>;
    };
    statuses: StatusOption[];
    categories: Option[];
    tags: Option[];
    teams: Option[];
    agents: Option[];
}

interface ConditionRow { field: string; operator: string; value: string; }
interface ActionRow { action_type: string; value: string; }

const EVENTS = [
    { value: 'ticket_created',        label: 'Ticket Created' },
    { value: 'ticket_updated',        label: 'Ticket Updated' },
    { value: 'ticket_replied',        label: 'Ticket Replied' },
    { value: 'ticket_status_changed', label: 'Status Changed' },
    { value: 'ticket_assigned',       label: 'Ticket Assigned' },
];

const FIELDS: Array<{ value: string; label: string; valueType: string; operators: string[] }> = [
    { value: 'status',          label: 'Status',          valueType: 'status',   operators: ['equals', 'not_equals'] },
    { value: 'priority',        label: 'Priority',        valueType: 'priority', operators: ['equals', 'not_equals'] },
    { value: 'category',        label: 'Category',        valueType: 'category', operators: ['equals', 'not_equals', 'is_empty', 'is_not_empty'] },
    { value: 'tag',             label: 'Tag',             valueType: 'tag',      operators: ['contains', 'not_contains'] },
    { value: 'subject',         label: 'Subject',         valueType: 'text',     operators: ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with'] },
    { value: 'description',     label: 'Description',     valueType: 'text',     operators: ['contains', 'not_contains'] },
    { value: 'requester_email', label: 'Requester Email', valueType: 'text',     operators: ['contains', 'equals', 'not_equals'] },
    { value: 'assignee',        label: 'Assignee',        valueType: 'agent',    operators: ['equals', 'not_equals', 'is_empty', 'is_not_empty'] },
    { value: 'team',            label: 'Team',            valueType: 'team',     operators: ['equals', 'not_equals', 'is_empty', 'is_not_empty'] },
    { value: 'source',          label: 'Source',          valueType: 'source',   operators: ['equals', 'not_equals'] },
    { value: 'is_vip',          label: 'Is VIP',          valueType: 'boolean',  operators: ['equals'] },
];

const OPERATOR_LABELS: Record<string, string> = {
    equals: 'equals', not_equals: 'does not equal', contains: 'contains',
    not_contains: 'does not contain', starts_with: 'starts with', ends_with: 'ends with',
    is_empty: 'is empty', is_not_empty: 'is not empty',
};

const ACTION_TYPES: Array<{ value: string; label: string; valueType: string }> = [
    { value: 'assign_to',          label: 'Assign to Agent',              valueType: 'agent' },
    { value: 'assign_round_robin', label: 'Assign Round-Robin',           valueType: 'none' },
    { value: 'assign_by_skill',    label: 'Assign by Skill Match',        valueType: 'none' },
    { value: 'add_tag',            label: 'Add Tag',                      valueType: 'tag' },
    { value: 'remove_tag',         label: 'Remove Tag',                   valueType: 'tag' },
    { value: 'change_status',      label: 'Change Status',                valueType: 'status' },
    { value: 'change_priority',    label: 'Change Priority',              valueType: 'priority' },
    { value: 'send_notification',  label: 'Send Notification to Requester', valueType: 'text' },
    { value: 'add_note',           label: 'Add Internal Note',            valueType: 'text' },
    { value: 'close',              label: 'Close Ticket',                 valueType: 'none' },
    { value: 'escalate',           label: 'Escalate (set Critical)',      valueType: 'none' },
];

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const SOURCES    = ['web', 'email', 'phone', 'api'];

function newCondition(): ConditionRow { return { field: 'status', operator: 'equals', value: '' }; }
function newAction(): ActionRow       { return { action_type: 'assign_round_robin', value: '' }; }

export default function AutomationsEdit({ rule, statuses, categories, tags, teams, agents }: Props) {
    const isEdit = rule !== null;

    const { data, setData, post, put, processing, errors } = useForm<{
        name: string;
        description: string;
        event: string;
        match_type: 'all' | 'any';
        is_active: boolean;
        sort_order: number;
        conditions: ConditionRow[];
        actions: ActionRow[];
    }>({
        name:        rule?.name ?? '',
        description: rule?.description ?? '',
        event:       rule?.event ?? 'ticket_created',
        match_type:  rule?.match_type ?? 'all',
        is_active:   rule?.is_active ?? true,
        sort_order:  rule?.sort_order ?? 0,
        conditions:  rule?.conditions?.map(c => ({ field: c.field, operator: c.operator, value: c.value ?? '' })) ?? [newCondition()],
        actions:     rule?.actions?.map(a => ({ action_type: a.action_type, value: a.value ?? '' })) ?? [newAction()],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/automations/${rule!.id}`);
        } else {
            post('/admin/automations');
        }
    };

    const addCondition    = () => setData('conditions', [...data.conditions, newCondition()]);
    const removeCondition = (i: number) => setData('conditions', data.conditions.filter((_, idx) => idx !== i));
    const updateCondition = (i: number, patch: Partial<ConditionRow>) =>
        setData('conditions', data.conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c));

    const addAction    = () => setData('actions', [...data.actions, newAction()]);
    const removeAction = (i: number) => setData('actions', data.actions.filter((_, idx) => idx !== i));
    const updateAction = (i: number, patch: Partial<ActionRow>) =>
        setData('actions', data.actions.map((a, idx) => idx === i ? { ...a, ...patch } : a));

    const fieldMeta   = (field: string) => FIELDS.find(f => f.value === field);
    const actionMeta  = (type: string)  => ACTION_TYPES.find(a => a.value === type);
    const needsValue  = (operator: string) => !['is_empty', 'is_not_empty'].includes(operator);

    const renderConditionValue = (cond: ConditionRow, i: number) => {
        if (!needsValue(cond.operator)) return null;
        const vt = fieldMeta(cond.field)?.valueType ?? 'text';
        const cls = 'border rounded px-2 py-1 text-sm w-full';

        if (vt === 'status')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>;

        if (vt === 'priority')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>;

        if (vt === 'category')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>;

        if (vt === 'tag')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>;

        if (vt === 'agent')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>;

        if (vt === 'team')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>;

        if (vt === 'source')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="">— select —</option>
                {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>;

        if (vt === 'boolean')
            return <select className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })}>
                <option value="true">True</option>
                <option value="false">False</option>
            </select>;

        return <input type="text" className={cls} value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })} placeholder="value…" />;
    };

    const renderActionValue = (action: ActionRow, i: number) => {
        const vt = actionMeta(action.action_type)?.valueType ?? 'none';
        if (vt === 'none') return null;
        const cls = 'border rounded px-2 py-1 text-sm w-full';

        if (vt === 'agent')
            return <select className={cls} value={action.value} onChange={e => updateAction(i, { value: e.target.value })}>
                <option value="">— select agent —</option>
                {agents.map(a => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
            </select>;

        if (vt === 'status')
            return <select className={cls} value={action.value} onChange={e => updateAction(i, { value: e.target.value })}>
                <option value="">— select status —</option>
                {statuses.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>;

        if (vt === 'priority')
            return <select className={cls} value={action.value} onChange={e => updateAction(i, { value: e.target.value })}>
                <option value="">— select priority —</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>;

        if (vt === 'tag')
            return <select className={cls} value={action.value} onChange={e => updateAction(i, { value: e.target.value })}>
                <option value="">— select tag —</option>
                {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>;

        return <textarea className={cls} rows={2} value={action.value} onChange={e => updateAction(i, { value: e.target.value })} placeholder="message or note…" />;
    };

    return (
        <AppLayout title={isEdit ? 'Edit Automation Rule' : 'New Automation Rule'}>
            <div className="max-w-3xl mx-auto py-6 px-4">
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/admin/automations" className="text-sm text-gray-500 hover:text-gray-700">← Automation Rules</Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Rule' : 'New Rule'}</h1>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Rule Details */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-lg p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Rule Details</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                className="border rounded px-3 py-2 text-sm w-full"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Auto-assign billing tickets"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="border rounded px-3 py-2 text-sm w-full"
                                rows={2}
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Event *</label>
                                <select
                                    className="border rounded px-3 py-2 text-sm w-full"
                                    value={data.event}
                                    onChange={e => setData('event', e.target.value)}
                                >
                                    {EVENTS.map(ev => <option key={ev.value} value={ev.value}>{ev.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
                                <select
                                    className="border rounded px-3 py-2 text-sm w-full"
                                    value={data.match_type}
                                    onChange={e => setData('match_type', e.target.value as 'all' | 'any')}
                                >
                                    <option value="all">All conditions (AND)</option>
                                    <option value="any">Any condition (OR)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="rounded"
                                />
                                Active (rule will run)
                            </label>
                        </div>
                    </div>

                    {/* Conditions */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Conditions
                                <span className="ml-1 text-gray-400 font-normal normal-case">(optional — leave empty to match all tickets)</span>
                            </h2>
                            <button
                                type="button"
                                onClick={addCondition}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                            >
                                <PlusIcon className="w-3.5 h-3.5" /> Add condition
                            </button>
                        </div>

                        <div className="space-y-2">
                            {data.conditions.map((cond, i) => {
                                const meta = fieldMeta(cond.field);
                                return (
                                    <div key={i} className="flex items-start gap-2">
                                        <select
                                            className="border rounded px-2 py-1 text-sm w-36 shrink-0"
                                            value={cond.field}
                                            onChange={e => {
                                                const newMeta = fieldMeta(e.target.value);
                                                updateCondition(i, { field: e.target.value, operator: newMeta?.operators[0] ?? 'equals', value: '' });
                                            }}
                                        >
                                            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                        </select>

                                        <select
                                            className="border rounded px-2 py-1 text-sm w-36 shrink-0"
                                            value={cond.operator}
                                            onChange={e => updateCondition(i, { operator: e.target.value, value: '' })}
                                        >
                                            {(meta?.operators ?? ['equals']).map(op =>
                                                <option key={op} value={op}>{OPERATOR_LABELS[op] ?? op}</option>
                                            )}
                                        </select>

                                        <div className="flex-1">
                                            {renderConditionValue(cond, i)}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeCondition(i)}
                                            className="text-gray-300 hover:text-red-500 mt-1 shrink-0"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions *</h2>
                            <button
                                type="button"
                                onClick={addAction}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                            >
                                <PlusIcon className="w-3.5 h-3.5" /> Add action
                            </button>
                        </div>
                        {errors.actions && <p className="text-red-500 text-xs mb-2">{errors.actions}</p>}

                        <div className="space-y-2">
                            {data.actions.map((action, i) => {
                                const meta = actionMeta(action.action_type);
                                return (
                                    <div key={i} className="flex items-start gap-2">
                                        <select
                                            className="border rounded px-2 py-1 text-sm w-52 shrink-0"
                                            value={action.action_type}
                                            onChange={e => updateAction(i, { action_type: e.target.value, value: '' })}
                                        >
                                            {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                        </select>

                                        <div className="flex-1">
                                            {renderActionValue(action, i)}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeAction(i)}
                                            className="text-gray-300 hover:text-red-500 mt-1 shrink-0"
                                            disabled={data.actions.length === 1}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link
                            href="/admin/automations"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : (isEdit ? 'Update Rule' : 'Create Rule')}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
