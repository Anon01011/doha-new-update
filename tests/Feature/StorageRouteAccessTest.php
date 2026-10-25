<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Regression tests for the `/storage/{path}` fallback route.
 *
 * The route serves files that live on the public disk. Before the fix it
 * only checked that the visitor was authenticated, which meant:
 *
 *  1. a guest could not load the logo / favicon that the login page renders
 *     (HTTP 403 -> broken branding on the login and registration screens);
 *  2. any authenticated user could download ANY company's employee photos,
 *     passports, QIDs, salary slips and expense receipts by guessing the
 *     file name (cross-tenant IDOR);
 *  3. the answer to "does this file exist?" leaked, because a foreign file
 *     returned 403 while a missing file returned 404.
 *
 * @see routes/web.php (storage.fallback)
 * @see app/Services/StoredFileAccessService.php
 */
class StorageRouteAccessTest extends TestCase
{
    use RefreshDatabase;

    protected Company $companyA;

    protected Company $companyB;

    protected User $admin;

    protected User $userA;

    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        foreach (['admin' => 'Administrator', 'employee' => 'Employee'] as $slug => $name) {
            Role::create(['name' => $name, 'slug' => $slug, 'is_active' => true]);
        }

        $this->companyA = Company::create(['name' => 'Branch A']);
        $this->companyB = Company::create(['name' => 'Branch B']);

        $this->admin = $this->makeUser('Admin', 'admin@example.com', 'admin', $this->companyA);
        $this->userA = $this->makeUser('Staff A', 'a@example.com', 'employee', $this->companyA);
        $this->userB = $this->makeUser('Staff B', 'b@example.com', 'employee', $this->companyB);
    }

    protected function makeUser(string $name, string $email, string $role, Company $company): User
    {
        $employee = Employee::create([
            'name' => $name,
            'email' => $email,
            'employee_code' => strtoupper(str_replace(' ', '', $name)) . '@' . substr(md5($email), 0, 6),
            'company_id' => $company->id,
            'is_active' => true,
            'gender' => 'Male',
            'basic_salary' => 1000,
        ]);

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => $role,
            'employee_id' => $employee->id,
            'company_id' => $company->id,
        ]);

        $user->roles()->sync([Role::where('slug', $role)->value('id')]);

        return $user;
    }

    /**
     * Store a one pixel PNG on the fake public disk.
     */
    protected function storePng(string $path): void
    {
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        );

        Storage::disk('public')->put($path, $png);
    }

    // =====================================================================
    // Public branding
    // =====================================================================

    public function test_guest_can_load_the_public_logo(): void
    {
        Setting::create([
            'key' => 'app_logo',
            'value' => 'branding/logo.png',
            'is_public' => true,
        ]);

        $this->storePng('branding/logo.png');

        $this->get('/storage/branding/logo.png')->assertOk();
    }

    public function test_guest_cannot_load_a_branding_file_that_is_not_flagged_public(): void
    {
        // The company stamp is reproduced on salary slips, so it must not be
        // handed to an anonymous visitor.
        Setting::create([
            'key' => 'company_stamp',
            'value' => 'branding/stamp.png',
            'is_public' => false,
        ]);

        $this->storePng('branding/stamp.png');

        $this->get('/storage/branding/stamp.png')->assertForbidden();
    }

    public function test_guest_cannot_load_a_branding_file_that_no_setting_references(): void
    {
        $this->storePng('branding/orphan.png');

        $this->get('/storage/branding/orphan.png')->assertForbidden();
    }

    // =====================================================================
    // Authentication gate
    // =====================================================================

    public function test_guest_cannot_load_an_employee_image(): void
    {
        $this->storePng('employee-images/secret.png');

        $this->get('/storage/employee-images/secret.png')->assertForbidden();
    }

    public function test_guest_cannot_load_an_expense_receipt(): void
    {
        $this->storePng('expense_receipts/secret.png');

        $this->get('/storage/expense_receipts/secret.png')->assertForbidden();
    }

    // =====================================================================
    // Tenant isolation
    // =====================================================================

    public function test_user_of_another_company_cannot_read_a_foreign_employee_image(): void
    {
        $employee = Employee::find($this->userA->employee_id);
        $employee->employee_image = 'employee-images/owned-by-a.png';
        $employee->save();

        $this->storePng('employee-images/owned-by-a.png');

        // The owner can read it.
        $this->actingAs($this->userA)
            ->get('/storage/employee-images/owned-by-a.png')
            ->assertOk();

        // A user of a different company cannot.
        $this->actingAs($this->userB)
            ->get('/storage/employee-images/owned-by-a.png')
            ->assertForbidden();
    }

    public function test_admin_may_read_a_file_of_another_company(): void
    {
        $employee = Employee::find($this->userB->employee_id);
        $employee->employee_image = 'employee-images/owned-by-b.png';
        $employee->save();

        $this->storePng('employee-images/owned-by-b.png');

        $this->actingAs($this->admin)
            ->get('/storage/employee-images/owned-by-b.png')
            ->assertOk();
    }

    public function test_a_file_without_a_resolvable_owner_is_refused(): void
    {
        $this->storePng('employee-images/orphan.png');

        $this->actingAs($this->userA)
            ->get('/storage/employee-images/orphan.png')
            ->assertForbidden();
    }

    // =====================================================================
    // Existence oracle
    // =====================================================================

    public function test_a_foreign_file_and_a_missing_file_are_indistinguishable(): void
    {
        $employee = Employee::find($this->userB->employee_id);
        $employee->employee_image = 'employee-images/owned-by-b.png';
        $employee->save();

        $this->storePng('employee-images/owned-by-b.png');

        $foreign = $this->actingAs($this->userA)
            ->get('/storage/employee-images/owned-by-b.png')
            ->getStatusCode();

        $missing = $this->actingAs($this->userA)
            ->get('/storage/employee-images/does-not-exist.png')
            ->getStatusCode();

        $this->assertSame(
            $foreign,
            $missing,
            'A foreign file and a missing file must not be distinguishable, otherwise the route is an existence oracle.'
        );
    }

    // =====================================================================
    // Path traversal and file type
    // =====================================================================

    public function test_path_traversal_is_rejected(): void
    {
        $this->get('/storage/..%2F..%2F.env')->assertForbidden();

        $this->get('/storage/branding/..%2F..%2F.env')->assertForbidden();
    }

    public function test_a_dangerous_extension_is_rejected(): void
    {
        $this->storePng('branding/payload.svg');

        $this->get('/storage/branding/payload.svg')->assertForbidden();
    }

    public function test_a_script_extension_is_rejected(): void
    {
        Storage::disk('public')->put('branding/payload.php', '<?php echo 1;');

        $this->get('/storage/branding/payload.php')->assertForbidden();
    }

    // =====================================================================
    // Response hardening
    // =====================================================================

    public function test_a_served_file_carries_hardening_headers(): void
    {
        Setting::create([
            'key' => 'app_logo',
            'value' => 'branding/logo.png',
            'is_public' => true,
        ]);

        $this->storePng('branding/logo.png');

        $response = $this->get('/storage/branding/logo.png');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}