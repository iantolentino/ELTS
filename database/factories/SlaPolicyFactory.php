<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SlaPolicy;
use Illuminate\Database\Eloquent\Factories\Factory;

class SlaPolicyFactory extends Factory
{
    protected $model = SlaPolicy::class;

    public function definition(): array
    {
        return [
            'name'                    => $this->faker->words(3, true),
            'description'             => null,
            'priority'                => null, // catch-all by default
            'first_response_minutes'  => 240,
            'resolution_minutes'      => 480,
            'uses_business_hours'     => false,
            'is_active'               => true,
        ];
    }

    public function forPriority(string $priority): static
    {
        return $this->state(['priority' => $priority]);
    }

    public function businessHours(): static
    {
        return $this->state(['uses_business_hours' => true]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
