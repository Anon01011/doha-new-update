<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Department;
use App\Models\ShiftRoster;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\ExpenseClaim;
use App\Models\ExpenseCategory;
use App\Models\Role;
use App\Models\Permission;
use App\Services\EmployeeAuthorizationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Notification;

class CrossBranchReportingAccessTest extends TestCase
{
    use DatabaseTransactions;

    protected Company $companyA;
    protected Company $companyB;
    protected Department $deptA;
    protected Department $deptB;
    protected Employee $managerEmpA;
    protected User $managerUserA;
    protected Employee $subordinateEmpB;
    protected User $subordinateUserB;
    protected Employee $unrelatedEmpB;
    protected User $unrelatedUserB;

    protected function setUp(): void
    {
        parent::setUp();

        // Disable CSRF for state-changing requests in this test suite
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        EmployeeAuthorizationService::clearCache();

        // Ensure roles and permissions
        $managerRole = Role::firstOrCreate(['slug' => 'manager'], ['name' => 'Manager', 'is_active' => true]);
        $employeeRole = Role::firstOrCreate(['slug' => 'employee'], ['name' => 'Employee', 'is_active' => true]);

        // Attach required manager permissions
        $mgrPermSlugs = ['edit-shift-rosters', 'manage-shift-rosters', 'create-shift-rosters', 'view-shift-rosters', 'approve-leave-requests', 'approve-expenses-manager', 'view-attendance', 'manage-attendance', 'view-employees'];
        $permIds = [];
        foreach ($mgrPermSlugs as $slug) {
            $p = Permission::firstOrCreate(['slug' => $slug], ['name' => ucwords(str_replace('-', ' ', $slug)), 'is_active' => true]);
            $permIds[] = $p->id;
        }
        $managerRole->permissions()->sync($permIds);

        // Create two distinct companies / branches
        $this->companyA = Company::create([
            'name' => 'Branch Alpha',
            'slug' => 'branch-alpha-' . uniqid(),
            'is_active' => true,
        ]);

        $this->companyB = Company::create([
            'name' => 'Branch Beta',
            'slug' => 'branch-beta-' . uniqid(),
            'is_active' => true,
        ]);

        // Create two departments in their respective companies
        $this->deptA = Department::create([
            'name' => 'Finance Dept',
            'company_id' => $this->companyA->id,
            'is_active' => true,
        ]);
        $this->deptA->companies()->attach($this->companyA->id);

        $this->deptB = Department::create([
            'name' => 'Operations Dept',
            'company_id' => $this->companyB->id,
            'is_active' => true,
        ]);
        $this->deptB->companies()->attach($this->companyB->id);

        // Manager A in Branch A / Dept A
        $this->managerEmpA = Employee::create([
            'name' => 'Manager Alpha',
            'employee_code' => 'MGR-A-' . uniqid(),
            'email' => 'manager.a.' . uniqid() . '@example.com',
            'company_id' => $this->companyA->id,
            'department_id' => $this->deptA->id,
            'designation' => 'Finance Manager',
            'role' => 'manager',
            'gender' => 'Male',
        ]);

        $this->managerUserA = User::create([
            'name' => 'Manager Alpha User',
            'email' => $this->managerEmpA->email,
            'password' => bcrypt('secret123'),
            'company_id' => $this->companyA->id,
            'employee_id' => $this->managerEmpA->id,
            'role' => 'manager',
        ]);
        $this->managerUserA->roles()->sync([$managerRole->id]);

        // Subordinate B in Branch B / Dept B (REPORTS TO Manager A)
        $this->subordinateEmpB = Employee::create([
            'name' => 'Subordinate Beta',
            'employee_code' => 'SUB-B-' . uniqid(),
            'email' => 'subordinate.b.' . uniqid() . '@example.com',
            'company_id' => $this->companyB->id,
            'department_id' => $this->deptB->id,
            'designation' => 'Operations Specialist',
            'reports_to_id' => $this->managerEmpA->id,
            'role' => 'employee',
            'gender' => 'Female',
        ]);

        $this->subordinateUserB = User::create([
            'name' => 'Subordinate Beta User',
            'email' => $this->subordinateEmpB->email,
            'password' => bcrypt('secret123'),
            'company_id' => $this->companyB->id,
            'employee_id' => $this->subordinateEmpB->id,
            'role' => 'employee',
        ]);
        $this->subordinateUserB->roles()->sync([$employeeRole->id]);

        // Unrelated Employee in Branch B (DOES NOT report to Manager A)
        $this->unrelatedEmpB = Employee::create([
            'name' => 'Unrelated Beta',
            'employee_code' => 'UNR-B-' . uniqid(),
            'email' => 'unrelated.b.' . uniqid() . '@example.com',
            'company_id' => $this->companyB->id,
            'department_id' => $this->deptB->id,
            'designation' => 'Operations Officer',
            'reports_to_id' => null,
            'role' => 'employee',
            'gender' => 'Male',
        ]);

        $this->unrelatedUserB = User::create([
            'name' => 'Unrelated Beta User',
            'email' => $this->unrelatedEmpB->email,
            'password' => bcrypt('secret123'),
            'company_id' => $this->companyB->id,
            'employee_id' => $this->unrelatedEmpB->id,
            'role' => 'employee',
        ]);
        $this->unrelatedUserB->roles()->sync([$employeeRole->id]);
    }

