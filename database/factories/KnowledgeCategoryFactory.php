<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\KnowledgeCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<KnowledgeCategory>
 */
class KnowledgeCategoryFactory extends Factory
{
    protected $model = KnowledgeCategory::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);

        return [
            'name'        => ucwords($name),
            'slug'        => Str::slug($name),
            'description' => $this->faker->optional()->sentence(),
            'icon'        => null,
            'parent_id'   => null,
            'sort_order'  => $this->faker->numberBetween(0, 99),
            'is_active'   => true,
            'created_by'  => null,
        ];
    }
}
