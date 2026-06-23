import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ArticleForm from './Form';

interface Category { id: number; name: string; }

interface Article {
    id:                     number;
    knowledge_category_id:  number;
    title:                  string;
    slug:                   string;
    excerpt:                string | null;
    content:                string;
    status:                 'draft' | 'published';
    is_public:              boolean;
}

interface Props {
    article:    Article;
    categories: Category[];
}

export default function EditKnowledgeArticle({ article, categories }: Props) {
    return (
        <AppLayout title={`Edit: ${article.title}`}>
            <Head title={`Edit: ${article.title}`} />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="flex items-center gap-2 text-sm text-[--color-text-subtle]">
                    <Link href={route('admin.kb.articles.index')} className="hover:text-primary-600 transition-colors">
                        Knowledge Base
                    </Link>
                    <span>›</span>
                    <span className="text-[--color-text] truncate max-w-xs">{article.title}</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-[--color-text]">Edit Article</h1>
                    <p className="text-sm text-[--color-text-muted] mt-0.5 truncate">{article.title}</p>
                </div>

                <ArticleForm
                    categories={categories}
                    initial={{
                        knowledge_category_id: article.knowledge_category_id,
                        title:     article.title,
                        slug:      article.slug,
                        excerpt:   article.excerpt ?? '',
                        content:   article.content,
                        status:    article.status,
                        is_public: article.is_public,
                    }}
                    submitRoute={route('admin.kb.articles.update', article.id)}
                    method="put"
                    submitLabel="Save Changes"
                    cancelRoute={route('admin.kb.articles.index')}
                />
            </div>
        </AppLayout>
    );
}
