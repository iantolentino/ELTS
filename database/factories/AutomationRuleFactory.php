<?php

namespace Database\Factories;

use App\Models\AutomationRule;
use Illuminate\Database\Eloquent\Factories\Factory;

class AutomationRuleFactory extends Factory
{
    protected $model = AutomationRule::class;

    public function definition(): array
    {
        return [
            'name'        => $this->faker->sentence(4),
            'description' => null,
            'event'       => 'ticket_created',
            'match_type'  => 'all',
            'is_active'   => true,
            'sort_order'  => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function forEvent(string $event): static
    {
        return $this->state(['event' => $event]);
    }

    public function matchAny(): static
    {
        return $this->state(['match_type' => 'any']);
    }
}
