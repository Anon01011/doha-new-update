<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/employee/dashboard', [\App\Http\Controllers\EmployeeDashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('employee.dashboard');
Route::post('/employee/dashboard/update-photo', [\App\Http\Controllers\EmployeeDashboardController::class, 'updatePhoto'])->middleware(['auth', 'verified'])->name('employee.dashboard.update-photo');

Route::middleware('auth')->group(function () {
    // Moved here to allow permission-based access control rather than role-based
    Route::resource('leave-types', \App\Http\Controllers\LeaveTypeController::class);

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Admin, HR, and Manager only routes
    Route::middleware('role:admin,hr,manager')->group(function () {
        Route::post('employees/bulk-transfer', [EmployeeController::class, 'bulkTransfer'])->name('employees.bulk-transfer');
        Route::post('employees/{employee}/approve', [EmployeeController::class, 'approve'])->name('employees.approve');
        Route::resource('employees', EmployeeController::class);
        // Staff-wise Weekly Off (nested under employee)
        Route::get('employees/{employee}/weekly-offs', [\App\Http\Controllers\EmployeeWeeklyOffController::class, 'index'])->name('employees.weekly-offs.index');
        Route::post('employees/{employee}/weekly-offs', [\App\Http\Controllers\EmployeeWeeklyOffController::class, 'store'])->name('employees.weekly-offs.store');
        Route::put('employees/{employee}/weekly-offs/{weeklyOff}', [\App\Http\Controllers\EmployeeWeeklyOffController::class, 'update'])->name('employees.weekly-offs.update');
        Route::delete('employees/{employee}/weekly-offs/{weeklyOff}', [\App\Http\Controllers\EmployeeWeeklyOffController::class, 'destroy'])->name('employees.weekly-offs.destroy');
        Route::resource('companies', CompanyController::class);
        Route::resource('departments', \App\Http\Controllers\DepartmentController::class);
        Route::patch('departments/{department}/toggle-status', [\App\Http\Controllers\DepartmentController::class, 'toggleStatus'])->name('departments.toggle-status');
        Route::post('departments/{department}/transfer-staff', [\App\Http\Controllers\DepartmentController::class, 'transferStaff'])->name('departments.transfer-staff');
        // Route::resource('leave-types', \App\Http\Controllers\LeaveTypeController::class); // Moved to general auth group

        Route::resource('salary-components', \App\Http\Controllers\SalaryComponentController::class);

        // Admin attendance management
        Route::get('employee-attendances/week', [\App\Http\Controllers\EmployeeAttendanceController::class, 'week'])->name('employee-attendances.week');
        Route::post('employee-attendances/batch-store', [\App\Http\Controllers\EmployeeAttendanceController::class, 'batchStore'])->name('employee-attendances.batchStore');
        Route::get('employee-attendances/template', [\App\Http\Controllers\EmployeeAttendanceController::class, 'downloadTemplate'])->name('employee-attendances.template');
        Route::post('employee-attendances/import', [\App\Http\Controllers\EmployeeAttendanceController::class, 'import'])->name('employee-attendances.import');

        // Admin shift roster management
        Route::get('shift-rosters/show-employee/{company}/{employee}', [\App\Http\Controllers\ShiftRosterController::class, 'showEmployeeRoster'])->name('shift-rosters.showEmployee');
        Route::post('shift-rosters/bulk-store', [\App\Http\Controllers\ShiftRosterController::class, 'bulkStore'])->name('shift-rosters.bulkStore');
        Route::post('shift-rosters/create-shift', [\App\Http\Controllers\ShiftRosterController::class, 'createShift'])->name('shift-rosters.createShift');
        Route::post('shift-rosters/duplicate-week', [\App\Http\Controllers\ShiftRosterController::class, 'duplicateWeek'])->name('shift-rosters.duplicateWeek');
        Route::post('shift-rosters/clear-week', [\App\Http\Controllers\ShiftRosterController::class, 'clearWeek'])->name('shift-rosters.clearWeek');
        Route::get('shift-rosters/export-week', [\App\Http\Controllers\ShiftRosterController::class, 'exportWeek'])->name('shift-rosters.exportWeek');
        Route::get('shift-rosters/debug', [\App\Http\Controllers\ShiftRosterController::class, 'debug'])->name('shift-rosters.debug');
        Route::get('shift-rosters/test-database', [\App\Http\Controllers\ShiftRosterController::class, 'testDatabase'])->name('shift-rosters.testDatabase');
        Route::post('shift-rosters/batch-store', [\App\Http\Controllers\ShiftRosterController::class, 'batchStore'])->name('shift-rosters.batchStore');
        Route::post('shift-rosters/send-emails', [\App\Http\Controllers\ShiftRosterController::class, 'sendRosterEmails'])->name('shift-rosters.sendEmails');
        Route::post('shift-rosters/send-emails-selected', [\App\Http\Controllers\ShiftRosterController::class, 'sendRosterEmailsToSelected'])->name('shift-rosters.sendEmailsSelected');
        Route::post('shift-rosters/send-email-single', [\App\Http\Controllers\ShiftRosterController::class, 'sendRosterEmailToSingle'])->name('shift-rosters.sendEmailSingle');

        // Settings routes
        Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
        Route::get('/settings/mail', [\App\Http\Controllers\SettingsController::class, 'mailSettings'])->name('settings.mail');
        Route::post('/settings/mail', [\App\Http\Controllers\SettingsController::class, 'updateMailSettings'])->name('settings.mail.update');
        Route::post('/settings/mail/test', [\App\Http\Controllers\SettingsController::class, 'testMailSettings'])->name('settings.mail.test');
        Route::post('/settings/mail/clear-session', [\App\Http\Controllers\SettingsController::class, 'clearSessionSettings'])->name('settings.mail.clearSession');
        Route::get('/settings/system', [\App\Http\Controllers\SettingsController::class, 'systemSettings'])->name('settings.system');
        Route::post('/settings/system', [\App\Http\Controllers\SettingsController::class, 'updateSystemSettings'])->name('settings.system.update');
        Route::post('/settings/clear-session', [\App\Http\Controllers\SettingsController::class, 'clearSessionSettings'])->name('settings.clear-session');

        // Dropdown Options
        Route::get('/settings/dropdown-options', [\App\Http\Controllers\DropdownOptionController::class, 'index'])->name('settings.dropdown-options.index');
        Route::post('/settings/dropdown-options', [\App\Http\Controllers\DropdownOptionController::class, 'store'])->name('settings.dropdown-options.store');
        Route::put('/settings/dropdown-options/{dropdownOption}', [\App\Http\Controllers\DropdownOptionController::class, 'update'])->name('settings.dropdown-options.update');
        Route::delete('/settings/dropdown-options/{dropdownOption}', [\App\Http\Controllers\DropdownOptionController::class, 'destroy'])->name('settings.dropdown-options.destroy');

        // Module-specific Settings
        Route::get('/settings/attendance', [\App\Http\Controllers\SettingsController::class, 'attendanceSettings'])->name('settings.attendance');
        Route::post('/settings/attendance', [\App\Http\Controllers\SettingsController::class, 'updateAttendanceSettings'])->name('settings.attendance.update');
        Route::get('/settings/leave', [\App\Http\Controllers\SettingsController::class, 'leaveSettings'])->name('settings.leave');
        Route::post('/settings/leave', [\App\Http\Controllers\SettingsController::class, 'updateLeaveSettings'])->name('settings.leave.update');
        Route::get('/settings/payroll', [\App\Http\Controllers\SettingsController::class, 'payrollSettings'])->name('settings.payroll');
        Route::post('/settings/payroll', [\App\Http\Controllers\SettingsController::class, 'updatePayrollSettings'])->name('settings.payroll.update');
        Route::get('/settings/training', [\App\Http\Controllers\SettingsController::class, 'trainingSettings'])->name('settings.training');
        Route::post('/settings/training', [\App\Http\Controllers\SettingsController::class, 'updateTrainingSettings'])->name('settings.training.update');
        Route::get('/settings/tasks', [\App\Http\Controllers\SettingsController::class, 'taskSettings'])->name('settings.tasks');
        Route::post('/settings/tasks', [\App\Http\Controllers\SettingsController::class, 'updateTaskSettings'])->name('settings.tasks.update');
        Route::get('/settings/projects', [\App\Http\Controllers\SettingsController::class, 'projectSettings'])->name('settings.projects');
        Route::post('/settings/projects', [\App\Http\Controllers\SettingsController::class, 'updateProjectSettings'])->name('settings.projects.update');
        Route::get('/settings/grievances', [\App\Http\Controllers\SettingsController::class, 'grievanceSettings'])->name('settings.grievances');
        Route::post('/settings/grievances', [\App\Http\Controllers\SettingsController::class, 'updateGrievanceSettings'])->name('settings.grievances.update');
        Route::get('/settings/documents', [\App\Http\Controllers\SettingsController::class, 'documentSettings'])->name('settings.documents');
        Route::post('/settings/documents', [\App\Http\Controllers\SettingsController::class, 'updateDocumentSettings'])->name('settings.documents.update');
        Route::get('/settings/loans', [\App\Http\Controllers\SettingsController::class, 'loanSettings'])->name('settings.loans');
        Route::post('/settings/loans', [\App\Http\Controllers\SettingsController::class, 'updateLoanSettings'])->name('settings.loans.update');
        Route::get('/settings/employee', [\App\Http\Controllers\SettingsController::class, 'employeeSettings'])->name('settings.employee');
        Route::post('/settings/employee', [\App\Http\Controllers\SettingsController::class, 'updateEmployeeSettings'])->name('settings.employee.update');
        Route::get('/settings/integrations', [\App\Http\Controllers\SettingsController::class, 'integrationSettings'])->name('settings.integrations');
        Route::post('/settings/integrations', [\App\Http\Controllers\SettingsController::class, 'updateIntegrationSettings'])->name('settings.integrations.update');

        // Approval routes
        Route::post('leave-requests/{leaveRequest}/approve', [\App\Http\Controllers\LeaveRequestController::class, 'approve'])->name('leave-requests.approve');
        Route::post('leave-requests/{leaveRequest}/reject', [\App\Http\Controllers\LeaveRequestController::class, 'reject'])->name('leave-requests.reject');
        Route::post('leave-requests/{leaveRequest}/cancel', [\App\Http\Controllers\LeaveRequestController::class, 'cancel'])->name('leave-requests.cancel');
        Route::post('loans/{loan}/approve', [\App\Http\Controllers\LoanController::class, 'approve'])->name('loans.approve');
        Route::post('loans/{loan}/reject', [\App\Http\Controllers\LoanController::class, 'reject'])->name('loans.reject');
        Route::post('loans/{loan}/disburse', [\App\Http\Controllers\LoanController::class, 'disburse'])->name('loans.disburse');
        Route::post('loans/installments/{installment}/pay', [\App\Http\Controllers\LoanController::class, 'payInstallment'])->name('loans.installments.pay');
        Route::post('advances/{advance}/approve', [\App\Http\Controllers\AdvanceController::class, 'approve'])->name('advances.approve');
        Route::post('salary-postings/calculate', [\App\Http\Controllers\SalaryPostingController::class, 'calculateSalary'])->name('salary-postings.calculate');
        Route::post('salary-postings/{salaryPosting}/approve', [\App\Http\Controllers\SalaryPostingController::class, 'approve'])->name('salary-postings.approve');
        Route::post('salary-postings/{salaryPosting}/reject', [\App\Http\Controllers\SalaryPostingController::class, 'reject'])->name('salary-postings.reject');

        // Reports routes
        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/', [\App\Http\Controllers\ReportController::class, 'index'])->name('index');
            
            // Attendance
            Route::get('/attendance', [\App\Http\Controllers\ReportController::class, 'attendance'])->name('attendance');
            Route::get('/attendance/export/pdf', [\App\Http\Controllers\ReportController::class, 'attendanceExportPdf'])->name('attendance.export.pdf');
            Route::get('/attendance/export/excel', [\App\Http\Controllers\ReportController::class, 'attendanceExportExcel'])->name('attendance.export.excel');
            
            // Leave
            Route::get('/leave', [\App\Http\Controllers\ReportController::class, 'leave'])->name('leave');
            Route::get('/leave/export/pdf', [\App\Http\Controllers\ReportController::class, 'leaveExportPdf'])->name('leave.export.pdf');
            Route::get('/leave/export/excel', [\App\Http\Controllers\ReportController::class, 'leaveExportExcel'])->name('leave.export.excel');
            
            // Salary
            Route::get('/salary', [\App\Http\Controllers\ReportController::class, 'salary'])->name('salary');
            Route::get('/salary/export/pdf', [\App\Http\Controllers\ReportController::class, 'salaryExportPdf'])->name('salary.export.pdf');
            Route::get('/salary/export/excel', [\App\Http\Controllers\ReportController::class, 'salaryExportExcel'])->name('salary.export.excel');
            
            // Loan
            Route::get('/loan', [\App\Http\Controllers\ReportController::class, 'loan'])->name('loan');
            Route::get('/loan/export/pdf', [\App\Http\Controllers\ReportController::class, 'loanExportPdf'])->name('loan.export.pdf');
            Route::get('/loan/export/excel', [\App\Http\Controllers\ReportController::class, 'loanExportExcel'])->name('loan.export.excel');
            
            // Training
            Route::get('/training', [\App\Http\Controllers\ReportController::class, 'training'])->name('training');
            Route::get('/training/export/pdf', [\App\Http\Controllers\ReportController::class, 'trainingExportPdf'])->name('training.export.pdf');
            Route::get('/training/export/excel', [\App\Http\Controllers\ReportController::class, 'trainingExportExcel'])->name('training.export.excel');
            
            // Task
            Route::get('/task', [\App\Http\Controllers\ReportController::class, 'task'])->name('task');
            Route::get('/task/export/pdf', [\App\Http\Controllers\ReportController::class, 'taskExportPdf'])->name('task.export.pdf');
            Route::get('/task/export/excel', [\App\Http\Controllers\ReportController::class, 'taskExportExcel'])->name('task.export.excel');
            
            // Grievance
            Route::get('/grievance', [\App\Http\Controllers\ReportController::class, 'grievance'])->name('grievance');
            Route::get('/grievance/export/pdf', [\App\Http\Controllers\ReportController::class, 'grievanceExportPdf'])->name('grievance.export.pdf');
            Route::get('/grievance/export/excel', [\App\Http\Controllers\ReportController::class, 'grievanceExportExcel'])->name('grievance.export.excel');

            // Evaluation
            Route::get('/evaluation', [\App\Http\Controllers\ReportController::class, 'evaluation'])->name('evaluation');
            Route::get('/evaluation/export/pdf', [\App\Http\Controllers\ReportController::class, 'evaluationExportPdf'])->name('evaluation.export.pdf');
            Route::get('/evaluation/export/excel', [\App\Http\Controllers\ReportController::class, 'evaluationExportExcel'])->name('evaluation.export.excel');

            // Advance
            Route::get('/advance', [\App\Http\Controllers\ReportController::class, 'advance'])->name('advance');
            Route::get('/advance/export/pdf', [\App\Http\Controllers\ReportController::class, 'advanceExportPdf'])->name('advance.export.pdf');
            Route::get('/advance/export/excel', [\App\Http\Controllers\ReportController::class, 'advanceExportExcel'])->name('advance.export.excel');
        });
    });

    // Admin only routes
    Route::middleware('role:admin')->group(function () {
        Route::resource('roles', \App\Http\Controllers\RoleController::class);
        Route::resource('permissions', \App\Http\Controllers\PermissionController::class);

        // Audit Logs
        Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('audit-logs/{auditLog}', [\App\Http\Controllers\AuditLogController::class, 'show'])->name('audit-logs.show');

        // User role and permission assignment
        Route::post('users/{user}/assign-role', [\App\Http\Controllers\RolePermissionController::class, 'assignRoleToUser'])->name('users.assign-role');
        Route::delete('users/{user}/remove-role/{role}', [\App\Http\Controllers\RolePermissionController::class, 'removeRoleFromUser'])->name('users.remove-role');
        Route::post('users/{user}/assign-permission', [\App\Http\Controllers\RolePermissionController::class, 'assignPermissionToUser'])->name('users.assign-permission');
        Route::delete('users/{user}/remove-permission/{permission}', [\App\Http\Controllers\RolePermissionController::class, 'removePermissionFromUser'])->name('users.remove-permission');
    });

    // Mixed routes (Controller handles filtering)
    Route::post('employee-attendances/clock-in', [\App\Http\Controllers\EmployeeAttendanceController::class, 'clockIn'])->name('employee-attendances.clockIn');
    Route::post('employee-attendances/clock-out', [\App\Http\Controllers\EmployeeAttendanceController::class, 'clockOut'])->name('employee-attendances.clockOut');
    Route::post('employee-attendances/start-break', [\App\Http\Controllers\EmployeeAttendanceController::class, 'startBreak'])->name('employee-attendances.startBreak');
    Route::post('employee-attendances/end-break', [\App\Http\Controllers\EmployeeAttendanceController::class, 'endBreak'])->name('employee-attendances.endBreak');
    Route::resource('employee-attendances', \App\Http\Controllers\EmployeeAttendanceController::class);

    // Shift Roster custom routes (must be before resource route)
    Route::get('shift-rosters/{companySlug}/{employeeSlug}', [\App\Http\Controllers\ShiftRosterController::class, 'showEmployeeRoster'])->name('shift-rosters.showEmployeeRoster');
    Route::resource('shift-rosters', \App\Http\Controllers\ShiftRosterController::class);
    Route::post('leave-requests/bulk-approve', [\App\Http\Controllers\LeaveRequestController::class, 'bulkApprove'])->name('leave-requests.bulk-approve');
    Route::post('leave-requests/bulk-reject', [\App\Http\Controllers\LeaveRequestController::class, 'bulkReject'])->name('leave-requests.bulk-reject');
    Route::resource('leave-requests', \App\Http\Controllers\LeaveRequestController::class);
    Route::resource('salary-postings', \App\Http\Controllers\SalaryPostingController::class);
    Route::post('salary-postings/bulk-action', [\App\Http\Controllers\SalaryPostingController::class, 'bulkAction'])->name('salary-postings.bulk-action');
    Route::post('salary-postings/bulk-generate', [\App\Http\Controllers\SalaryPostingController::class, 'bulkGenerate'])->name('salary-postings.bulk-generate');
    Route::get('salary-postings/{salaryPosting}/slip', [\App\Http\Controllers\SalaryPostingController::class, 'generateSlip'])->name('salary-postings.slip');
    Route::resource('loans', \App\Http\Controllers\LoanController::class);
    Route::resource('advances', \App\Http\Controllers\AdvanceController::class);
    Route::resource('trainings', \App\Http\Controllers\TrainingController::class);
    Route::resource('training-assignments', \App\Http\Controllers\TrainingAssignmentController::class);
    Route::post('training-assignments/{assignment}/update-status', [\App\Http\Controllers\TrainingAssignmentController::class, 'updateStatus'])->name('training-assignments.updateStatus');
    Route::post('training-assignments/{assignment}/update-progress', [\App\Http\Controllers\TrainingAssignmentController::class, 'updateProgress'])->name('training-assignments.updateProgress');

    Route::resource('evaluations', \App\Http\Controllers\EmployeeEvaluationController::class);

    // Training Sessions
    Route::resource('training-sessions', \App\Http\Controllers\TrainingSessionController::class)->only(['store', 'update', 'destroy']);
    Route::get('training-sessions/{session}/attendance', [\App\Http\Controllers\TrainingSessionAttendanceController::class, 'index'])->name('training-sessions.attendance');
    Route::post('training-sessions/{session}/attendance', [\App\Http\Controllers\TrainingSessionAttendanceController::class, 'store'])->name('training-sessions.attendance.store');

    // Training Materials
    Route::post('trainings/{training}/materials', [\App\Http\Controllers\TrainingMaterialController::class, 'store'])->name('training-materials.store');
    Route::get('training-materials/{material}/download', [\App\Http\Controllers\TrainingMaterialController::class, 'download'])->name('training-materials.download');
    Route::delete('training-materials/{material}', [\App\Http\Controllers\TrainingMaterialController::class, 'destroy'])->name('training-materials.destroy');

    // Training Quizzes
    Route::post('trainings/{training}/quizzes', [\App\Http\Controllers\TrainingQuizController::class, 'store'])->name('training-quizzes.store');
    Route::post('training-quizzes/{quiz}/submit', [\App\Http\Controllers\TrainingQuizController::class, 'submit'])->name('training-quizzes.submit');
    Route::delete('training-quizzes/{quiz}', [\App\Http\Controllers\TrainingQuizController::class, 'destroy'])->name('training-quizzes.destroy');

    // Training Certificates
    Route::get('training-certificates/{certificate}', [\App\Http\Controllers\TrainingCertificateController::class, 'show'])->name('certificates.show');
    Route::post('training-assignments/{assignment}/generate-certificate', [\App\Http\Controllers\TrainingCertificateController::class, 'generate'])->name('certificates.generate');

    // Training Evaluations
    Route::post('training-assignments/{assignment}/evaluate', [\App\Http\Controllers\TrainingEvaluationController::class, 'store'])->name('training-evaluations.store');

    // Training Categories
    Route::resource('training-categories', \App\Http\Controllers\TrainingCategoryController::class);
    Route::resource('tasks', \App\Http\Controllers\TaskController::class);
    Route::get('my-tasks', [\App\Http\Controllers\TaskController::class, 'myTasks'])->name('my_tasks');
    Route::post('tasks/{task}/accept', [\App\Http\Controllers\TaskController::class, 'acceptTask'])->name('tasks.accept');
    Route::post('tasks/{task}/reject', [\App\Http\Controllers\TaskController::class, 'rejectTask'])->name('tasks.reject');
    Route::post('tasks/{task}/update-progress', [\App\Http\Controllers\TaskController::class, 'updateProgress'])->name('tasks.update-progress');
    Route::post('tasks/{task}/complete', [\App\Http\Controllers\TaskController::class, 'completeTask'])->name('tasks.complete');
    Route::post('tasks/{task}/block', [\App\Http\Controllers\TaskController::class, 'blockTask'])->name('tasks.block');
    Route::post('tasks/{task}/unblock', [\App\Http\Controllers\TaskController::class, 'unblockTask'])->name('tasks.unblock');
    Route::post('tasks/{task}/start-timer', [\App\Http\Controllers\TaskController::class, 'startTimer'])->name('tasks.start-timer');
    Route::post('tasks/{task}/stop-timer', [\App\Http\Controllers\TaskController::class, 'stopTimer'])->name('tasks.stop-timer');
    Route::post('tasks/{task}/add-checklist', [\App\Http\Controllers\TaskController::class, 'addChecklistItem'])->name('tasks.add-checklist');
    Route::post('tasks/checklist/{item}/toggle', [\App\Http\Controllers\TaskController::class, 'toggleChecklistItem'])->name('tasks.toggle-checklist');
    Route::post('tasks/{task}/request-extension', [\App\Http\Controllers\TaskController::class, 'requestExtension'])->name('tasks.request-extension');
    Route::post('tasks/{task}/comment', [\App\Http\Controllers\TaskController::class, 'addComment'])->name('tasks.add-comment');

    // Employee Documents
    Route::get('/employees/{employee}/documents', [\App\Http\Controllers\EmployeeDocumentController::class, 'index'])->name('employees.documents.index');
    Route::post('/employees/{employee}/documents', [\App\Http\Controllers\EmployeeDocumentController::class, 'store'])->name('employees.documents.store');
    Route::get('/employee-documents/{document}/download', [\App\Http\Controllers\EmployeeDocumentController::class, 'download'])->name('employee-documents.download');
    Route::delete('/employee-documents/{document}', [\App\Http\Controllers\EmployeeDocumentController::class, 'destroy'])->name('employee-documents.destroy');
    Route::get('/documents/expiring', [\App\Http\Controllers\EmployeeDocumentController::class, 'expiring'])->name('documents.expiring');

    // Document Types (Admin/HR only)
    Route::middleware('role:admin,hr')->group(function () {
        Route::resource('document-types', \App\Http\Controllers\DocumentTypeController::class);
    });

    Route::resource('task-assignments', \App\Http\Controllers\TaskAssignmentController::class);
    Route::resource('projects', \App\Http\Controllers\ProjectController::class);
    Route::resource('holidays', \App\Http\Controllers\HolidayController::class);
    Route::get('task-reports', [\App\Http\Controllers\TaskReportController::class, 'index'])->name('tasks.reports');
    Route::resource('grievances', \App\Http\Controllers\GrievanceController::class);
    Route::resource('warning-letters', \App\Http\Controllers\WarningLetterController::class)->only(['index', 'show', 'store']);

    // API Routes
    Route::get('/api/employees/by-company', [EmployeeController::class, 'getByCompany'])->name('api.employees.byCompany');
    Route::get('/api/employees/by-department', [EmployeeController::class, 'getByDepartment'])->name('api.employees.byDepartment');
    Route::get('/api/dropdown-options', [\App\Http\Controllers\DropdownOptionController::class, 'getOptions'])->name('api.dropdown-options');
    Route::get('/api/departments/by-branch', [\App\Http\Controllers\DepartmentController::class, 'getByBranch'])->name('api.departments.byBranch');
    Route::post('/dashboard/settings', [\App\Http\Controllers\DashboardSettingsController::class, 'update'])->name('dashboard.settings.update');

    // System Settings - Logo/Favicon Delete Routes (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::delete('/settings/system/logo', [\App\Http\Controllers\SettingsController::class, 'deleteSystemLogo'])->name('settings.system.deleteLogo');
        Route::delete('/settings/system/favicon', [\App\Http\Controllers\SettingsController::class, 'deleteSystemFavicon'])->name('settings.system.deleteFavicon');
        Route::delete('/settings/system/stamp', [\App\Http\Controllers\SettingsController::class, 'deleteSystemStamp'])->name('settings.system.deleteStamp');
    });

    // Notifications
    Route::post('notifications/{id}/mark-as-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::post('notifications/mark-all-as-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
});

Route::get('/certificates/verify/{code}', [\App\Http\Controllers\TrainingCertificateController::class, 'verify'])->name('certificates.verify');

Route::get('/logtest', function () {
    Log::info('Log test route hit!');
    return 'Logged!';
});

Route::get('/fix-whatsapp-token', function() {
    \App\Models\Setting::whereIn('key', ['whatsapp_api_token', 'meta_phone_number_id', 'whatsapp_template_name'])
        ->whereNotNull('company_id')
        ->delete();
    \Illuminate\Support\Facades\Cache::flush();
    return 'Fixed WhatsApp Token Issue!';
});

require __DIR__ . '/auth.php';
