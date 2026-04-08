<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetHighPriorityTickets extends Command
{
    protected $signature   = 'tickets:reset-stale-high-priority';
    protected $description = 'Reset high-priority tickets untouched for >48 h back to "open"';

    public function handle(): int
    {
        /*
         * Business rule:
         *   A ticket with priority = 'high' that has NOT been updated in the last 48 hours
         *   and is NOT already 'open' must be automatically set back to 'open'.
         *
         * We use a raw UPDATE for efficiency – one round trip to the DB.
         */
        $affected = DB::update(
            "UPDATE tickets
             SET    status     = 'open',
                    updated_at = GETUTCDATE()
             WHERE  priority   = 'high'
               AND  status     = 'in_progress'
               AND  updated_at < DATEADD(HOUR, -48, GETUTCDATE())"
        );
        
        $this->info("Reset $affected stale high-priority ticket(s) to 'open'.");

        return self::SUCCESS;
    }
}
