<?php

namespace App\Http\Requests;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class GetTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status'           => ['nullable', 'in:open,in_progress,closed'],
            'priority'         => ['nullable', 'in:low,medium,high'],
            'assigned_user_id' => ['nullable', 'integer'],
            'sort_by'          => ['nullable', 'in:created_at,priority,updated_at'],
            'sort_dir'         => ['nullable', 'in:asc,desc'],
            'per_page'         => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}