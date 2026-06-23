<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<KnowledgeArticle>
 */
class KnowledgeArticleFactory extends Factory
{
    protected $model = KnowledgeArticle::class;

    public function definition(): array
    {
        $title = $this->faker->unique()->sentence(6);

        return [
            'knowledge_category_id' => KnowledgeCategory::factory(),
            'author_id'             => null,
            'title'                 => rtrim($title, '.'),
            'slug'                  => Str::slug(rtrim($title, '.')),
            'excerpt'               => $this->faker->optional()->paragraph(),
            'content'               => implode("\n\n", $this->faker->paragraphs(4)),
            'status'                => 'draft',
            'is_public'             => true,
            'view_count'            => 0,
            'helpful_count'         => 0,
            'not_helpful_count'     => 0,
            'published_at'          => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status'       => 'published',
            'published_at' => now()->subHour(),
        ]);
    }

    public function private(): static
    {
        return $this->state(fn () => ['is_public' => false]);
    }
}
