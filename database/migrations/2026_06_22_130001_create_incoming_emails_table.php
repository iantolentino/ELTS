<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incoming_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mailbox_id')->nullable()->constrained('mailboxes')->nullOnDelete();
            $table->foreignId('ticket_id')->nullable()->constrained('tickets')->nullOnDelete();
            $table->string('message_id', 512)->unique(); // RFC 2822 Message-ID header — prevents reprocessing
            $table->string('from_email');
            $table->string('from_name')->nullable();
            $table->string('to_email')->nullable();
            $table->string('subject', 1000)->nullable();
            $table->longText('body_text')->nullable();
            $table->longText('body_html')->nullable();
            $table->json('attachments')->nullable(); // [{name, size, mime_type}]
            $table->enum('status', ['pending', 'processed', 'failed', 'duplicate'])->default('pending');
            $table->text('failure_reason')->nullable();
            $table->timestamp('received_at');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index('mailbox_id');
            $table->index('ticket_id');
            $table->index('status');
            $table->index('from_email');
            $table->index('received_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incoming_emails');
    }
};
