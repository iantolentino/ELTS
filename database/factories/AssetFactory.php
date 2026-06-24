<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AssetFactory extends Factory
{
    public function definition(): array
    {
        $types = ['laptop', 'desktop', 'monitor', 'phone', 'tablet', 'printer', 'keyboard', 'mouse', 'headset', 'server'];
        $makes = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'LG', 'Logitech', 'Microsoft'];
        $type  = $this->faker->randomElement($types);

        return [
            'name'               => ucfirst($type) . ' ' . $this->faker->bothify('??-###'),
            'asset_tag'          => 'ASSET-' . $this->faker->unique()->numerify('#####'),
            'type'               => $type,
            'status'             => 'in_use',
            'serial_number'      => strtoupper($this->faker->unique()->bothify('??####??####')),
            'make'               => $this->faker->randomElement($makes),
            'model'              => $this->faker->bothify('Model-??###'),
            'purchase_date'      => $this->faker->dateTimeBetween('-3 years', '-6 months')->format('Y-m-d'),
            'purchase_price'     => $this->faker->randomFloat(2, 100, 3000),
            'warranty_expires_at'=> $this->faker->dateTimeBetween('+1 month', '+3 years')->format('Y-m-d'),
            'location'           => $this->faker->randomElement(['HQ Floor 1', 'HQ Floor 2', 'Remote', 'Storage']),
            'notes'              => null,
            'assigned_to'        => null,
            'created_by'         => null,
        ];
    }

    public function inUse(): static
    {
        return $this->state(['status' => 'in_use']);
    }

    public function purchased(): static
    {
        return $this->state(['status' => 'purchased']);
    }

    public function maintenance(): static
    {
        return $this->state(['status' => 'maintenance']);
    }

    public function retired(): static
    {
        return $this->state(['status' => 'retired', 'assigned_to' => null]);
    }
}
