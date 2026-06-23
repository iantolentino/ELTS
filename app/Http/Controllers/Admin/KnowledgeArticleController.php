<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\KnowledgeArticleRequest;
use App\Models\KnowledgeArticle;
use App\Models\KnowledgeCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeArticleController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', KnowledgeArticle::class);

        $articles = KnowledgeArticle::with('category:id,name', 'author:id,name')
            ->orderByDesc('updated_at')
            ->get(['id', 'knowledge_category_id', 'author_id', 'title', 'slug', 'status', 'is_public', 'view_count', 'helpful_count', 'published_at', 'updated_at'])
            ->map(fn (KnowledgeArticle $a) => [
                'id'           => $a->id,
                'title'        => $a->title,
                'slug'         => $a->slug,
                'status'       => $a->status,
                'is_public'    => $a->is_public,
                'view_count'   => $a->view_count,
                'helpful_count'=> $a->helpful_count,
                'published_at' => $a->published_at?->toDateString(),
                'updated_at'   => $a->updated_at->toDateString(),
                'category'     => $a->category ? ['id' => $a->category->id, 'name' => $a->category->name] : null,
                'author'       => $a->author   ? ['id' => $a->author->id,   'name' => $a->author->name]   : null,
                'can_edit'     => Gate::allows('update', KnowledgeArticle::class),
                'can_delete'   => Gate::allows('delete', KnowledgeArticle::class),
            ]);

        return Inertia::render('Admin/KnowledgeBase/Articles/Index', [
            'articles'   => $articles,
            'categories' => KnowledgeCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', KnowledgeArticle::class);

        return Inertia::render('Admin/KnowledgeBase/Articles/Create', [
            'categories' => KnowledgeCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(KnowledgeArticleRequest $request): RedirectResponse
    {
        Gate::authorize('create', KnowledgeArticle::class);

        $data = $request->validated();

        KnowledgeArticle::create([
            'knowledge_category_id' => $data['knowledge_category_id'],
            'author_id'             => Auth::id(),
            'title'                 => $data['title'],
            'slug'                  => $data['slug'],
            'excerpt'               => $data['excerpt'] ?? null,
            'content'               => $data['content'],
            'status'                => $data['status'],
            'is_public'             => $data['is_public'] ?? true,
            'published_at'          => $data['status'] === 'published' ? now() : null,
        ]);

        return redirect()->route('admin.kb.articles.index')
            ->with('success', 'Article created.');
    }

    public function edit(KnowledgeArticle $knowledgeArticle): Response
    {
        Gate::authorize('update', KnowledgeArticle::class);

        return Inertia::render('Admin/KnowledgeBase/Articles/Edit', [
            'article'    => $knowledgeArticle,
            'categories' => KnowledgeCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(KnowledgeArticleRequest $request, KnowledgeArticle $knowledgeArticle): RedirectResponse
    {
        Gate::authorize('update', KnowledgeArticle::class);

        $data = $request->validated();

        $wasPublished = $knowledgeArticle->status === 'published';
        $nowPublished = $data['status'] === 'published';

        $knowledgeArticle->update([
            'knowledge_category_id' => $data['knowledge_category_id'],
            'title'                 => $data['title'],
            'slug'                  => $data['slug'],
            'excerpt'               => $data['excerpt'] ?? null,
            'content'               => $data['content'],
            'status'                => $data['status'],
            'is_public'             => $data['is_public'] ?? true,
            'published_at'          => match (true) {
                $nowPublished && !$wasPublished => now(),
                !$nowPublished                  => null,
                default                         => $knowledgeArticle->published_at,
            },
        ]);

        return redirect()->route('admin.kb.articles.index')
            ->with('success', 'Article updated.');
    }

    public function destroy(KnowledgeArticle $knowledgeArticle): RedirectResponse
    {
        Gate::authorize('delete', KnowledgeArticle::class);

        $knowledgeArticle->delete();

        return back()->with('success', 'Article deleted.');
    }
}
