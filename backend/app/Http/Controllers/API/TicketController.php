<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Requests\GetTicketRequest;
use App\Http\Requests\ChangeStatusRequest;
use App\Http\Requests\AssignUserRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(private TicketService $ticketService) {}

    // ── GET /api/tickets ───────────────────────────────────────────────────────
    public function index(GetTicketRequest $request): JsonResponse
    {
        $tickets = $this->ticketService->listTickets(
            status:         $request->input('status'),
            priority:       $request->input('priority'),
            assignedUserId: $request->integer('assigned_user_id') ?: null,
            sortBy:         $request->input('sort_by', 'created_at'),
            sortDir:        strtoupper($request->input('sort_dir', 'desc')),
            perPage:        $request->integer('per_page', 15),
            page:           $request->integer('page', 1),
        );

        return response()->json($tickets);
    }

    // ── POST /api/tickets ──────────────────────────────────────────────────────
    public function store(CreateTicketRequest $request): JsonResponse
    {
        $ticket = $this->ticketService->storeTicket($request->validated())->load('assignedUser');
        return response()->json($ticket, 201);
    }

    // ── GET /api/tickets/{ticket} ──────────────────────────────────────────────
    public function show(Ticket $ticket): JsonResponse
    {
        return response()->json($ticket->load('assignedUser'));
    }

    // ── PUT/PATCH /api/tickets/{ticket} ───────────────────────────────────────
    public function update(UpdateTicketRequest $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validated();

        $ticket = $this->ticketService->updateTicket($ticket, $data);

        return response()->json($ticket);
    }

    // ── PATCH /api/tickets/{ticket}/status ────────────────────────────────────
    public function changeStatus(ChangeStatusRequest $request, Ticket $ticket): JsonResponse
    {

        $ticket = $this->ticketService->changeStatus($ticket, $request->input('status'));

        return response()->json($ticket);
    }

    // ── PATCH /api/tickets/{ticket}/assign ────────────────────────────────────
    public function assign(AssignUserRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket = $this->ticketService->updateTicket($ticket, ['assigned_user_id' => $request->integer('assigned_user_id')]);

        return response()->json($ticket);
    }

    // ── DELETE /api/tickets/{ticket} ──────────────────────────────────────────
    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted.'], 200);
    }
}
