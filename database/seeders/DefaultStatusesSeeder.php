<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\TicketStatus;
use Illuminate\Database\Seeder;

class DefaultStatusesSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['name' => 'Open',        'color' => '#22C55E', 'sort_order' => 1, 'is_default' => true,  'is_closed' => false],
            ['name' => 'In Progress', 'color' => '#3B82F6', 'sort_order' => 2, 'is_default' => false, 'is_closed' => false],
            ['name' => 'On Hold',     'color' => '#F59E0B', 'sort_order' => 3, 'is_default' => false, 'is_closed' => false],
            ['name' => 'Resolved',    'color' => '#A855F7', 'sort_order' => 4, 'is_default' => false, 'is_closed' => false],
            ['name' => 'Closed',      'color' => '#6B7280', 'sort_order' => 5, 'is_default' => false, 'is_closed' => true],
        ];

        foreach ($statuses as $status) {
            TicketStatus::firstOrCreate(
                ['name' => $status['name']],
                $status,
            );
        }
    }
}
