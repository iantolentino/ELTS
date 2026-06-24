<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('asset_tag')->unique();
            $table->string('type', 60);
            $table->enum('status', ['purchased', 'in_use', 'maintenance', 'retired'])->default('purchased');
            $table->string('serial_number')->nullable()->unique();
            $table->string('make', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 10, 2)->nullable();
            $table->date('warranty_expires_at')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('assigned_to')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamps();

            $table->index('type');
            $table->index('status');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
