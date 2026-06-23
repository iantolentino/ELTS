<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CsatSurvey;
use App\Models\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CsatSurvey>
 */
class CsatSurveyFactory extends Factory
{
    protected $model = CsatSurvey::class;

    public function definition(): array
    {
        return [
            'ticket_id'    => Ticket::factory(),
            'user_id'      => null,
            'email'        => $this->faker->safeEmail(),
            'token'        => Str::random(64),
            'score'        => null,
            'comment'      => null,
            'sent_at'      => now(),
            'responded_at' => null,
        ];
    }

    public function responded(int $score = 5): static
    {
        return $this->state(fn () => [
            'score'        => $score,
            'comment'      => $this->faker->optional()->sentence(),
            'responded_at' => now(),
        ]);
    }
}
