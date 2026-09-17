<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    // Laravel notification records are written by the framework internally.
    // $guarded = [] is safe here as no controller calls Notification::create() directly.
    protected $guarded = [];
}
