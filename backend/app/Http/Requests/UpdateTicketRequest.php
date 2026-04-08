<?php

namespace App\Http\Requests;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'            => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'status'           => ['sometimes', 'in:' . implode(',', Ticket::STATUSES)],
            'priority'         => ['sometimes', 'in:' . implode(',', Ticket::PRIORITIES)],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}
