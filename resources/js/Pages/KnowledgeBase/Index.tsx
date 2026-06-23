import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FolderOpenIcon, DocumentTextIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import PublicLayout from '@/Layouts/PublicLayout';
import AppLayout from '@/Layouts/AppLayout';
import type { SharedProps } from '@/types';

interface KbCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    published_article_count: number;
    children: KbCategory[];
}

interface KbArticle {
    id: number;
    knowledge_category_id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    helpful_count: number;
    not_helpful_count: number;
    published_at: string;
    category: { id: number; name: string; slug: string } | null;
}

interface Props {
    categories: KbCategory[];
    articles:   KbArticle[];
    query:      string;
}

function SearchBar({ initial }: { initial: string }) {
    const [value, setValue] = useState(initial);

    useEffect(() => { setValue(initial); }, [initial]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.get('/kb', value.trim() ? { q: value.trim() } : {}, { preserveState: false });
    }

    return (
        <form onSubmit={submit} className="relative max-w-xl mx-auto">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[--color-text-subtle]" />
            <input
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[--color-border] bg-[--color-card] text-[--color-text] placeholder:text-[--color-text-subtle] focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-sm"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => { setValue(''); router.get('/kb', {}, { preserveState: false }); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-subtle] hover:text-[--color-text] text-lg leading-none"
                >
                    ×
                </button>
            )}
        </form>
    );
}

function CategoryCard({ cat }: { cat: KbCategory }) {
    return (
        <a
            href={`/kb/category/${cat.slug}`}
            className="block bg-[--color-card] border border-[--color-border] rounded-xl p-5 hover:border-primary-400 hover:shadow-sm transition-all group"
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                    {cat.icon
                        ? <span className="text-lg">{cat.icon}</span>
                        : <FolderOpenIcon className="w-5 h-5 text-primary-600" />}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[--color-text] text-sm group-hover:text-primary-600 transition-colors">{cat.name}</h3>
                    {cat.description && (
                        <p className="mt-0.5 text-xs text-[--color-text-muted] line-clamp-2">{cat.description}</p>
                    )}
                    <p className="mt-2 text-xs text-[--color-text-subtle]">
                        {cat.published_article_count} {cat.published_article_count === 1 ? 'article' : 'articles'}
                    </p>
                </div>
            </div>
            {cat.children.length > 0 && (
                <ul className="mt-3 pt-3 border-t border-[--color-border] space-y-1">
                    {cat.children.slice(0, 4).map(child => (
                        <li key={child.id} className="flex justify-between items-center text-xs text-[--color-text-muted]">
                            <span className="truncate">{child.name}</span>
                            <span className="text-[--color-text-subtle] ml-2 flex-shrink-0">{child.published_article_count}</span>
                        </li>
                    ))}
                    {cat.children.length > 4 && (
                        <li className="text-xs text-[--color-text-subtle]">+{cat.children.length - 4} more</li>
                    )}
                </ul>
            )}
        </a>
    );
}

function ArticleRow({ article }: { article: KbArticle }) {
    const total = article.helpful_count + article.not_helpful_count;
    const helpfulPct = total > 0 ? Math.round((article.helpful_count / total) * 100) : null;

    return (
        <a
            href={`/kb/articles/${article.slug}`}
            className="block bg-[--color-card] border border-[--color-border] rounded-xl p-4 hover:border-primary-400 hover:shadow-sm transition-all group"
        >
            <div className="flex items-start gap-3">
                <DocumentTextIcon className="w-5 h-5 text-[--color-text-subtle] flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-[--color-text] group-hover:text-primary-600 transition-colors">{article.title}</h3>
                    {article.excerpt && (
                        <p className="mt-1 text-xs text-[--color-text-muted] line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                        {article.category && (
                            <span className="text-xs text-[--color-text-subtle] bg-[--color-bg] px-2 py-0.5 rounded-full border border-[--color-border]">
                                {article.category.name}
                            </span>
                        )}
                        {helpfulPct !== null && (
                            <span className="flex items-center gap-1 text-xs text-[--color-text-subtle]">
                                <HandThumbUpIcon className="w-3 h-3" />
                                {helpfulPct}% helpful
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </a>
    );
}

export default function KnowledgeBaseIndex({ categories, articles, query }: Props) {
    const { props } = usePage<SharedProps>();
    const isAuthenticated = props.auth.user !== null;

    const content = (
        <>
            <Head title="Help Center" />

            {/* Hero */}
            <div className="bg-gradient-to-b from-primary-600 to-primary-700 text-white py-12 px-4">
                <div className="max-w-5xl mx-auto text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">How can we help?</h1>
                    <p className="text-primary-100 text-sm mb-6">Search our knowledge base or browse categories below.</p>
                    <SearchBar initial={query} />
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Search results */}
                {query !== '' && (
                    <>
                        <p className="text-sm text-[--color-text-muted] mb-4">
                            {articles.length === 0
                                ? <>No articles found for <strong>"{query}"</strong>.</>
                                : <>{articles.length} result{articles.length !== 1 ? 's' : ''} for <strong>"{query}"</strong></>}
                        </p>
                        {articles.length > 0 && (
                            <div className="space-y-3">
                                {articles.map(a => <ArticleRow key={a.id} article={a} />)}
                            </div>
                        )}
                        {articles.length === 0 && (
                            <div className="text-center py-12 text-[--color-text-subtle]">
                                <MagnifyingGlassIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">Try different keywords or browse categories below.</p>
                                <button
                                    onClick={() => router.get('/kb', {}, { preserveState: false })}
                                    className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    View all categories →
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Category grid */}
                {query === '' && (
                    <>
                        {categories.length === 0 ? (
                            <div className="text-center py-16 text-[--color-text-subtle]">
                                <FolderOpenIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">No categories have been published yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );

    if (isAuthenticated) {
        return <AppLayout title="Help Center">{content}</AppLayout>;
    }

    return <PublicLayout title="Help Center">{content}</PublicLayout>;
}
