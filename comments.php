<?php
declare(strict_types=1);

// Shared ticket-comment logic (T046) — used by both the agent-side ticket detail view
// (department_controller.php) and the public requester-side status-lookup view
// (public_controller.php). A comment thread is visible to both sides, unlike T016's internal
// notes (agent-only), so this lives outside either controller.

function applyAddComment(int $ticketId, string $authorType, ?int $agentId, string $authorName, string $body): ?string
{
    $body = trim($body);
    if ($body === '') {
        return 'Comment cannot be empty.';
    }

    dbInsert('ticket_comments', [
        'ticket_id' => $ticketId,
        'author_type' => $authorType,
        'agent_id' => $agentId,
        'author_name' => $authorName,
        'body' => $body,
    ]);

    return null;
}

/**
 * @param array<int,array<string,mixed>> $comments
 */
function renderCommentList(array $comments): string
{
    if ($comments === []) {
        return '<p class="muted">No comments yet.</p>';
    }

    $list = '';
    foreach ($comments as $comment) {
        $isAgent = (string) $comment['author_type'] === 'agent';
        $badge = $isAgent
            ? '<span class="badge badge-operational" style="margin-left:.4rem;">agent</span>'
            : '<span class="badge badge-cancelled" style="margin-left:.4rem;">requester</span>';
        $list .= '<div style="border-bottom:1px solid var(--border); padding:.5rem 0;">'
            . '<p style="margin:0;">' . nl2br(htmlspecialchars((string) $comment['body'])) . '</p>'
            . '<p class="muted" style="margin:.25rem 0 0; font-size:.8rem;">'
            . htmlspecialchars((string) $comment['author_name']) . $badge . ' — ' . htmlspecialchars((string) $comment['created_at'])
            . '</p></div>';
    }

    return $list;
}
