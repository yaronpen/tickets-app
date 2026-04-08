<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();

            // Status & priority stored as nvarchar – CHECK constraints added below
            $table->string('status', 20)->default('open');      // open | in_progress | closed
            $table->string('priority', 10)->default('medium');  // low | medium | high

            $table->unsignedBigInteger('assigned_user_id')->nullable();
            $table->foreign('assigned_user_id')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();

            $table->timestamps(); // created_at & updated_at
        });

        // ── CHECK constraints (SQL Server natively supports these) ─────────────
        DB::statement(
            "ALTER TABLE tickets ADD CONSTRAINT chk_tickets_status
             CHECK (status IN ('open','in_progress','closed'))"
        );
        DB::statement(
            "ALTER TABLE tickets ADD CONSTRAINT chk_tickets_priority
             CHECK (priority IN ('low','medium','high'))"
        );

        // ── Composite index for the 48-h stale-ticket reset query ──────────────
        DB::statement(
            "CREATE INDEX idx_tickets_priority_status_updated
             ON tickets (priority, status, updated_at)"
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
