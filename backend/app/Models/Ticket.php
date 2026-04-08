<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ticket extends Model
{
    use HasFactory;

    // ── Constants ──────────────────────────────────────────────────────────────
    const STATUS_OPEN        = 'open';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_CLOSED      = 'closed';

    const PRIORITY_LOW    = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH   = 'high';

    const STATUSES   = [self::STATUS_OPEN, self::STATUS_IN_PROGRESS, self::STATUS_CLOSED];
    const PRIORITIES = [self::PRIORITY_LOW, self::PRIORITY_MEDIUM, self::PRIORITY_HIGH];

    // ── Appended accessors ─────────────────────────────────────────────────────
    protected $appends = ['is_stale_high_priority'];

    // ── Mass-assignable ────────────────────────────────────────────────────────
    protected $fillable = [
        'title',
        'description',
        'status',
        'priority',
        'assigned_user_id',
    ];

    // ── Casts ──────────────────────────────────────────────────────────────────
    protected $casts = [
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
        'assigned_user_id' => 'integer',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    // ── Business-logic helpers ─────────────────────────────────────────────────

    /**
     * A ticket may only be closed when it has an assigned user.
     */
    public function canBeClosed(): bool
    {
        return $this->assigned_user_id !== null;
    }

    // ── Accessors ──────────────────────────────────────────────────────────────
    public function getIsStaleHighPriorityAttribute(): bool
    {
        return $this->priority === self::PRIORITY_HIGH
            && $this->status !== self::STATUS_OPEN
            && $this->updated_at->lt(now()->subHours(48));
    }

    /**
     * Scope: high-priority tickets not touched in the last 48 hours that are NOT open.
     */
    public function scopeStaleHighPriority($query)
    {
        return $query
            ->where('priority', self::PRIORITY_HIGH)
            ->where('status', '!=', self::STATUS_OPEN)
            ->where('updated_at', '<', now()->subHours(48));
    }
}
