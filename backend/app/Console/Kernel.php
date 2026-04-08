<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     * The stale-ticket reset runs every hour so no high-priority ticket
     * stays outside 'open' for more than ~1 hour past the 48-h window.
     */
    protected function schedule(Schedule $schedule): void
    {
        
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}
