<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ScheduledReport;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduledReport>
 */
class ScheduledReportFactory extends Factory
{
    protected $model = ScheduledReport::class;

    public function definition(): array
    {
        return [
            'name'          => $this->faker->words(3, true),
            'type'          => $this->faker->randomElement(['overview', 'custom']),
            'format'        => $this->faker->randomElement(['pdf', 'excel', 'csv']),
            'schedule'      => 'daily',
            'day_of_week'   => null,
            'day_of_month'  => null,
            'time_of_day'   => '08:00:00',
            'recipients'    => [$this->faker->safeEmail()],
            'params'        => null,
            'is_active'     => true,
            'created_by'    => null,
        ];
    }
}
