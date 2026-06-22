<?php

declare(strict_types=1);

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class MailboxFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'           => $this->faker->words(2, true) . ' Inbox',
            'host'           => 'mail.' . $this->faker->domainName(),
            'port'           => 993,
            'encryption'     => 'ssl',
            'username'       => $this->faker->email(),
            'password'       => 'secret',
            'mailbox_folder' => 'INBOX',
            'is_active'      => true,
            'created_by'     => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
