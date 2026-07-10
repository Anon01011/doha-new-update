<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToCompany;

class Holiday extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_recurring',
        'company_id',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_recurring' => 'boolean',
    ];
}
