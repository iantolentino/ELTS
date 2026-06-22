<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\SlaPolicy;
use App\Models\SlaRecord;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

class SlaRecordFactory extends Factory
{
    protected $model = SlaRecord::class;

    public function definition(): array
    {
        return [
            'ticket_id'               => Ticket::factory(),
            'sla_policy_id'           => SlaPolicy::factory(),
            'first_response_due'      => now()->addHours(4),
            'resolution_due'          => now()->addHours(8),
            'first_response_breached' => false,
            'resolution_breached'     => false,
            'paused_minutes'          => 0,
        ];
    }

    public function overdue(): static
    {
        return $this->state([
            'first_response_due' => now()->subHours(2),
            'resolution_due'     => now()->subHour(),
        ]);
    }

    public function met(): static
    {
        return $this->state([
            'first_response_met_at' => now()->subMinutes(30),
            'resolution_met_at'     => now()->subMinutes(10),
        ]);
    }
}
