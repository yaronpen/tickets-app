<?php

namespace App\Services;

use App\Models\Ticket;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TicketService
{
    public function listTickets(
        ?string $status,
        ?string $priority,
        ?int $assignedUserId,
        string $sortBy,
        string $sortDir,
        int $perPage,
        int $page
    ): array {
        $where    = ['1=1'];
        $bindings = [];

        if ($status) {
            $where[]    = "t.status = ?";
            $bindings[] = $status;
        }

        if ($priority) {
            $where[]    = "t.priority = ?";
            $bindings[] = $priority;
        }

        if ($assignedUserId) {
            $where[]    = "t.assigned_user_id = ?";
            $bindings[] = $assignedUserId;
        }

        $whereClause = implode(' AND ', $where);

        $priorityOrder = "CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END";
        $orderClause   = $sortBy === 'priority'
            ? "$priorityOrder $sortDir"
            : "t.$sortBy $sortDir";

        $total = DB::selectOne(
            "SELECT COUNT(*) AS cnt
             FROM tickets t
             LEFT JOIN users u ON u.id = t.assigned_user_id
             WHERE $whereClause",
            $bindings
        )->cnt;

        $offset  = ($page - 1) * $perPage;

        $tickets = DB::select(
            "SELECT
                t.id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.assigned_user_id,
                t.created_at,
                t.updated_at,
                u.name  AS assigned_user_name,
                u.email AS assigned_user_email,
                CASE
                    WHEN t.priority = 'high'
                     AND t.status  != 'open'
                     AND t.updated_at < DATEADD(HOUR, -48, GETUTCDATE())
                    THEN 1
                    ELSE 0
                END AS is_stale_high_priority
             FROM tickets t
             LEFT JOIN users u ON u.id = t.assigned_user_id
             WHERE $whereClause
             ORDER BY $orderClause
             OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
            [...$bindings, $offset, $perPage]
        );

        $summaryRows = DB::select(
            "SELECT t.status, t.priority, COUNT(*) AS cnt
             FROM tickets t
             WHERE $whereClause
             GROUP BY t.status, t.priority",
            $bindings
        );

        $stats = ['total' => $total, 'open' => 0, 'in_progress' => 0, 'closed' => 0, 'high' => 0];
        foreach ($summaryRows as $row) {
            if (isset($stats[$row->status])) {
                $stats[$row->status] += $row->cnt;
            }
            if ($row->priority === 'high') {
                $stats['high'] += $row->cnt;
            }
        }

        return [
            'data' => $tickets,
            'meta' => [
                'total'        => $total,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => (int) ceil($total / $perPage),
                'stats'        => $stats,
            ],
        ];
    }

    public function storeTicket(array $data): Ticket
    {
        return Ticket::create($data);
    }

    public function updateTicket(Ticket $ticket, array $data): Ticket
    {
        // ── Business rule: cannot close without an assigned user ───────────────
        if (isset($data['status']) && $data['status'] === Ticket::STATUS_CLOSED) {
            $effectiveAssignee = $data['assigned_user_id'] ?? $ticket->assigned_user_id;

            if (empty($effectiveAssignee)) {
                throw ValidationException::withMessages([
                    'status' => ['A ticket must have an assigned user before it can be closed.'],
                ]);
            }
        }

        $ticket->update($data);
        $ticket->refresh()->load('assignedUser');

        return $ticket;
    }

    public function changeStatus(Ticket $ticket, string $newStatus): Ticket
    {
        if ($newStatus === Ticket::STATUS_CLOSED && !$ticket->canBeClosed()) {
            throw ValidationException::withMessages([
                'status' => ['A ticket must have an assigned user before it can be closed.'],
            ]);
        }

        $ticket->update(['status' => $newStatus]);
        $ticket->refresh()->load('assignedUser');

        return $ticket;
    }

    public function assignUser(Ticket $ticket, int $userId): Ticket
    {
        $ticket->update(['assigned_user_id' => $userId]);
        $ticket->refresh()->load('assignedUser');

        return $ticket;
    }
}
