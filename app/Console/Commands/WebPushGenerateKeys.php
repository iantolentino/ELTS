<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class WebPushGenerateKeys extends Command
{
    protected $signature   = 'webpush:vapid';
    protected $description = 'Generate VAPID keys for Web Push notifications and write them to .env';

    public function handle(): int
    {
        try {
            $keys = VAPID::createVapidKeys();
        } catch (\Throwable) {
            $this->error('EC key generation failed (OpenSSL may not support P-256 on this platform).');
            $this->line('Generate keys via Node.js instead:');
            $this->line('  npx --yes web-push generate-vapid-keys --json');
            $this->newLine();
            $this->line('Then set these in .env:');
            $this->line('  VAPID_PUBLIC_KEY=<publicKey>');
            $this->line('  VAPID_PRIVATE_KEY=<privateKey>');
            $this->line('  VITE_VAPID_PUBLIC_KEY=<publicKey>');
            return self::FAILURE;
        }

        $env      = base_path('.env');
        $contents = file_get_contents($env);

        $replacements = [
            '/^VAPID_PUBLIC_KEY=.*/m'       => "VAPID_PUBLIC_KEY={$keys['publicKey']}",
            '/^VAPID_PRIVATE_KEY=.*/m'      => "VAPID_PRIVATE_KEY={$keys['privateKey']}",
            '/^VITE_VAPID_PUBLIC_KEY=.*/m'  => "VITE_VAPID_PUBLIC_KEY={$keys['publicKey']}",
        ];

        foreach ($replacements as $pattern => $replacement) {
            $contents = preg_replace($pattern, $replacement, $contents);
        }

        file_put_contents($env, $contents);

        $this->info('VAPID keys generated and written to .env');
        $this->line("Public:  {$keys['publicKey']}");
        $this->line("Private: {$keys['privateKey']}");

        return self::SUCCESS;
    }
}