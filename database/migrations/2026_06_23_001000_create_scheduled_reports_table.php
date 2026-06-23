<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['overview', 'custom'])->default('overview');
            $table->enum('format', ['pdf', 'excel', 'csv'])->default('excel');
            $table->enum('schedule', ['daily', 'weekly', 'monthly'])->default('weekly');
            $table->tinyInteger('day_of_week')->nullable();   // 0=Sun … 6=Sat (weekly)
            $table->tinyInteger('day_of_month')->nullable();  // 1–31 (monthly)
            $table->time('time_of_day')->default('08:00:00');
            $table->json('recipients');
            $table->json('params')->nullable();               // custom report: metric, group_by, filters
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
    }
};
