<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeCategory;
use App\Services\KnowledgeSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeBaseController extends Controller
{
    public function index(Request $request, KnowledgeSearchService $search): Response
    {
        $query = $request->string('q')->trim()->toString();

        if ($query !== '') {
            $articles = $search->search($query, limit: 30);

            return Inertia::render('KnowledgeBase/Index', [
                'categories' => [],
                'articles'   => $articles,
                'query'      => $query,
            ]);
        }

        $publishedScope = fn ($q) => $q
            ->where('status', 'published')
            ->where('is_public', true)
            ->where('published_at', '<=', now());

        $categories = KnowledgeCategory::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->withCount(['articles as published_article_count' => $publishedScope])
            ->with(['children' => fn ($q) => $q
                ->where('is_active', true)
                ->withCount(['articles as published_article_count' => $publishedScope])
                ->orderBy('sort_order'),
            ])
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'description', 'icon', 'sort_order']);

        return Inertia::render('KnowledgeBase/Index', [
            'categories' => $categories,
            'articles'   => [],
            'query'      => '',
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $article = KnowledgeArticle::query()
            ->where('slug', $slug)
            ->where('status', 'published')
            ->where('is_public', true)
            ->where('published_at', '<=', now())
            ->with('category:id,name,slug', 'author:id,name')
            ->firstOrFail();

        DB::table('knowledge_articles')->where('id', $article->id)->increment('view_count');

        $related = KnowledgeArticle::query()
            ->where('knowledge_category_id', $article->knowledge_category_id)
            ->where('id', '!=', $article->id)
            ->where('status', 'published')
            ->where('is_public', true)
            ->where('published_at', '<=', now())
            ->orderByDesc('helpful_count')
            ->limit(5)
            ->get(['id', 'title', 'slug', 'excerpt']);

        return Inertia::render('KnowledgeBase/Show', [
            'article'   => $article,
            'related'   => $related,
            'user_vote' => $request->session()->get("kb_vote_{$article->id}"),
        ]);
    }

    public function searchSuggest(Request $request, KnowledgeSearchService $search): JsonResponse
    {
        $query   = $request->string('q')->trim()->toString();
        $results = $search->suggest($query);

        return response()->json($results->map(fn ($a) => [
            'id'            => $a->id,
            'title'         => $a->title,
            'slug'          => $a->slug,
            'excerpt'       => $a->excerpt,
            'category_name' => $a->category?->name,
        ]));
    }

    public function feedback(Request $request, string $slug): JsonResponse
    {
        $article = KnowledgeArticle::where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $sessionKey = "kb_vote_{$article->id}";

        if ($request->session()->has($sessionKey)) {
            return response()->json([
                'success'    => false,
                'already_voted' => true,
                'vote'       => $request->session()->get($sessionKey),
            ], 409);
        }

        $vote = $request->string('vote')->toString();

        match ($vote) {
            'helpful'     => DB::table('knowledge_articles')->where('id', $article->id)->increment('helpful_count'),
            'not_helpful' => DB::table('knowledge_articles')->where('id', $article->id)->increment('not_helpful_count'),
            default       => abort(422, 'Invalid vote value.'),
        };

        $request->session()->put($sessionKey, $vote);

        return response()->json(['success' => true, 'vote' => $vote]);
    }
}
