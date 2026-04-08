<?php

use App\Http\Controllers\API\TicketController;
use App\Http\Controllers\API\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tickets API Routes
|--------------------------------------------------------------------------
*/

// ── Users ──────────────────────────────────────────────────────────────────────
Route::get('/users',       [UserController::class, 'index']);
Route::get('/users/{user}', [UserController::class, 'show']);

// ── Tickets ────────────────────────────────────────────────────────────────────
Route::get    ('/tickets',                  [TicketController::class, 'index']);
Route::post   ('/tickets',                  [TicketController::class, 'store']);
Route::get    ('/tickets/{ticket}',         [TicketController::class, 'show']);
Route::put    ('/tickets/{ticket}',         [TicketController::class, 'update']);
Route::patch  ('/tickets/{ticket}',         [TicketController::class, 'update']);
Route::delete ('/tickets/{ticket}',         [TicketController::class, 'destroy']);

// ── Ticket sub-actions ─────────────────────────────────────────────────────────
Route::patch('/tickets/{ticket}/status', [TicketController::class, 'changeStatus']);
Route::patch('/tickets/{ticket}/assign', [TicketController::class, 'assign']);
