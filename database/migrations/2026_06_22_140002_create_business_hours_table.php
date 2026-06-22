<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per day-of-week (0=Sunday … 6=Saturday) per policy (null = global default)
        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sla_policy_id')->nullable()->constrained('sla_policies')->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0 Sun … 6 Sat
            $table->boolean('is_open')->default(true);
            $table->time('open_time')->default('09:00:00');
            $table->time('close_time')->default('17:00:00');
            $table->string('timezone')->default('UTC');
            $table->timestamps();

            $table->unique(['sla_policy_id', 'day_of_week']);
            $table->index('sla_policy_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_hours');
    }
};
