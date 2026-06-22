<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sla_policy_id')->nullable()->constrained('sla_policies')->cascadeOnDelete();
            $table->string('name');
            $table->date('date');
            $table->boolean('recurring_yearly')->default(false); // same day every year
            $table->timestamps();

            $table->index(['sla_policy_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
};
