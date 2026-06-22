<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->unique()->constrained('tickets')->cascadeOnDelete();
            $table->foreignId('sla_policy_id')->nullable()->constrained('sla_policies')->nullOnDelete();
            $table->timestamp('first_response_due')->nullable();
            $table->timestamp('resolution_due')->nullable();
            $table->boolean('first_response_breached')->default(false);
            $table->boolean('resolution_breached')->default(false);
            $table->timestamp('first_response_met_at')->nullable(); // when SLA was actually met
            $table->timestamp('resolution_met_at')->nullable();
            $table->timestamp('paused_at')->nullable();             // null = not paused
            $table->unsignedInteger('paused_minutes')->default(0);  // accumulated pause time
            $table->timestamps();

            $table->index('first_response_due');
            $table->index('resolution_due');
            $table->index('first_response_breached');
            $table->index('resolution_breached');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_records');
    }
};
