import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/Components/UI';

interface Template {
    id: number;
    name: string;
    description: string | null;
    subject: string | null;
    priority: string | null;
    is_active: boolean;
    category: { id: number; name: string } | null;
    creator: { id: number; name: string } | null;
    tag_ids: number[] | null;
}

interface Props { templates: Template[]; }

const PRIORITY_COLORS: Record<string, string> = {
    critical: 'text-danger-700 bg-danger-50',
    high:     'text-warning-700 bg-warning-50',
    medium:   'text-primary-700 bg-primary-50',
    low:      'text-[--color-text-muted] bg-[--color-bg]',
};

export default function TemplatesIndex({ templates }: Props) {
    const handleDelete = (t: Template) => {
        if (!confirm(`Delete template "${t.name}"?`)) return;
        router.delete(`/admin/templates/${t.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Ticket Templates" />
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-[--color-text]">Ticket Templates</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">Pre-fill ticket fields when creating new tickets.</p>
                    </div>
                    <Link href="/admin/templates/create"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                        <PlusIcon className="w-4 h-4" />New Template
                    </Link>
                </div>

                {templates.length === 0 ? (
                    <div className="text-center py-16 text-[--color-text-muted] text-sm">No templates yet. <Link href="/admin/templates/create" className="text-primary-600 hover:underline">Create one.</Link></div>
                ) : (
                    <div className="space-y-2">
                        {templates.map(t => (
                            <div key={t.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[--color-border] group">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-[--color-text]">{t.name}</span>
                                        {!t.is_active && <span className="px-1.5 py-0.5 text-[10px] bg-[--color-bg] text-[--color-text-muted] rounded">INACTIVE</span>}
                                        {t.priority && (
                                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded capitalize ${PRIORITY_COLORS[t.priority] ?? ''}`}>{t.priority}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[--color-text-muted]">
                                        {t.category && <span>Category: {t.category.name}</span>}
                                        {t.subject && <><span>·</span><span className="truncate">Subject: {t.subject}</span></>}
                                        {t.description && <><span>·</span><span className="truncate">{t.description}</span></>}
                                        {t.creator && <><span>·</span><span>by {t.creator.name}</span></>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/templates/${t.id}/edit`}
                                        className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-[--color-bg] transition-colors">
                                        <PencilIcon className="w-4 h-4" />
                                    </Link>
                                    <button onClick={() => handleDelete(t)}
                                        className="p-1.5 rounded-lg text-[--color-text-muted] hover:bg-danger-50 hover:text-danger-600 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
