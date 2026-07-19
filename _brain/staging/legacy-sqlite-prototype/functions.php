<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

function currentUser(): ?array
{
    return $_SESSION['admin'] ?? null;
}

function requireLogin(?string $role = null): array
{
    $user = currentUser();
    if (!$user) {
        header('Location: login.php');
        exit;
    }
    if ($role !== null && $user['role'] !== $role) {
        header('Location: dashboard.php');
        exit;
    }
    return $user;
}

function nextTicketNumber(PDO $pdo, int $departmentId): string
{
    $stmt = $pdo->prepare('SELECT code, next_number FROM departments WHERE id = ?');
    $stmt->execute([$departmentId]);
    $dept = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$dept) {
        throw new RuntimeException('Unknown department');
    }
    $number = (int) $dept['next_number'];
    $ticketNumber = $dept['code'] . '-' . str_pad((string) $number, 4, '0', STR_PAD_LEFT);

    $update = $pdo->prepare('UPDATE departments SET next_number = ? WHERE id = ?');
    $update->execute([$number + 1, $departmentId]);

    return $ticketNumber;
}

/**
 * Stand-in for real email delivery. Logs to emails.log instead of sending.
 * Swap this out for mail() / PHPMailer / an SMTP API once you have real credentials.
 */
function notifyEmail(string $to, string $subject, string $body): void
{
    $line = sprintf(
        "[%s] TO: %s | SUBJECT: %s | BODY: %s\n",
        date('Y-m-d H:i:s'),
        $to,
        $subject,
        str_replace("\n", ' ', $body)
    );
    file_put_contents(EMAIL_LOG, $line, FILE_APPEND);
}

function h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function statusBadgeClass(string $status): string
{
    return match ($status) {
        'pending' => 'status pending',
        'ongoing' => 'status ongoing',
        'done' => 'status done',
        'rejected' => 'status rejected',
        default => 'status',
    };
}
