<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 20)->unique()->index();
            $table->string('subject');
            $table->longText('description');
            $table->foreignId('status_id')->constrained('ticket_statuses');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium')->index();
            $table->foreignId('category_id')->nullable()->constrained('ticket_categories')->nullOnDelete();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->unsignedBigInteger('parent_ticket_id')->nullable()->index();
            $table->unsignedBigInteger('merged_into_id')->nullable()->index();
            $table->enum('source', ['web', 'email', 'phone', 'api', 'portal'])->default('web');
            $table->boolean('is_vip')->default(false)->index();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status_id', 'priority']);
            $table->index(['assignee_id', 'status_id']);
            $table->index('created_at');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->foreign('parent_ticket_id')->references('id')->on('tickets')->nullOnDelete();
            $table->foreign('merged_into_id')->references('id')->on('tickets')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['parent_ticket_id']);
            $table->dropForeign(['merged_into_id']);
        });
        Schema::dropIfExists('tickets');
    }
};
