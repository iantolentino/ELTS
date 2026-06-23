<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KnowledgeArticle;
use Illuminate\Support\Collection;

class KnowledgeSearchService
{
    /**
     * Search published articles using FULLTEXT MATCH/AGAINST with a LIKE fallback
     * for queries shorter than 3 characters (below MySQL's minimum word length).
     *
     * @param  bool  $publicOnly  When true, restricts to is_public=true articles.
     */
    public function search(string $query, int $limit = 20, bool $publicOnly = true): Collection
    {
        $query = trim($query);

        if ($query === '') {
            return collect();
        }

        $base = KnowledgeArticle::query()
            ->where('status', 'published')
            ->where('published_at', '<=', now())
            ->when($publicOnly, fn ($q) => $q->where('is_public', true))
            ->with('category:id,name,slug');

        // FULLTEXT prefix search (Boolean Mode with trailing wildcard)
        if (mb_strlen($query) >= 3) {
            $safeQuery = $this->booleanQuery($query);

            $results = (clone $base)
                ->selectRaw(
                    'id, knowledge_category_id, title, slug, excerpt, helpful_count, not_helpful_count, published_at, '
                    . 'MATCH(title, content) AGAINST(? IN BOOLEAN MODE) AS relevance',
                    [$safeQuery]
                )
                ->whereRaw('MATCH(title, content) AGAINST(? IN BOOLEAN MODE)', [$safeQuery])
                ->orderByDesc('relevance')
                ->limit($limit)
                ->get();

            if ($results->isNotEmpty()) {
                return $results;
            }
        }

        // Fallback: LIKE search on title and excerpt
        return (clone $base)
            ->where(fn ($q) => $q
                ->where('title', 'like', "%{$query}%")
                ->orWhere('excerpt', 'like', "%{$query}%"))
            ->orderByDesc('helpful_count')
            ->limit($limit)
            ->get(['id', 'knowledge_category_id', 'title', 'slug', 'excerpt', 'helpful_count', 'not_helpful_count', 'published_at']);
    }

    /**
     * Lightweight title-only search for typeahead suggestions.
     * Skips full content scan — title LIKE is fast enough for autocomplete at small scale.
     */
    public function suggest(string $query, int $limit = 8): Collection
    {
        $query = trim($query);

        if ($query === '') {
            return collect();
        }

        return KnowledgeArticle::query()
            ->where('status', 'published')
            ->where('is_public', true)
            ->where('published_at', '<=', now())
            ->where('title', 'like', "%{$query}%")
            ->with('category:id,name')
            ->orderByDesc('helpful_count')
            ->limit($limit)
            ->get(['id', 'knowledge_category_id', 'title', 'slug', 'excerpt']);
    }

    /**
     * Sanitise a user query into Boolean Mode syntax:
     * strips MySQL special operators, then appends wildcard to each word.
     */
    private function booleanQuery(string $query): string
    {
        $stripped = preg_replace('/[+\-><()~*"@]+/', ' ', $query);
        $words    = array_filter(explode(' ', $stripped ?? ''));

        return implode(' ', array_map(fn ($w) => '+' . $w . '*', $words));
    }
}
