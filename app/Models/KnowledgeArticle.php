<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KnowledgeArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'knowledge_category_id',
        'author_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'status',
        'is_public',
        'view_count',
        'helpful_count',
        'not_helpful_count',
        'published_at',
    ];

    protected $casts = [
        'is_public'    => 'boolean',
        'view_count'   => 'integer',
        'helpful_count'     => 'integer',
        'not_helpful_count' => 'integer',
        'published_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(KnowledgeCategory::class, 'knowledge_category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at?->isPast();
    }
}
