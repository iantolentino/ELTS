<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('priority', ['critical', 'high', 'medium', 'low'])->nullable(); // null = applies to all
            $table->unsignedInteger('first_response_minutes');  // SLA target in minutes
            $table->unsignedInteger('resolution_minutes');       // SLA target in minutes
            $table->boolean('uses_business_hours')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('priority');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_policies');
    }
};
