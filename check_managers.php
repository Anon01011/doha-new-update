<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Employee;
use App\Models\User;

$empQuery = Employee::withoutGlobalScope('company')->with('company:id,name');

$managers = Employee::withoutGlobalScope('company')
    ->with('company:id,name')
    ->where(function ($q) {
        $q->where('designation', 'LIKE', '%Manager%')
          ->orWhere('designation', 'LIKE', '%HR%')
          ->orWhere('designation', 'LIKE', '%Human Resource%')
          ->orWhere('designation', 'LIKE', '%Supervisor%')
          ->orWhere('designation', 'LIKE', '%Lead%');
    })
    ->orWhereHas('user', function ($q) {
        $q->whereIn('role', ['hr', 'manager'])
          ->orWhereHas('roles', function ($rq) {
              $rq->whereIn('slug', ['hr', 'manager', 'branch-manager']);
          });
    })
    ->active()
    ->get();

echo "Current getManagerAndHrEmployees count: " . $managers->count() . PHP_EOL;
foreach ($managers->take(10) as $m) {
    echo "- ID: {$m->id} | Name: {$m->name} | Branch: " . ($m->company?->name ?? 'None') . " | Desig: {$m->designation} | Role: {$m->role}" . PHP_EOL;
}

echo PHP_EOL . "--- All Users with HR / Manager / Admin role ---" . PHP_EOL;
$users = User::with('employee.company')->get();
$mgmtUsers = $users->filter(function($u) {
    return $u->isAdmin() || $u->isHR() || $u->isManager() || in_array($u->role, ['admin', 'hr', 'manager', 'branch-manager'])
        || $u->roles()->whereIn('slug', ['admin', 'hr', 'manager', 'branch-manager'])->exists();
});
echo "Management users count: " . $mgmtUsers->count() . PHP_EOL;
foreach ($mgmtUsers->take(15) as $u) {
    echo "- User: {$u->name} | Role: {$u->role} | Emp ID: {$u->employee_id} | Emp Name: " . ($u->employee?->name ?? 'NO EMP') . " | Branch: " . ($u->employee?->company?->name ?? $u->company_id) . PHP_EOL;
}

echo PHP_EOL . "--- All Employees with role in (hr, manager, admin, branch-manager) ---" . PHP_EOL;
$roleEmps = Employee::withoutGlobalScope('company')->with('company:id,name')->whereIn('role', ['hr', 'manager', 'admin', 'branch-manager'])->get();
echo "Role emps count: " . $roleEmps->count() . PHP_EOL;
foreach ($roleEmps->take(10) as $re) {
    echo "- Emp: {$re->name} | Role: {$re->role} | Desig: {$re->designation} | Branch: " . ($re->company?->name ?? 'None') . PHP_EOL;
}

