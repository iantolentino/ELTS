import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import TiptapEditor from '@/Components/editor/TiptapEditor';

interface Category { id: number; name: string; }

interface ArticleFormData {
    knowledge_category_id: number | '';
    title:     string;
    slug:      string;
    excerpt:   string;
    content:   string;
    status:    'draft' | 'published';
    is_public: boolean;
}

interface Props {
    categories:   Category[];
    initial?:     Partial<ArticleFormData>;
    submitRoute:  string;
    method:       'post' | 'put';
    submitLabel:  string;
    cancelRoute:  string;
}

const INPUT_CLS = 'w-full h-9 rounded-md border border-[--color-border] bg-[--color-bg] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500';

function slugify(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ArticleForm({ categories, initial, submitRoute, method, submitLabel, cancelRoute }: Props) {
    const { data, setData, submit, processing, errors } = useForm<ArticleFormData>({
        knowledge_category_id: initial?.knowledge_category_id ?? '',
        title:     initial?.title     ?? '',
        slug:      initial?.slug      ?? '',
        excerpt:   initial?.excerpt   ?? '',
        content:   initial?.content   ?? '',
        status:    initial?.status    ?? 'draft',
        is_public: initial?.is_public ?? true,
    });

    useEffect(() => {
        if (!initial?.slug && data.title) {
            setData('slug', slugify(data.title));
        }
    }, [data.title]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        submit(method, submitRoute);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — content */}
                <div className="lg:col-span-2 space-y-5">
                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Title <span className="text-danger-500">*</span></label>
                        <input
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            className={INPUT_CLS}
                            placeholder="Article title"
                        />
                        {errors.title && <p className="mt-1 text-xs text-danger-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Slug <span className="text-danger-500">*</span></label>
                        <input
                            value={data.slug}
                            onChange={e => setData('slug', slugify(e.target.value))}
                            className={INPUT_CLS}
                            placeholder="url-friendly-slug"
                        />
                        {errors.slug && <p className="mt-1 text-xs text-danger-500">{errors.slug}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Excerpt</label>
                        <textarea
                            value={data.excerpt}
                            onChange={e => setData('excerpt', e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-[--color-border] bg-[--color-bg] px-3 py-2 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="Short summary shown in search results (optional)"
                        />
                        {errors.excerpt && <p className="mt-1 text-xs text-danger-500">{errors.excerpt}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Content <span className="text-danger-500">*</span></label>
                        <TiptapEditor
                            content={data.content}
                            onChange={html => setData('content', html)}
                            placeholder="Write the article content…"
                            minHeight={300}
                        />
                        {errors.content && <p className="mt-1 text-xs text-danger-500">{errors.content}</p>}
                    </div>
                </div>

                {/* Right — settings panel */}
                <div className="space-y-5">
                    <div className="bg-[--color-card] border border-[--color-border] rounded-xl p-4 space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-subtle]">Settings</h3>

                        <div>
                            <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Category <span className="text-danger-500">*</span></label>
                            <select
                                value={data.knowledge_category_id}
                                onChange={e => setData('knowledge_category_id', Number(e.target.value) || '')}
                                className={INPUT_CLS}
                            >
                                <option value="">Select category…</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.knowledge_category_id && <p className="mt-1 text-xs text-danger-500">{errors.knowledge_category_id}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[--color-text-muted] mb-1">Status</label>
                            <select
                                value={data.status}
                                onChange={e => setData('status', e.target.value as 'draft' | 'published')}
                                className={INPUT_CLS}
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                            </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_public}
                                    onChange={e => setData('is_public', e.target.checked)}
                                    className="w-4 h-4 rounded border-[--color-border] text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-[--color-text]">Visible to public (no login required)</span>
                            </label>
                            <p className="mt-1 text-xs text-[--color-text-subtle] ml-6">Uncheck to restrict to logged-in users only.</p>
                        </div>
                    </div>

                    {data.status === 'draft' && (
                        <div className="flex items-center gap-1.5 text-xs text-[--color-text-subtle] px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning-400 flex-shrink-0" />
                            Draft — not visible on the public Help Center.
                        </div>
                    )}
                    {data.status === 'published' && (
                        <div className="flex items-center gap-1.5 text-xs text-success-600 px-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-success-500 flex-shrink-0" />
                            Published — visible on the Help Center.
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[--color-border]">
                <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                    {processing ? 'Saving…' : submitLabel}
                </button>
                <a href={cancelRoute} className="px-4 py-2 text-sm text-[--color-text-muted] hover:text-[--color-text] transition-colors">
                    Cancel
                </a>
            </div>
        </form>
    );
}
