<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TicketStatusFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'       => $this->faker->unique()->words(2, true) . ' status',
            'color'      => $this->faker->hexColor(),
            'sort_order' => $this->faker->numberBetween(0, 99),
            'is_default' => false,
            'is_closed'  => false,
        ];
    }

    public function default(): static
    {
        return $this->state(['is_default' => true]);
    }

    public function closed(): static
    {
        return $this->state(['is_closed' => true]);
    }
}
