<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    // GET /api/users
    public function index(): JsonResponse
    {
        return response()->json(User::select('id', 'name', 'email')->get());
    }

    // GET /api/users/{user}
    public function show(User $user): JsonResponse
    {
        return response()->json(
            $user->load(['tickets' => fn ($q) => $q->select('id', 'title', 'status', 'priority', 'assigned_user_id')])
        );
    }
}
