<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TicketStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TicketFactory extends Factory
{
    public function definition(): array
    {
        static $seq = 0;
        $seq++;

        return [
            'ticket_number' => 'TKT-' . str_pad((string) $seq, 5, '0', STR_PAD_LEFT),
            'subject'       => $this->faker->sentence(5),
            'description'   => '<p>' . $this->faker->paragraph() . '</p>',
            'status_id'     => TicketStatus::factory(),
            'priority'      => $this->faker->randomElement(['low', 'medium', 'high', 'critical']),
            'requester_id'  => User::factory(),
            'source'        => 'web',
            'is_vip'        => false,
        ];
    }

    public function withRequester(User $user): static
    {
        return $this->state(['requester_id' => $user->id]);
    }

    public function withStatus(TicketStatus $status): static
    {
        return $this->state(['status_id' => $status->id]);
    }
}
