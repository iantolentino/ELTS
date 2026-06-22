<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\ProcessIncomingEmail;
use App\Models\IncomingEmail;
use App\Models\Mailbox;
use Throwable;
use Webklex\IMAP\Facades\Client as ImapClient;
use Webklex\PHPIMAP\Client;

class MailboxService
{
    /**
     * Test whether a mailbox's IMAP credentials are valid by connecting and immediately disconnecting.
     */
    public function testConnection(Mailbox $mailbox): bool
    {
        try {
            $client = $this->makeClient($mailbox);
            $client->connect();
            $client->disconnect();
            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * Connect to the mailbox, fetch unseen messages since last_polled_at,
     * store each as a pending IncomingEmail record, and return the count created.
     */
    public function pollMailbox(Mailbox $mailbox): int
    {
        $client = $this->makeClient($mailbox);
        $client->connect();

        $folder  = $client->getFolder($mailbox->mailbox_folder);
        $query   = $folder->query()->unseen();

        if ($mailbox->last_polled_at) {
            $query->since($mailbox->last_polled_at);
        }

        $messages = $query->get();
        $created  = 0;

        foreach ($messages as $message) {
            try {
                $messageId = $this->extractMessageId($message, $mailbox->id);

                if (IncomingEmail::where('message_id', $messageId)->exists()) {
                    continue;
                }

                $from        = $message->getFrom()?->first();
                $attachments = [];

                foreach ($message->getAttachments() as $attachment) {
                    $attachments[] = [
                        'name'      => (string) ($attachment->getName() ?? ''),
                        'size'      => (int) ($attachment->getSize() ?? 0),
                        'mime_type' => (string) ($attachment->getMimeType() ?? 'application/octet-stream'),
                    ];
                }

                $receivedAt = now();
                try {
                    $date = $message->getDate();
                    if ($date && $date->first()) {
                        $receivedAt = $date->first();
                    }
                } catch (Throwable) {}

                IncomingEmail::create([
                    'mailbox_id'  => $mailbox->id,
                    'message_id'  => $messageId,
                    'from_email'  => (string) ($from?->mail ?? ''),
                    'from_name'   => $from?->personal ?: null,
                    'to_email'    => $message->getTo()?->first()?->mail ?? null,
                    'subject'     => (string) ($message->getSubject() ?? ''),
                    'body_text'   => $message->getTextBody() ?: null,
                    'body_html'   => $message->getHTMLBody() ?: null,
                    'attachments' => $attachments ?: null,
                    'status'      => 'pending',
                    'received_at' => $receivedAt,
                ]);

                ProcessIncomingEmail::dispatch($email);
                $created++;
            } catch (Throwable) {
                // Soft fail per message — continue polling remaining messages
            }
        }

        $mailbox->update(['last_polled_at' => now()]);
        $client->disconnect();

        return $created;
    }

    /**
     * Poll all active mailboxes, returning the total number of IncomingEmail records created.
     * Each mailbox failure is swallowed so one bad mailbox cannot block others.
     */
    public function pollAllActive(): int
    {
        $total = 0;

        Mailbox::where('is_active', true)->each(function (Mailbox $mailbox) use (&$total): void {
            try {
                $total += $this->pollMailbox($mailbox);
            } catch (Throwable) {
                // Soft fail — log in production, don't abort the loop
            }
        });

        return $total;
    }

    private function makeClient(Mailbox $mailbox): Client
    {
        return ImapClient::make([
            'host'          => $mailbox->host,
            'port'          => $mailbox->port,
            'encryption'    => $mailbox->encryption,
            'username'      => $mailbox->username,
            'password'      => $mailbox->password,
            'protocol'      => 'imap',
            'validate_cert' => false,
            'timeout'       => 30,
        ]);
    }

    private function extractMessageId(mixed $message, int $mailboxId): string
    {
        try {
            $id = $message->getMessageId()?->first();
            if ($id) {
                return (string) $id;
            }
        } catch (Throwable) {}

        // Fall back to UID — prefixed with mailbox id so it's globally unique
        return "uid-{$mailboxId}-" . $message->getUid();
    }
}
