<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Mailbox;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class IncomingEmailFactory extends Factory
{
    public function definition(): array
    {
        return [
            'mailbox_id'  => Mailbox::factory(),
            'ticket_id'   => null,
            'message_id'  => '<' . Str::uuid() . '@mail.example.com>',
            'from_email'  => $this->faker->email(),
            'from_name'   => $this->faker->name(),
            'to_email'    => 'support@example.com',
            'subject'     => $this->faker->sentence(6),
            'body_text'   => $this->faker->paragraphs(2, true),
            'body_html'   => null,
            'attachments' => null,
            'status'      => 'pending',
            'received_at' => now(),
        ];
    }

    public function processed(): static
    {
        return $this->state(['status' => 'processed', 'processed_at' => now()]);
    }

    public function failed(string $reason = 'Test failure'): static
    {
        return $this->state(['status' => 'failed', 'failure_reason' => $reason, 'processed_at' => now()]);
    }

    public function withReplySubject(string $ticketNumber): static
    {
        return $this->state(['subject' => "Re: [{$ticketNumber}] support question"]);
    }
}
