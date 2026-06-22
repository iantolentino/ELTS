<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canned_responses', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('body');
            $table->enum('scope', ['global', 'team', 'personal'])->default('global');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // personal scope
            $table->foreignId('team_id')->nullable()->constrained()->nullOnDelete(); // team scope
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['scope', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canned_responses');
    }
};
