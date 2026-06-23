<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\NpsSurvey;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<NpsSurvey>
 */
class NpsSurveyFactory extends Factory
{
    protected $model = NpsSurvey::class;

    public function definition(): array
    {
        return [
            'user_id'      => null,
            'email'        => $this->faker->safeEmail(),
            'token'        => Str::random(64),
            'score'        => null,
            'comment'      => null,
            'sent_at'      => now(),
            'responded_at' => null,
        ];
    }

    public function responded(int $score = 9): static
    {
        return $this->state(fn () => [
            'score'        => $score,
            'comment'      => $this->faker->optional()->sentence(),
            'responded_at' => now(),
        ]);
    }
}
