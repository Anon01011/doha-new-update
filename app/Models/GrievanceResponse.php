<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class GrievanceResponse extends Model
{
    protected $fillable = [
        'grievance_id',
        'responded_by',
        'response_text',
        'response_date',
        'attachments',
    ];

    protected $casts = [
        'response_date' => 'datetime',
        'attachments' => 'array',
    ];

    public function grievance()
    {
        return $this->belongsTo(Grievance::class);
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}


