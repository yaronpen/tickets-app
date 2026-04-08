<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ──────────────────────────────────────────────────────────────
        $users = [
            ['name' => 'Alice Cohen',   'email' => 'alice@example.com'],
            ['name' => 'Bob Levi',      'email' => 'bob@example.com'],
            ['name' => 'Carol Shapiro', 'email' => 'carol@example.com'],
        ];

        foreach ($users as $userData) {
            User::firstOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, ['password' => Hash::make('password')])
            );
        }

        $alice = User::where('email', 'alice@example.com')->first();
        $bob   = User::where('email', 'bob@example.com')->first();

        // ── Tickets ────────────────────────────────────────────────────────────
        $tickets = [
            [
                'title'            => 'Login page returns 500',
                'description'      => 'Users cannot log in – server error after form submit.',
                'status'           => 'open',
                'priority'         => 'high',
                'assigned_user_id' => $alice->id,
            ],
            [
                'title'            => 'Update password reset flow',
                'description'      => 'The reset email link expires too quickly.',
                'status'           => 'in_progress',
                'priority'         => 'medium',
                'assigned_user_id' => $bob->id,
            ],
            [
                'title'            => 'Typo on About page',
                'description'      => '"Recieve" should be "Receive".',
                'status'           => 'open',
                'priority'         => 'low',
                'assigned_user_id' => null,
            ],
            [
                'title'            => 'Performance: slow dashboard query',
                'description'      => 'Dashboard takes 8 seconds to load for large accounts.',
                'status'           => 'open',
                'priority'         => 'high',
                'assigned_user_id' => null,
            ],
            [
                'title'            => 'Add dark mode toggle',
                'description'      => 'Feature request from multiple users.',
                'status'           => 'closed',
                'priority'         => 'low',
                'assigned_user_id' => $alice->id,
            ],
        ];

        foreach ($tickets as $ticketData) {
            Ticket::create($ticketData);
        }
    }
}
