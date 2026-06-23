import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    ChevronRightIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    DocumentTextIcon,
    EyeIcon,
    CalendarIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import {
    HandThumbUpIcon as HandThumbUpSolid,
    HandThumbDownIcon as HandThumbDownSolid,
} from '@heroicons/react/24/solid';
import PublicLayout from '@/Layouts/PublicLayout';
import AppLayout from '@/Layouts/AppLayout';
import type { SharedProps } from '@/types';

interface KbCategory {
    id:   number;
    name: string;
    slug: string;
}

interface KbAuthor {
    id:   number;
    name: string;
}

interface KbArticle {
    id:                number;
    title:             string;
    slug:              string;
    excerpt:           string | null;
    content:           string;
    view_count:        number;
    helpful_count:     number;
    not_helpful_count: number;
    published_at:      string;
    category:          KbCategory | null;
    author:            KbAuthor | null;
}

interface RelatedArticle {
    id:      number;
    title:   string;
    slug:    string;
    excerpt: string | null;
}

interface Props {
    article:   KbArticle;
    related:   RelatedArticle[];
    user_vote: 'helpful' | 'not_helpful' | null;
}

type Vote = 'helpful' | 'not_helpful' | null;

function FeedbackSection({ article, initialVote }: { article: KbArticle; initialVote: Vote }) {
    const [voted, setVoted]           = useState<Vote>(initialVote);
    const [helpful, setHelpful]       = useState(article.helpful_count);
    const [notHelpful, setNotHelpful] = useState(article.not_helpful_count);
    const [loading, setLoading]       = useState(false);

    async function castVote(vote: 'helpful' | 'not_helpful') {
        if (voted || loading) return;
        setLoading(true);

        try {
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';
            const res  = await fetch(`/kb/articles/${article.slug}/feedback`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body:    JSON.stringify({ vote }),
            });

            if (res.ok || res.status === 409) {
                const data = await res.json();
                const recorded = data.vote as Vote;
                setVoted(recorded);
                // Only update counts if this is a fresh vote (not a 409 duplicate)
                if (res.ok) {
                    if (recorded === 'helpful') setHelpful(h => h + 1);
                    else setNotHelpful(n => n + 1);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    const total = helpful + notHelpful;
    const helpfulPct = total > 0 ? Math.round((helpful / total) * 100) : null;

    return (
        <div className="mt-10 pt-6 border-t border-[--color-border]">
            <p className="text-sm font-medium text-[--color-text] mb-3">Was this article helpful?</p>

            {voted ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-success-600 font-medium">
                        {voted === 'helpful' ? 'Thanks for your feedback!' : 'Thanks — we\'ll work on improving this.'}
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => castVote('helpful')}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[--color-border] text-sm text-[--color-text-muted] hover:border-success-400 hover:text-success-600 hover:bg-success-50 transition-colors disabled:opacity-50"
                    >
                        <HandThumbUpIcon className="w-4 h-4" />
                        Yes{helpful > 0 && <span className="ml-1 text-xs text-[--color-text-subtle]">({helpful})</span>}
                    </button>
                    <button
                        onClick={() => castVote('not_helpful')}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[--color-border] text-sm text-[--color-text-muted] hover:border-danger-400 hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                    >
                        <HandThumbDownIcon className="w-4 h-4" />
                        No{notHelpful > 0 && <span className="ml-1 text-xs text-[--color-text-subtle]">({notHelpful})</span>}
                    </button>
                </div>
            )}

            {helpfulPct !== null && !voted && (
                <p className="mt-2 text-xs text-[--color-text-subtle]">
                    {helpfulPct}% of {total} {total === 1 ? 'person' : 'people'} found this helpful
                </p>
            )}
        </div>
    );
}

export default function KnowledgeBaseShow({ article, related, user_vote }: Props) {
    const { props } = usePage<SharedProps>();
    const isAuthenticated = props.auth.user !== null;

    const publishedDate = new Date(article.published_at).toLocaleDateString('en-US', {
        year: 'month', month: 'long', day: 'numeric',
    });

    const content = (
        <>
            <Head title={article.title} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1 text-xs text-[--color-text-subtle] mb-6">
                    <Link href="/kb" className="hover:text-primary-600 transition-colors">Help Center</Link>
                    {article.category && (
                        <>
                            <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
                            <Link
                                href={`/kb/category/${article.category.slug}`}
                                className="hover:text-primary-600 transition-colors"
                            >
                                {article.category.name}
                            </Link>
                        </>
                    )}
                    <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="text-[--color-text-muted] truncate max-w-xs">{article.title}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main article */}
                    <article className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-[--color-text] leading-tight mb-4">
                            {article.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[--color-text-subtle] mb-6 pb-6 border-b border-[--color-border]">
                            {article.author && (
                                <span className="flex items-center gap-1">
                                    <UserIcon className="w-3.5 h-3.5" />
                                    {article.author.name}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                {publishedDate}
                            </span>
                            <span className="flex items-center gap-1">
                                <EyeIcon className="w-3.5 h-3.5" />
                                {article.view_count.toLocaleString()} {article.view_count === 1 ? 'view' : 'views'}
                            </span>
                        </div>

                        {/* Content */}
                        <div
                            className="prose prose-sm max-w-none text-[--color-text] prose-headings:text-[--color-text] prose-a:text-primary-600 prose-code:bg-[--color-bg] prose-code:px-1 prose-code:rounded prose-pre:bg-[--color-bg] prose-blockquote:border-primary-400"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        <FeedbackSection article={article} initialVote={user_vote} />
                    </article>

                    {/* Sidebar */}
                    {related.length > 0 && (
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="bg-[--color-card] border border-[--color-border] rounded-xl p-4 sticky top-20">
                                <h2 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-subtle] mb-3">
                                    Related Articles
                                </h2>
                                <ul className="space-y-3">
                                    {related.map(r => (
                                        <li key={r.id}>
                                            <Link
                                                href={`/kb/articles/${r.slug}`}
                                                className="flex items-start gap-2 group"
                                            >
                                                <DocumentTextIcon className="w-4 h-4 text-[--color-text-subtle] flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-[--color-text-muted] group-hover:text-primary-600 transition-colors line-clamp-2">
                                                    {r.title}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </>
    );

    if (isAuthenticated) {
        return <AppLayout title={article.title}>{content}</AppLayout>;
    }

    return <PublicLayout title="Help Center">{content}</PublicLayout>;
}
