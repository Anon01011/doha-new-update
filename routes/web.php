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
        Route::post('employees/{employee}/unlock', [EmployeeController::class, 'unlockProfile'])->name('employees.unlock');
        Route::get('employees/export', [EmployeeController::class, 'export'])->name('employees.export');
        Route::get('employees/download-template', [EmployeeController::class, 'downloadTemplate'])->name('employees.download-template');
        Route::post('employees/import', [EmployeeController::class, 'import'])->name('employees.import');
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
        Route::get('/settings/backup', [\App\Http\Controllers\BackupController::class, 'index'])->name('settings.backup');
        Route::post('/settings/backup/settings', [\App\Http\Controllers\BackupController::class, 'updateSettings'])->name('settings.backup.settings');
        Route::post('/settings/backup/create', [\App\Http\Controllers\BackupController::class, 'create'])->name('settings.backup.create');
        Route::get('/settings/backup/download/{filename}', [\App\Http\Controllers\BackupController::class, 'download'])->name('settings.backup.download');
        Route::delete('/settings/backup/{filename}', [\App\Http\Controllers\BackupController::class, 'destroy'])->name('settings.backup.destroy');
        Route::post('/settings/backup/restore', [\App\Http\Controllers\BackupController::class, 'restore'])->name('settings.backup.restore');
        Route::get('/settings/backup/export-excel', [\App\Http\Controllers\BackupController::class, 'exportAllExcel'])->name('settings.backup.export-excel');

        // Offboarding Settings
        Route::get('/settings/offboarding', [\App\Http\Controllers\SettingsController::class, 'offboardingSettings'])->name('settings.offboarding');
        Route::post('/settings/offboarding', [\App\Http\Controllers\SettingsController::class, 'updateOffboardingSettings'])->name('settings.offboarding.update');
        Route::get('/settings/offboarding/preview-template', [\App\Http\Controllers\SettingsController::class, 'previewRelievingLetterTemplate'])->name('settings.offboarding.previewTemplate');

        // Approval routes
        Route::post('leave-requests/{leaveRequest}/approve', [\App\Http\Controllers\LeaveRequestController::class, 'approve'])->name('leave-requests.approve');
        Route::post('leave-requests/{leaveRequest}/reject', [\App\Http\Controllers\LeaveRequestController::class, 'reject'])->name('leave-requests.reject');
        Route::post('leave-requests/{leaveRequest}/cancel', [\App\Http\Controllers\LeaveRequestController::class, 'cancel'])->name('leave-requests.cancel');
        Route::post('loans/{loan}/approve', [\App\Http\Controllers\LoanController::class, 'approve'])->name('loans.approve');
        Route::post('loans/{loan}/reject', [\App\Http\Controllers\LoanController::class, 'reject'])->name('loans.reject');
        Route::post('loans/{loan}/disburse', [\App\Http\Controllers\LoanController::class, 'disburse'])->name('loans.disburse');
        Route::post('loans/installments/{installment}/pay', [\App\Http\Controllers\LoanController::class, 'payInstallment'])->name('loans.installments.pay');
        Route::post('advances/{advance}/approve', [\App\Http\Controllers\AdvanceController::class, 'approve'])->name('advances.approve')->middleware('permission:approve-advances');
        Route::post('salary-postings/calculate', [\App\Http\Controllers\SalaryPostingController::class, 'calculateSalary'])->name('salary-postings.calculate')->middleware('permission:create-salary-postings');
        Route::post('salary-postings/{salaryPosting}/approve', [\App\Http\Controllers\SalaryPostingController::class, 'approve'])->name('salary-postings.approve')->middleware('permission:approve-salary-postings');
        Route::post('salary-postings/{salaryPosting}/reject', [\App\Http\Controllers\SalaryPostingController::class, 'reject'])->name('salary-postings.reject')->middleware('permission:approve-salary-postings');

        // Reports routes
        Route::prefix('reports')->name('reports.')->middleware('permission:view-reports')->group(function () {
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

            // Expense Reports
            Route::get('/expense', [\App\Http\Controllers\ReportController::class, 'expense'])->name('expense');
            Route::get('/expense/export/pdf', [\App\Http\Controllers\ReportController::class, 'expenseExportPdf'])->name('expense.export.pdf');
            Route::get('/expense/export/excel', [\App\Http\Controllers\ReportController::class, 'expenseExportExcel'])->name('expense.export.excel');

            // Offboarding Reports
            Route::get('/offboarding', [\App\Http\Controllers\ReportController::class, 'offboarding'])->name('offboarding');
            Route::get('/offboarding/export/excel', [\App\Http\Controllers\ReportController::class, 'offboardingExportExcel'])->name('offboarding.export.excel');
        });
    });

    // Roles, Permissions & Audit Logs
    Route::middleware('permission:manage-roles')->group(function () {
        Route::resource('roles', \App\Http\Controllers\RoleController::class);
        Route::post('users/{user}/assign-role', [\App\Http\Controllers\RolePermissionController::class, 'assignRoleToUser'])->name('users.assign-role');
        Route::delete('users/{user}/remove-role/{role}', [\App\Http\Controllers\RolePermissionController::class, 'removeRoleFromUser'])->name('users.remove-role');
    });

    Route::middleware('permission:manage-permissions')->group(function () {
        Route::resource('permissions', \App\Http\Controllers\PermissionController::class);
        Route::post('users/{user}/assign-permission', [\App\Http\Controllers\RolePermissionController::class, 'assignPermissionToUser'])->name('users.assign-permission');
        Route::delete('users/{user}/remove-permission/{permission}', [\App\Http\Controllers\RolePermissionController::class, 'removePermissionFromUser'])->name('users.remove-permission');
    });

    Route::middleware('permission:view-audit-logs')->group(function () {
        Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('audit-logs.index');
        Route::get('audit-logs/{auditLog}', [\App\Http\Controllers\AuditLogController::class, 'show'])->name('audit-logs.show');
    });

    // Live Attendance & Break Feed
    Route::get('attendance/live-feed', [\App\Http\Controllers\LiveAttendanceController::class, 'index'])->name('attendance.live-feed');
    Route::get('attendance/live-feed/data', [\App\Http\Controllers\LiveAttendanceController::class, 'data'])->name('attendance.live-feed.data');

    Route::post('employee-attendances/clock-in', [\App\Http\Controllers\EmployeeAttendanceController::class, 'clockIn'])->name('employee-attendances.clockIn');
    Route::post('employee-attendances/clock-out', [\App\Http\Controllers\EmployeeAttendanceController::class, 'clockOut'])->name('employee-attendances.clockOut');
    Route::post('employee-attendances/start-break', [\App\Http\Controllers\EmployeeAttendanceController::class, 'startBreak'])->name('employee-attendances.startBreak');
    Route::post('employee-attendances/end-break', [\App\Http\Controllers\EmployeeAttendanceController::class, 'endBreak'])->name('employee-attendances.endBreak');
    Route::resource('employee-attendances', \App\Http\Controllers\EmployeeAttendanceController::class);

    // Shift Roster custom routes (must be before resource route)
    Route::post('shift-rosters/check-conflicts', [\App\Http\Controllers\ShiftRosterController::class, 'checkConflicts'])->name('shift-rosters.checkConflicts');
    Route::get('shift-rosters/show-employee/{company}/{employee}', [\App\Http\Controllers\ShiftRosterController::class, 'showEmployeeRoster'])->name('shift-rosters.showEmployee');
    Route::post('shift-rosters/bulk-store', [\App\Http\Controllers\ShiftRosterController::class, 'bulkStore'])->name('shift-rosters.bulkStore');
    Route::post('shift-rosters/create-shift', [\App\Http\Controllers\ShiftRosterController::class, 'createShift'])->name('shift-rosters.createShift');
    Route::post('shift-rosters/duplicate-week', [\App\Http\Controllers\ShiftRosterController::class, 'duplicateWeek'])->name('shift-rosters.duplicateWeek');
    Route::post('shift-rosters/clear-week', [\App\Http\Controllers\ShiftRosterController::class, 'clearWeek'])->name('shift-rosters.clearWeek');
    Route::get('shift-rosters/export-week', [\App\Http\Controllers\ShiftRosterController::class, 'exportWeek'])->name('shift-rosters.exportWeek');
    Route::get('shift-rosters/export', [\App\Http\Controllers\ShiftRosterController::class, 'exportWeek'])->name('shift-rosters.export-week');
    Route::post('shift-rosters/batch-store', [\App\Http\Controllers\ShiftRosterController::class, 'batchStore'])->name('shift-rosters.batchStore');
    Route::post('shift-rosters/send-emails', [\App\Http\Controllers\ShiftRosterController::class, 'sendRosterEmails'])->name('shift-rosters.sendEmails');
    Route::post('shift-rosters/send-emails-selected', [\App\Http\Controllers\ShiftRosterController::class, 'sendRosterEmailsToSelected'])->name('shift-rosters.sendEmailsSelected');
    Route::post('shift-rosters/send-email-single', [\App\Http\Controllers\ShiftRosterController::class, 'sendRosterEmailToSingle'])->name('shift-rosters.sendEmailSingle');
    Route::get('shift-rosters/{companySlug}/{employeeSlug}', [\App\Http\Controllers\ShiftRosterController::class, 'showEmployeeRoster'])->name('shift-rosters.showEmployeeRoster');
    Route::post('shift-rosters/approve-roster', [\App\Http\Controllers\ShiftRosterController::class, 'approveRoster'])->name('shift-rosters.approve');
    Route::post('shift-rosters/reject-roster', [\App\Http\Controllers\ShiftRosterController::class, 'rejectRoster'])->name('shift-rosters.reject');
    Route::post('shift-rosters/reset-to-pending', [\App\Http\Controllers\ShiftRosterController::class, 'resetToPending'])->name('shift-rosters.resetToPending');
    Route::get('shift-rosters/management', [\App\Http\Controllers\ShiftRosterController::class, 'managementIndex'])->name('shift-rosters.management');
    Route::get('shift-rosters/batch-details', [\App\Http\Controllers\ShiftRosterController::class, 'getBatchDetails'])->name('shift-rosters.batchDetails');
    Route::resource('shift-rosters', \App\Http\Controllers\ShiftRosterController::class);
    Route::post('leave-requests/bulk-approve', [\App\Http\Controllers\LeaveRequestController::class, 'bulkApprove'])->name('leave-requests.bulk-approve');
    Route::post('leave-requests/bulk-reject', [\App\Http\Controllers\LeaveRequestController::class, 'bulkReject'])->name('leave-requests.bulk-reject');
    Route::resource('leave-requests', \App\Http\Controllers\LeaveRequestController::class);
    Route::resource('salary-postings', \App\Http\Controllers\SalaryPostingController::class);
    Route::post('salary-postings/bulk-action', [\App\Http\Controllers\SalaryPostingController::class, 'bulkAction'])->name('salary-postings.bulk-action')->middleware('throttle:10,1');
    Route::post('salary-postings/bulk-generate', [\App\Http\Controllers\SalaryPostingController::class, 'bulkGenerate'])->name('salary-postings.bulk-generate')->middleware('throttle:10,1');
    Route::post('salary-postings/auto-update', [\App\Http\Controllers\SalaryPostingController::class, 'autoUpdate'])->name('salary-postings.auto-update')->middleware('throttle:10,1');
    Route::get('salary-postings/{salaryPosting}/slip', [\App\Http\Controllers\SalaryPostingController::class, 'generateSlip'])->name('salary-postings.slip');
    Route::resource('loans', \App\Http\Controllers\LoanController::class);
    Route::resource('advances', \App\Http\Controllers\AdvanceController::class);
    Route::resource('trainings', \App\Http\Controllers\TrainingController::class);
    Route::resource('training-assignments', \App\Http\Controllers\TrainingAssignmentController::class);
    Route::post('training-assignments/{assignment}/update-status', [\App\Http\Controllers\TrainingAssignmentController::class, 'updateStatus'])->name('training-assignments.updateStatus');
    Route::post('training-assignments/{assignment}/update-progress', [\App\Http\Controllers\TrainingAssignmentController::class, 'updateProgress'])->name('training-assignments.updateProgress');

    Route::resource('evaluations', \App\Http\Controllers\EmployeeEvaluationController::class);
    Route::get('evaluations/{evaluation}/appraisal-letter', [\App\Http\Controllers\EmployeeEvaluationController::class, 'downloadAppraisalLetter'])->name('evaluations.appraisal-letter');
    Route::post('evaluations/{evaluation}/self-assessment', [\App\Http\Controllers\EmployeeEvaluationController::class, 'submitSelfAssessment'])->name('evaluations.self-assessment');
    Route::post('evaluations/{evaluation}/acknowledge', [\App\Http\Controllers\EmployeeEvaluationController::class, 'acknowledge'])->name('evaluations.acknowledge');
    Route::post('evaluations/{evaluation}/approve-close', [\App\Http\Controllers\EmployeeEvaluationController::class, 'approveAndClose'])->name('evaluations.approve-close');

    // Employee Expenses Module
    Route::resource('expense-categories', \App\Http\Controllers\ExpenseCategoryController::class);
    Route::resource('expenses', \App\Http\Controllers\ExpenseClaimController::class);
    Route::post('expenses/{expense}/submit', [\App\Http\Controllers\ExpenseClaimController::class, 'submit'])->name('expenses.submit');
    Route::post('expenses/{expense}/manager-approve', [\App\Http\Controllers\ExpenseClaimController::class, 'managerApprove'])->name('expenses.manager-approve');
    Route::post('expenses/{expense}/manager-reject', [\App\Http\Controllers\ExpenseClaimController::class, 'managerReject'])->name('expenses.manager-reject');
    Route::post('expenses/{expense}/return', [\App\Http\Controllers\ExpenseClaimController::class, 'returnClaim'])->name('expenses.return');
    Route::post('expenses/{expense}/finance-approve', [\App\Http\Controllers\ExpenseClaimController::class, 'financeApprove'])->name('expenses.finance-approve');
    Route::post('expenses/{expense}/finance-reject', [\App\Http\Controllers\ExpenseClaimController::class, 'financeReject'])->name('expenses.finance-reject');
    Route::post('expenses/{expense}/process-payment', [\App\Http\Controllers\ExpenseClaimController::class, 'processPayment'])->name('expenses.process-payment');

    // Offboarding Module
    // Security fix: the offboarding routes previously carried no role/permission
    // middleware at all, so any authenticated employee could approve, cancel or
    // delete another employee's offboarding request. The module is now restricted
    // to the management roles, and the state-changing endpoints additionally
    // enforce their own ownership / separation-of-duties checks in the controller.
    Route::middleware('role:admin,hr,manager')->group(function () {
        Route::resource('offboarding', \App\Http\Controllers\OffboardingController::class);
        Route::post('offboarding/{offboarding}/approve', [\App\Http\Controllers\OffboardingController::class, 'approve'])->name('offboarding.approve');
        Route::post('offboarding/{offboarding}/reject', [\App\Http\Controllers\OffboardingController::class, 'reject'])->name('offboarding.reject');
        Route::post('offboarding/{offboarding}/tasks/{task}', [\App\Http\Controllers\OffboardingController::class, 'updateTask'])->name('offboarding.tasks.update');
        Route::get('offboarding/{offboarding}/exit-interview', [\App\Http\Controllers\OffboardingController::class, 'exitInterview'])->name('offboarding.exit-interview');
        Route::post('offboarding/{offboarding}/exit-interview', [\App\Http\Controllers\OffboardingController::class, 'storeExitInterview'])->name('offboarding.exit-interview.store');
        Route::post('offboarding/{offboarding}/settlement', [\App\Http\Controllers\OffboardingController::class, 'settlementPreview'])->name('offboarding.settlement');
        Route::post('offboarding/{offboarding}/complete', [\App\Http\Controllers\OffboardingController::class, 'complete'])->name('offboarding.complete');
        Route::post('offboarding/{offboarding}/unlock', [\App\Http\Controllers\OffboardingController::class, 'unlockProfile'])->name('offboarding.unlock');
        Route::get('offboarding/{offboarding}/relieving-letter', [\App\Http\Controllers\OffboardingController::class, 'generateRelievingLetter'])->name('offboarding.relieving-letter');
        Route::get('offboarding/{offboarding}/relieving-letter/preview', [\App\Http\Controllers\OffboardingController::class, 'previewRelievingLetter'])->name('offboarding.relieving-letter.preview');
        Route::post('offboarding/{offboarding}/relieving-letter/email', [\App\Http\Controllers\OffboardingController::class, 'sendRelievingEmail'])->name('offboarding.relieving-letter.email');
    });


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
    Route::get('notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::get('notifications/poll', [\App\Http\Controllers\NotificationController::class, 'poll'])->name('notifications.poll');
    Route::post('notifications/{id}/mark-as-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.markAsRead');
    Route::post('notifications/mark-all-as-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.markAllAsRead');
    Route::delete('notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::post('notifications/clear-read', [\App\Http\Controllers\NotificationController::class, 'clearRead'])->name('notifications.clearRead');
});

