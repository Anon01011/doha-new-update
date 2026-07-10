<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Carbon\Carbon;

class EmployeeDocument extends Model
{
    use Auditable;

    protected $fillable = [
        'employee_id',
        'document_type_id',
        'document_name',
        'file_path',
        'file_type',
        'file_size',
        'issue_date',
        'expiry_date',
        'is_expired',
        'notes',
        'uploaded_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'is_expired' => 'boolean',
        'file_size' => 'integer',
    ];

    protected $appends = ['days_until_expiry', 'is_expiring_soon'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getDaysUntilExpiryAttribute()
    {
        if (!$this->expiry_date) {
            return null;
        }

        return Carbon::now()->diffInDays($this->expiry_date, false);
    }

    public function getIsExpiringSoonAttribute()
    {
        if (!$this->expiry_date || $this->is_expired) {
            return false;
        }

        $companyId = $this->employee->company_id ?? null;
        $alertDays = $this->documentType->alert_days_before_expiry ?? Setting::get('expiry_notification_days', 30, $companyId);
        
        return $this->days_until_expiry <= $alertDays && $this->days_until_expiry >= 0;
    }

    public function getFileSizeFormattedAttribute()
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' B';
    }
}
