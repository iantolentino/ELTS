<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ticket_reply_id')->nullable()->constrained('ticket_replies')->nullOnDelete();
            $table->foreignId('ticket_note_id')->nullable()->constrained('ticket_notes')->nullOnDelete();
            $table->string('filename');
            $table->string('stored_path');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->timestamps();

            $table->index('ticket_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_attachments');
    }
};