// SECURITY FIX #9: Auth required + file extension allowlist to prevent:
// 1. Unauthenticated access to employee documents (passports, QIDs, salary slips)
// 2. Path traversal via crafted URLs serving .env / .php files
//
// SECURITY FIX #12: the route is split into two tiers.
//
//  - `/storage/branding/*` may be PUBLIC. The logo, the favicon and the
//    company stamp are rendered on the login and registration pages, which
//    are reachable by guests, and by the <link rel="icon"> tag in the layout.
//    Requiring a session for them produced a 403 and a broken favicon /
//    logo for every anonymous visitor. A path is only public when it lives
//    in the `branding` directory AND the exact value is referenced by a
//    setting that carries the `is_public` flag, so a stamp (which is
//    reproduced on salary slips) stays behind the session gate.
//
//  - every other `/storage/*` path stays AUTHENTICATED and additionally
//    enforces TENANT ISOLATION: a user may only fetch a file that belongs to
//    their own company. Employee documents, salary slips, receipts and leave
//    attachments are confidential, so a low-privileged user must not be able
//    to read another company's uploads by guessing a file name.
Route::get('/storage/{path}', function (Request $request, $path) {
    // Normalise the path and reject anything that tries to escape the root.
    $path = ltrim(str_replace('\\', '/', (string) $path), '/');

    if ($path === '' || str_contains($path, "\0")) {
        abort(404);
    }

    // SECURITY: Allowlist of safe file extensions that can be served.
    // `svg` is deliberately excluded: an SVG is an active document that can
    // carry <script>/onload payloads and would execute in the app's own origin
    // (stored XSS -> session theft / privilege escalation).
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ico'];
    $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedExtensions, true)) {
        abort(403, 'File type not allowed.');
    }

    // SECURITY: Prevent path traversal.
    //
    // The path is rejected on its own terms first (no .. segment, no
    // absolute path, no NUL byte) so that the authorisation check below can
    // run against a normalised path. The realpath() containment check is
    // kept as defence in depth before the file is actually read.
    foreach (explode('/', $path) as $segment) {
        if ($segment === '..') {
            abort(404);
        }
    }

    $access = app(\App\Services\StoredFileAccessService::class);
    $isPublic = $access->isPublicPath($path);

    // SECURITY FIX #12: tenant isolation.
    //
    // This check runs BEFORE the file is looked up on disk on purpose. If the
    // existence check came first, a user could tell a file that belongs to
    // another tenant (403) apart from a file that does not exist at all
    // (404) and use that as an oracle to confirm that a guessed file name is
    // real. Authorisation is therefore decided first, and only a caller that
    // is already allowed to see the file learns whether it exists.
    //
    // Administrators are trusted across tenants; every other user may only
    // reach files that belong to their own company. A file whose owner cannot
    // be determined is refused: an orphan file is not evidence of
    // authorisation.
    if (! $isPublic) {
        if (! auth()->check()) {
            abort(403, 'Authentication required to access this resource.');
        }

        $user = auth()->user();

        if (! $user->isAdmin()) {
            $companyId = $user->company_id ?: $user->employee?->company_id;

            if ($companyId === null) {
                abort(403, 'You are not authorized to access this file.');
            }

            $allowed = $access->allowedCompanyIds($path);

            if (! in_array((int) $companyId, $allowed, true)) {
                abort(403, 'You are not authorized to access this file.');
            }
        }
    }

    // SECURITY: resolve the real path and keep it inside the public disk.
    //
    // The path is resolved through the disk abstraction rather than through
    // storage_path() so that the route honours the configured disk root
    // and stays testable (Storage::fake('public') swaps that root).
    $disk = \Illuminate\Support\Facades\Storage::disk('public');

    $realBase = realpath($disk->path(''));
    $realFile = realpath($disk->path($path));

    if ($realBase === false || $realFile === false) {
        abort(404);
    }

    // The containment check compares against the base directory WITH its
    // trailing separator. A plain str_starts_with($file, $base) would also
    // accept a sibling directory whose name merely starts with the base
    // name (for example /storage/app/public-backup).
    $basePrefix = rtrim($realBase, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

    if (! str_starts_with($realFile, $basePrefix)) {
        abort(404);
    }

    if (! is_file($realFile)) {
        abort(404);
    }

    $mimeType = mime_content_type($realFile) ?: 'application/octet-stream';

    return response()->file($realFile, [
        'Content-Type' => $mimeType,
        'Cache-Control' => $isPublic ? 'public, max-age=86400' : 'private, max-age=3600',
        // Defence in depth: never let the browser sniff a type that enables
        // script execution, and never render an upload inline in the app origin.
        'X-Content-Type-Options' => 'nosniff',
        'Content-Security-Policy' => "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    ]);
})->where('path', '.*')->name('storage.fallback');

// SECURITY FIX #13: the /fix-storage-link utility was removed.
//
// It called artisan storage:link, which creates a public/storage shortcut
// pointing at storage/app/public. Once that shortcut exists the web server
// (PHP's built-in server, Apache with Options +FollowSymLinks, and nginx
// with a matching 	ry_files) serves every file in that directory as a
// STATIC file, so the request never reaches Laravel and the authentication
// gate, the extension allowlist and the tenant isolation enforced by the
// storage.fallback route are all bypassed.
//
// This was confirmed locally: with the shortcut in place an anonymous
// visitor received HTTP 200 and the full image body for an employee photo
// that lives in employee-images/, and removing the shortcut immediately
// restored the 403.
//
// The public disk is now served exclusively by the storage.fallback route,
// which enforces the session check and the tenant check in PHP.

require __DIR__ . '/auth.php';
