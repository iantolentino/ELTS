import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import ArticleForm from './Form';

interface Category { id: number; name: string; }

interface Props {
    categories: Category[];
}

export default function CreateKnowledgeArticle({ categories }: Props) {
    return (
        <AppLayout title="New Article">
            <Head title="New Article" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                <div className="flex items-center gap-2 text-sm text-[--color-text-subtle]">
                    <Link href={route('admin.kb.articles.index')} className="hover:text-primary-600 transition-colors">
                        Knowledge Base
                    </Link>
                    <span>›</span>
                    <span className="text-[--color-text]">New Article</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-[--color-text]">New Article</h1>
                    <p className="text-sm text-[--color-text-muted] mt-0.5">Write and publish a help center article.</p>
                </div>

                <ArticleForm
                    categories={categories}
                    submitRoute={route('admin.kb.articles.store')}
                    method="post"
                    submitLabel="Create Article"
                    cancelRoute={route('admin.kb.articles.index')}
                />
            </div>
        </AppLayout>
    );
}
