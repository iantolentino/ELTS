<?php
declare(strict_types=1);

// Single write path into the audit_logs table (T030) — every mutating ticket action funnels
// through this instead of inserting into audit_logs directly. $actorId is null only for a
// genuinely automated change (e.g. a future SLA auto-flag), never for a user-initiated one.
function writeAuditLog(int $ticketId, ?int $actorId, string $actionType, ?string $oldValue, ?string $newValue): void
{
    dbInsert('audit_logs', [
        'ticket_id' => $ticketId,
        'actor_id' => $actorId,
        'action_type' => $actionType,
        'old_value' => $oldValue,
        'new_value' => $newValue,
    ]);
}