    /**
     * Test 1: Service recognizes direct cross-branch reporting relationship.
     */
    public function test_service_recognizes_cross_branch_reporting_relationship()
    {
        $this->assertTrue(EmployeeAuthorizationService::isReportingPerson($this->managerUserA, $this->subordinateEmpB));
        $this->assertTrue($this->managerUserA->isReportingManagerFor($this->subordinateEmpB));

        // Unrelated employee in Branch B does NOT report to Manager A
        $this->assertFalse(EmployeeAuthorizationService::isReportingPerson($this->managerUserA, $this->unrelatedEmpB));
        $this->assertFalse($this->managerUserA->isReportingManagerFor($this->unrelatedEmpB));
    }

    /**
     * Test 2: Subordinate IDs collection includes cross-branch direct reports.
     */
    public function test_subordinate_ids_includes_cross_branch_reports()
    {
        $subIds = $this->managerUserA->getSubordinateEmployeeIds();
        $this->assertTrue($subIds->contains($this->subordinateEmpB->id));
        $this->assertFalse($subIds->contains($this->unrelatedEmpB->id));
    }

    /**
     * Test 3: Manager A can manage roster for cross-branch subordinate.
     */
    public function test_manager_can_manage_roster_for_cross_branch_subordinate()
    {
        $this->actingAs($this->managerUserA);

        $shiftRoster = ShiftRoster::create([
            'company_id' => $this->companyB->id,
            'employee_id' => $this->subordinateEmpB->id,
            'week_start' => now()->startOfWeek()->toDateString(),
            'date' => now()->startOfWeek()->toDateString(),
            'day' => 'Monday',
            'shift_time' => '8:00 AM - 5:00 PM',
            'shift_type' => 'Full Day',
            'status' => 'pending',
        ]);

        $this->assertTrue(EmployeeAuthorizationService::canManageRoster($this->managerUserA, $shiftRoster));

        // Test update endpoint
        $response = $this->put(route('shift-rosters.update', $shiftRoster->id), [
            'shift_time' => '9:00 AM - 6:00 PM',
            'shift_type' => 'Morning',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('9:00 AM - 6:00 PM', $shiftRoster->fresh()->shift_time);
    }

    /**
     * Test 4: Manager A CANNOT manage roster for unrelated employee in Branch B.
     */
    public function test_manager_cannot_manage_roster_for_unrelated_cross_branch_employee()
    {
        $this->actingAs($this->managerUserA);

        $unrelatedRoster = ShiftRoster::create([
            'company_id' => $this->companyB->id,
            'employee_id' => $this->unrelatedEmpB->id,
            'week_start' => now()->startOfWeek()->toDateString(),
            'date' => now()->startOfWeek()->toDateString(),
            'day' => 'Monday',
            'shift_time' => '8:00 AM - 5:00 PM',
            'shift_type' => 'Full Day',
            'status' => 'pending',
        ]);

        $this->assertFalse(EmployeeAuthorizationService::canManageRoster($this->managerUserA, $unrelatedRoster));

        // Update must be denied (403)
        $response = $this->put(route('shift-rosters.update', $unrelatedRoster->id), [
            'shift_time' => '10:00 AM - 7:00 PM',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test 5: Manager A can approve leave request for cross-branch subordinate.
     */
    public function test_manager_can_approve_leave_for_cross_branch_subordinate()
    {
        $this->actingAs($this->managerUserA);

        $leaveType = LeaveType::firstOrCreate(
            ['code' => 'ANNUAL-' . uniqid()],
            ['name' => 'Annual Leave', 'company_id' => $this->companyB->id, 'max_days_per_year' => 30, 'is_active' => true]
        );

        $leaveRequest = LeaveRequest::create([
            'company_id' => $this->companyB->id,
            'employee_id' => $this->subordinateEmpB->id,
            'leave_type_id' => $leaveType->id,
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'days_requested' => 3,
            'reason' => 'Annual holiday',
            'status' => 'pending',
            'manager_id' => $this->managerEmpA->id,
            'manager_approval_status' => 'pending',
        ]);

        $response = $this->post(route('leave-requests.approve', $leaveRequest->id), [
            'remarks' => 'Approved by cross-branch manager',
        ]);

        $response->assertRedirect();
        $this->assertEquals('approved', $leaveRequest->fresh()->manager_approval_status);
    }

    /**
     * Test 6: Manager A can approve expense claim for cross-branch subordinate.
     */
    public function test_manager_can_approve_expense_for_cross_branch_subordinate()
    {
        $this->actingAs($this->managerUserA);

        $category = ExpenseCategory::firstOrCreate(
            ['name' => 'Travel'],
            ['company_id' => $this->companyB->id, 'code' => 'TRV', 'is_active' => true]
        );

        $expenseClaim = ExpenseClaim::create([
            'claim_number' => 'EXP-' . uniqid(),
            'company_id' => $this->companyB->id,
            'employee_id' => $this->subordinateEmpB->id,
            'expense_category_id' => $category->id,
            'amount' => 350.00,
            'expense_date' => now()->toDateString(),
            'business_purpose' => 'Operations cross-site travel',
            'status' => 'submitted',
        ]);

        $response = $this->post(route('expenses.manager-approve', $expenseClaim->id), [
            'manager_comments' => 'Verified and approved cross-branch.',
        ]);

        $response->assertRedirect();
        $this->assertEquals('manager_approved', $expenseClaim->fresh()->status);
    }

    /**
     * Test 7: Circular reporting is detected and blocked.
     */
    public function test_circular_reporting_is_detected_and_prevented()
    {
        // Manager A is currently manager of Subordinate B
        // Trying to set Manager A's manager to Subordinate B must be detected as a cycle!
        $this->assertTrue(EmployeeAuthorizationService::detectReportingCycle($this->managerEmpA->id, $this->subordinateEmpB->id));

        // Self-reporting is also a cycle
        $this->assertTrue(EmployeeAuthorizationService::detectReportingCycle($this->managerEmpA->id, $this->managerEmpA->id));

        // Setting to unrelated employee is NOT a cycle
        $this->assertFalse(EmployeeAuthorizationService::detectReportingCycle($this->managerEmpA->id, $this->unrelatedEmpB->id));
    }
}
