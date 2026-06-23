import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { PlusIcon, PencilSquareIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import AppLayout from '@/Layouts/AppLayout';

interface Category { id: number; name: string; }

interface Article {
    id:            number;
    title:         string;
    slug:          string;
    status:        'draft' | 'published';
    is_public:     boolean;
    view_count:    number;
    helpful_count: number;
    published_at:  string | null;
    updated_at:    string;
    category:      Category | null;
    author:        { id: number; name: string } | null;
    can_edit:      boolean;
    can_delete:    boolean;
}

interface Props {
    articles:   Article[];
    categories: Category[];
}

const STATUS_CLS: Record<string, string> = {
    draft:     'bg-warning-100 text-warning-700',
    published: 'bg-success-100 text-success-700',
};

export default function KnowledgeArticlesIndex({ articles, categories }: Props) {
    const [search, setSearch]     = useState('');
    const [catFilter, setCatFilter] = useState('');

    const filtered = articles.filter(a => {
        const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
        const matchCat    = !catFilter || String(a.category?.id) === catFilter;
        return matchSearch && matchCat;
    });

    function destroy(article: Article) {
        if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
        router.delete(route('admin.kb.articles.destroy', article.id));
    }

    return (
        <AppLayout title="Knowledge Base Articles">
            <Head title="Knowledge Base Articles" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-[--color-text]">Knowledge Base Articles</h1>
                        <p className="text-sm text-[--color-text-muted] mt-0.5">{articles.length} total articles</p>
                    </div>
                    <Link
                        href={route('admin.kb.articles.create')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New Article
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search articles…"
                        className="h-9 rounded-md border border-[--color-border] bg-[--color-card] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
                    />
                    <select
                        value={catFilter}
                        onChange={e => setCatFilter(e.target.value)}
                        className="h-9 rounded-md border border-[--color-border] bg-[--color-card] px-3 text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-[--color-card] border border-[--color-border] rounded-xl overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center text-sm text-[--color-text-subtle]">No articles found.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-[--color-border] bg-[--color-bg]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-[--color-text-muted]">Title</th>
                                    <th className="text-left px-4 py-3 font-medium text-[--color-text-muted] hidden md:table-cell">Category</th>
                                    <th className="text-left px-4 py-3 font-medium text-[--color-text-muted]">Status</th>
                                    <th className="text-right px-4 py-3 font-medium text-[--color-text-muted] hidden lg:table-cell">Views</th>
                                    <th className="text-right px-4 py-3 font-medium text-[--color-text-muted] hidden lg:table-cell">👍</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-border]">
                                {filtered.map(a => (
                                    <tr key={a.id} className="hover:bg-[--color-bg] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[--color-text] line-clamp-1">{a.title}</div>
                                            <div className="text-xs text-[--color-text-subtle] mt-0.5">/kb/articles/{a.slug}</div>
                                        </td>
                                        <td className="px-4 py-3 text-[--color-text-muted] hidden md:table-cell">
                                            {a.category?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[a.status]}`}>
                                                {a.status}
                                            </span>
                                            {!a.is_public && (
                                                <span className="ml-1 text-xs text-[--color-text-subtle]">🔒</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-[--color-text-muted] hidden lg:table-cell">{a.view_count.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-[--color-text-muted] hidden lg:table-cell">{a.helpful_count}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={`/kb/articles/${a.slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 rounded-md text-[--color-text-subtle] hover:text-[--color-text] hover:bg-[--color-border] transition-colors"
                                                    title="View public page"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </a>
                                                {a.can_edit && (
                                                    <Link
                                                        href={route('admin.kb.articles.edit', a.id)}
                                                        className="p-1.5 rounded-md text-[--color-text-subtle] hover:text-[--color-text] hover:bg-[--color-border] transition-colors"
                                                    >
                                                        <PencilSquareIcon className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                {a.can_delete && (
                                                    <button
                                                        onClick={() => destroy(a)}
                                                        className="p-1.5 rounded-md text-[--color-text-subtle] hover:text-danger-600 hover:bg-danger-50 transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
