import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, Badge } from '@/Components/UI';
import TiptapEditor from '@/Components/editor/TiptapEditor';
import {
    PencilSquareIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface Template {
    event_name: string;
    label: string;
    subject: string | null;
    body: string | null;
    is_active: boolean;
    is_custom: boolean;
}

interface Props {
    templates: Template[];
    variables: string[];
}

function TemplateEditor({
    template,
    variables,
    onClose,
}: {
    template: Template;
    variables: string[];
    onClose: () => void;
}) {
    const [subject, setSubject] = useState(template.subject ?? '');
    const [body, setBody]       = useState(template.body ?? '');
    const [isActive, setIsActive] = useState(template.is_active);
    const [saving, setSaving]   = useState(false);

    const save = () => {
        setSaving(true);
        router.put(`/admin/email-templates/${template.event_name}`, {
            event_name: template.event_name,
            subject:    subject || null,
            body:       body || null,
            is_active:  isActive,
        }, {
            onSuccess: () => { setSaving(false); onClose(); },
            onError:   () => setSaving(false),
        });
    };

    return (
        <div className="border-t border-gray-100 p-5 space-y-4">
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject (leave blank for default)</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        placeholder="System default subject will be used"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id={`active-${template.event_name}`} checked={isActive}
                        onChange={e => setIsActive(e.target.checked)} className="rounded" />
                    <label htmlFor={`active-${template.event_name}`} className="text-sm text-gray-700">Active</label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body (leave blank to use Blade template)</label>
                <TiptapEditor
                    content={body}
                    onChange={html => setBody(html === '<p></p>' ? '' : html)}
                    placeholder="Leave blank to use system default template…"
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1.5">Available variables:</p>
                <div className="flex flex-wrap gap-1.5">
                    {variables.map(v => (
                        <code key={v} className="text-xs bg-white border border-blue-200 rounded px-1.5 py-0.5 text-blue-700 cursor-pointer"
                            onClick={() => navigator.clipboard.writeText(v)}>
                            {v}
                        </code>
                    ))}
                </div>
                <p className="text-xs text-blue-500 mt-1.5">Click a variable to copy. Paste in subject or body.</p>
            </div>

            <div className="flex gap-2">
                <Button onClick={save} disabled={saving}>Save Template</Button>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
        </div>
    );
}

export default function EmailTemplatesIndex({ templates, variables }: Props) {
    const [editEvent, setEditEvent] = useState<string | null>(null);

    return (
        <AppLayout title="Email Templates">
            <div className="max-w-3xl mx-auto py-8 px-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Customise email subjects and bodies. Leave blank to use the system default Blade template.
                    </p>
                </div>

                <div className="space-y-3">
                    {templates.map(tpl => (
                        <div key={tpl.event_name} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{tpl.label}</span>
                                        {tpl.is_custom
                                            ? <Badge variant="primary">Custom</Badge>
                                            : <Badge variant="default">System default</Badge>
                                        }
                                        {tpl.is_custom && !tpl.is_active && (
                                            <Badge variant="warning">Inactive</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{tpl.event_name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {tpl.is_custom && (
                                        <button
                                            onClick={() => confirm('Remove custom template? The system default will be used.') &&
                                                router.delete(`/admin/email-templates/${tpl.event_name}`)}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded-md"
                                            title="Remove custom template"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditEvent(editEvent === tpl.event_name ? null : tpl.event_name)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-md flex items-center gap-1 text-sm"
                                    >
                                        <PencilSquareIcon className="w-4 h-4" />
                                        {editEvent === tpl.event_name
                                            ? <ChevronUpIcon className="w-3 h-3" />
                                            : <ChevronDownIcon className="w-3 h-3" />
                                        }
                                    </button>
                                </div>
                            </div>
                            {editEvent === tpl.event_name && (
                                <TemplateEditor
                                    template={tpl}
                                    variables={variables}
                                    onClose={() => setEditEvent(null)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
