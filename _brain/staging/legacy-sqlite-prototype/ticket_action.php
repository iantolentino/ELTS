<?php
declare(strict_types=1);
require_once __DIR__ . '/functions.php';

$user = requireLogin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: dashboard.php');
    exit;
}

$ticketId = (int) ($_POST['ticket_id'] ?? 0);
$action = $_POST['action'] ?? '';

$stmt = $pdo->prepare('SELECT * FROM tickets WHERE id = ?');
$stmt->execute([$ticketId]);
$ticket = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$ticket) {
    header('Location: dashboard.php?msg=' . urlencode('Ticket not found') . '&type=error');
    exit;
}

$isOwner = $user['role'] === 'super' || (int) $user['department_id'] === (int) $ticket['department_id'];
if (!$isOwner) {
    header('Location: dashboard.php?msg=' . urlencode('You do not have access to that ticket') . '&type=error');
    exit;
}

$now = date('Y-m-d H:i:s');

switch ($action) {
    case 'accept':
        $upd = $pdo->prepare('UPDATE tickets SET status = ?, accepted_at = ?, accepted_by = ? WHERE id = ?');
        $upd->execute(['ongoing', $now, $user['name'], $ticketId]);
        notifyEmail($ticket['requester_email'], "Ticket accepted: {$ticket['ticket_number']}", "Your ticket \"{$ticket['subject']}\" has been accepted and is now being worked on.");
        $msg = "Ticket #{$ticket['ticket_number']} accepted.";
        break;

    case 'reject':
        $reason = trim($_POST['rejection_reason'] ?? '');
        $upd = $pdo->prepare('UPDATE tickets SET status = ?, rejection_reason = ? WHERE id = ?');
        $upd->execute(['rejected', $reason, $ticketId]);
        notifyEmail($ticket['requester_email'], "Ticket rejected: {$ticket['ticket_number']}", "Your ticket \"{$ticket['subject']}\" was rejected. Reason: $reason");
        $msg = "Ticket #{$ticket['ticket_number']} rejected.";
        break;

    case 'finish':
        $upd = $pdo->prepare('UPDATE tickets SET status = ?, finished_at = ? WHERE id = ?');
        $upd->execute(['done', $now, $ticketId]);
        notifyEmail($ticket['requester_email'], "Ticket finished: {$ticket['ticket_number']}", "Your ticket \"{$ticket['subject']}\" has been marked finished.");
        $msg = "Ticket #{$ticket['ticket_number']} marked finished.";
        break;

    case 'update_full':
        if ($user['role'] !== 'super') {
            header('Location: dashboard.php?msg=' . urlencode('Only the super admin can edit all fields') . '&type=error');
            exit;
        }
        $departmentId = (int) ($_POST['department_id'] ?? $ticket['department_id']);
        $requesterName = trim($_POST['requester_name'] ?? $ticket['requester_name']);
        $requesterEmail = trim($_POST['requester_email'] ?? $ticket['requester_email']);
        $subject = trim($_POST['subject'] ?? $ticket['subject']);
        $description = trim($_POST['description'] ?? $ticket['description']);
        $category = trim($_POST['category'] ?? $ticket['category']);
        $status = trim($_POST['status'] ?? $ticket['status']);
        $submittedAt = trim($_POST['submitted_at'] ?? '');
        $acceptedAt = trim($_POST['accepted_at'] ?? '');
        $finishedAt = trim($_POST['finished_at'] ?? '');

        $upd = $pdo->prepare(
            'UPDATE tickets SET department_id = ?, requester_name = ?, requester_email = ?, subject = ?,
                description = ?, category = ?, status = ?, submitted_at = ?, accepted_at = ?, finished_at = ?
             WHERE id = ?'
        );
        $upd->execute([
            $departmentId, $requesterName, $requesterEmail, $subject, $description, $category, $status,
            $submittedAt !== '' ? $submittedAt : $ticket['submitted_at'],
            $acceptedAt !== '' ? $acceptedAt : null,
            $finishedAt !== '' ? $finishedAt : null,
            $ticketId,
        ]);
        $msg = "Ticket #{$ticket['ticket_number']} updated.";
        break;

    default:
        header('Location: dashboard.php?msg=' . urlencode('Unknown action') . '&type=error');
        exit;
}

header('Location: dashboard.php?msg=' . urlencode($msg) . '&type=success');
exit;
