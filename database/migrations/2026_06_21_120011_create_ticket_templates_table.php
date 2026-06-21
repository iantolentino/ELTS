<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('subject')->nullable();
            $table->longText('body')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('ticket_categories')->nullOnDelete();
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->nullable();
            $table->json('tag_ids')->nullable();
            $table->json('custom_field_defaults')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_templates');
    }
};
