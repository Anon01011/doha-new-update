<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default roles
        $adminRole = Role::updateOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Administrator',
                'description' => 'Full system access with all permissions',
                'is_active' => true,
            ]
        );

        $hrRole = Role::updateOrCreate(
            ['slug' => 'hr'],
            [
                'name' => 'Human Resource Manager',
                'description' => 'HR management access',
                'is_active' => true,
            ]
        );

        $managerRole = Role::updateOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Manager',
                'description' => 'Management and reporting access',
                'is_active' => true,
            ]
        );

        $employeeRole = Role::updateOrCreate(
            ['slug' => 'employee'],
            [
                'name' => 'Employee',
                'description' => 'Basic employee access',
                'is_active' => true,
            ]
        );

        // Create permissions by module
        $permissions = [
            // Employee Module
            ['name' => 'View Employees', 'slug' => 'view-employees', 'module' => 'employee', 'description' => 'Can view employee list'],
            ['name' => 'Create Employees', 'slug' => 'create-employees', 'module' => 'employee', 'description' => 'Can create new employees'],
            ['name' => 'Edit Employees', 'slug' => 'edit-employees', 'module' => 'employee', 'description' => 'Can edit employee information'],
            ['name' => 'Delete Employees', 'slug' => 'delete-employees', 'module' => 'employee', 'description' => 'Can delete employees'],

            // Attendance Module
            ['name' => 'View Attendance', 'slug' => 'view-attendance', 'module' => 'attendance', 'description' => 'Can view attendance records'],
            ['name' => 'Create Attendance', 'slug' => 'create-attendance', 'module' => 'attendance', 'description' => 'Can create attendance records'],
            ['name' => 'Edit Attendance', 'slug' => 'edit-attendance', 'module' => 'attendance', 'description' => 'Can edit attendance records'],
            ['name' => 'Delete Attendance', 'slug' => 'delete-attendance', 'module' => 'attendance', 'description' => 'Can delete attendance records'],

            // Shift Roster Module
            ['name' => 'View Shift Rosters', 'slug' => 'view-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can view shift rosters'],
            ['name' => 'Create Shift Rosters', 'slug' => 'create-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can create shift rosters'],
            ['name' => 'Edit Shift Rosters', 'slug' => 'edit-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can edit shift rosters'],
            ['name' => 'Delete Shift Rosters', 'slug' => 'delete-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can delete shift rosters'],
            ['name' => 'Manage Shift Rosters', 'slug' => 'manage-shift-rosters', 'module' => 'shift-roster', 'description' => 'Can manage shift rosters (bulk operations, export, email)'],

            // Leave Module
            ['name' => 'View Leave Requests', 'slug' => 'view-leave-requests', 'module' => 'leave', 'description' => 'Can view leave requests'],
            ['name' => 'Create Leave Requests', 'slug' => 'create-leave-requests', 'module' => 'leave', 'description' => 'Can create leave requests'],
            ['name' => 'Approve Leave Requests', 'slug' => 'approve-leave-requests', 'module' => 'leave', 'description' => 'Can approve leave requests'],
            ['name' => 'Reject Leave Requests', 'slug' => 'reject-leave-requests', 'module' => 'leave', 'description' => 'Can reject leave requests'],
            ['name' => 'Manage Leave Types', 'slug' => 'manage-leave-types', 'module' => 'leave', 'description' => 'Can manage leave types'],

            // Salary Module
            ['name' => 'View Salary Postings', 'slug' => 'view-salary-postings', 'module' => 'salary', 'description' => 'Can view salary postings'],
            ['name' => 'Create Salary Postings', 'slug' => 'create-salary-postings', 'module' => 'salary', 'description' => 'Can create salary postings'],
            ['name' => 'Edit Salary Postings', 'slug' => 'edit-salary-postings', 'module' => 'salary', 'description' => 'Can edit salary postings'],
            ['name' => 'Approve Salary Postings', 'slug' => 'approve-salary-postings', 'module' => 'salary', 'description' => 'Can approve salary postings'],
            ['name' => 'Manage Salary Components', 'slug' => 'manage-salary-components', 'module' => 'salary', 'description' => 'Can manage salary components'],

            // Loan & Advance Module
            ['name' => 'View Loans', 'slug' => 'view-loans', 'module' => 'loan', 'description' => 'Can view loans'],
            ['name' => 'Create Loans', 'slug' => 'create-loans', 'module' => 'loan', 'description' => 'Can create loans'],
            ['name' => 'Approve Loans', 'slug' => 'approve-loans', 'module' => 'loan', 'description' => 'Can approve loans'],
            ['name' => 'Disburse Loans', 'slug' => 'disburse-loans', 'module' => 'loan', 'description' => 'Can disburse loans'],
            ['name' => 'View Advances', 'slug' => 'view-advances', 'module' => 'loan', 'description' => 'Can view advances'],
            ['name' => 'Create Advances', 'slug' => 'create-advances', 'module' => 'loan', 'description' => 'Can create advances'],
            ['name' => 'Approve Advances', 'slug' => 'approve-advances', 'module' => 'loan', 'description' => 'Can approve advances'],

            // Training Module
            ['name' => 'View Trainings', 'slug' => 'view-trainings', 'module' => 'training', 'description' => 'Can view trainings'],
            ['name' => 'Create Trainings', 'slug' => 'create-trainings', 'module' => 'training', 'description' => 'Can create trainings'],
            ['name' => 'Edit Trainings', 'slug' => 'edit-trainings', 'module' => 'training', 'description' => 'Can edit trainings'],
            ['name' => 'Delete Trainings', 'slug' => 'delete-trainings', 'module' => 'training', 'description' => 'Can delete trainings'],
            ['name' => 'Assign Trainings', 'slug' => 'assign-trainings', 'module' => 'training', 'description' => 'Can assign trainings to employees'],

            // Training Assignment Module
            ['name' => 'View Training Assignments', 'slug' => 'view-training-assignments', 'module' => 'training-assignment', 'description' => 'Can view training assignments'],
            ['name' => 'Create Training Assignments', 'slug' => 'create-training-assignments', 'module' => 'training-assignment', 'description' => 'Can create training assignments'],
            ['name' => 'Edit Training Assignments', 'slug' => 'edit-training-assignments', 'module' => 'training-assignment', 'description' => 'Can edit training assignments'],
            ['name' => 'Update Training Assignment Status', 'slug' => 'update-training-assignment-status', 'module' => 'training-assignment', 'description' => 'Can update training assignment status'],

            // Task Module
            ['name' => 'View Tasks', 'slug' => 'view-tasks', 'module' => 'task', 'description' => 'Can view tasks'],
            ['name' => 'Create Tasks', 'slug' => 'create-tasks', 'module' => 'task', 'description' => 'Can create tasks'],
            ['name' => 'Edit Tasks', 'slug' => 'edit-tasks', 'module' => 'task', 'description' => 'Can edit tasks'],
            ['name' => 'Delete Tasks', 'slug' => 'delete-tasks', 'module' => 'task', 'description' => 'Can delete tasks'],
            ['name' => 'Assign Tasks', 'slug' => 'assign-tasks', 'module' => 'task', 'description' => 'Can assign tasks to employees'],

            // Task Assignment Module
            ['name' => 'View Task Assignments', 'slug' => 'view-task-assignments', 'module' => 'task-assignment', 'description' => 'Can view task assignments'],
            ['name' => 'Create Task Assignments', 'slug' => 'create-task-assignments', 'module' => 'task-assignment', 'description' => 'Can create task assignments'],
            ['name' => 'Edit Task Assignments', 'slug' => 'edit-task-assignments', 'module' => 'task-assignment', 'description' => 'Can edit task assignments'],

            // Grievance Module
            ['name' => 'View Grievances', 'slug' => 'view-grievances', 'module' => 'grievance', 'description' => 'Can view grievances'],
            ['name' => 'Create Grievances', 'slug' => 'create-grievances', 'module' => 'grievance', 'description' => 'Can create grievances'],
            ['name' => 'Manage Grievances', 'slug' => 'manage-grievances', 'module' => 'grievance', 'description' => 'Can manage grievances'],

            // Warning Letter Module
            ['name' => 'View Warning Letters', 'slug' => 'view-warning-letters', 'module' => 'warning-letter', 'description' => 'Can view warning letters'],
            ['name' => 'Manage Warning Letters', 'slug' => 'manage-warning-letters', 'module' => 'warning-letter', 'description' => 'Can manage warning letters'],

            // Audit Log Module
            ['name' => 'View Audit Logs', 'slug' => 'view-audit-logs', 'module' => 'audit-log', 'description' => 'Can view system audit logs'],

            // Reports Module
            ['name' => 'View Reports', 'slug' => 'view-reports', 'module' => 'report', 'description' => 'Can view all reports'],
            ['name' => 'View Attendance Reports', 'slug' => 'view-attendance-reports', 'module' => 'report', 'description' => 'Can view attendance reports'],
            ['name' => 'View Leave Reports', 'slug' => 'view-leave-reports', 'module' => 'report', 'description' => 'Can view leave reports'],
            ['name' => 'View Salary Reports', 'slug' => 'view-salary-reports', 'module' => 'report', 'description' => 'Can view salary reports'],
            ['name' => 'View Loan Reports', 'slug' => 'view-loan-reports', 'module' => 'report', 'description' => 'Can view loan reports'],
            ['name' => 'View Training Reports', 'slug' => 'view-training-reports', 'module' => 'report', 'description' => 'Can view training reports'],
            ['name' => 'View Task Reports', 'slug' => 'view-task-reports', 'module' => 'report', 'description' => 'Can view task reports'],
            ['name' => 'View Grievance Reports', 'slug' => 'view-grievance-reports', 'module' => 'report', 'description' => 'Can view grievance reports'],

            // Settings Module
            ['name' => 'Manage Settings', 'slug' => 'manage-settings', 'module' => 'settings', 'description' => 'Can manage system settings'],

            // Role & Permission Module
            ['name' => 'Manage Roles', 'slug' => 'manage-roles', 'module' => 'role', 'description' => 'Can manage roles'],
            ['name' => 'Manage Permissions', 'slug' => 'manage-permissions', 'module' => 'role', 'description' => 'Can manage permissions'],
            ['name' => 'Assign Roles', 'slug' => 'assign-roles', 'module' => 'role', 'description' => 'Can assign roles to users'],
            ['name' => 'Assign Permissions', 'slug' => 'assign-permissions', 'module' => 'role', 'description' => 'Can assign permissions to users'],

            // Company & Department Module
            ['name' => 'Manage Companies', 'slug' => 'manage-companies', 'module' => 'company', 'description' => 'Can manage companies/branches'],
            ['name' => 'Manage Departments', 'slug' => 'manage-departments', 'module' => 'company', 'description' => 'Can manage departments'],
        ];

        $permissionModels = [];
        foreach ($permissions as $permission) {
            $permissionModels[] = Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                [
                    'name' => $permission['name'],
                    'module' => $permission['module'],
                    'description' => $permission['description'],
                    'is_active' => true,
                ]
            );
        }

        // Assign all permissions to admin role
        $adminRole->assignPermissions(collect($permissionModels)->pluck('id')->toArray());

        // Assign HR permissions
        $hrPermissions = collect($permissionModels)->filter(function ($p) {
            return in_array($p->module, ['employee', 'leave', 'salary', 'loan', 'grievance', 'attendance', 'report', 'shift-roster', 'training', 'training-assignment', 'task', 'task-assignment', 'warning-letter'])
                && !in_array($p->slug, ['delete-employees', 'manage-settings', 'manage-roles', 'manage-permissions', 'delete-trainings', 'delete-tasks']);
        })->pluck('id')->toArray();
        $hrRole->assignPermissions($hrPermissions);

        // Assign Manager permissions
        $managerPermissions = collect($permissionModels)->filter(function ($p) {
            return in_array($p->slug, [
                'view-employees',
                'view-attendance',
                'view-leave-requests',
                'approve-leave-requests',
                'reject-leave-requests',
                'view-tasks',
                'create-tasks',
                'edit-tasks',
                'assign-tasks',
                'view-task-assignments',
                'create-task-assignments',
                'edit-task-assignments',
                'view-reports',
                'view-attendance-reports',
                'view-leave-reports',
                'view-task-reports',
                'manage-leave-types', // Added permission
            ]);
        })->pluck('id')->toArray();
        $managerRole->assignPermissions($managerPermissions);

        // Assign Employee permissions (limited)
        $employeePermissions = collect($permissionModels)->filter(function ($p) {
            return in_array($p->slug, [
                'view-employees', // Only their own
                'view-attendance', // Only their own
                'view-leave-requests', // Only their own
                'create-leave-requests',
                'view-salary-postings', // Only their own
                'view-loans', // Only their own
                'create-loans',
                'view-advances', // Only their own
                'create-advances',
                'view-trainings', // Assigned to them
                'view-training-assignments', // Assigned to them
                'view-tasks', // Assigned to them
                'view-task-assignments', // Assigned to them
                'view-grievances', // Only their own
                'create-grievances',
            ]);
        })->pluck('id')->toArray();
        $employeeRole->assignPermissions($employeePermissions);

        // Assign roles to existing users based on their role field
        User::chunk(100, function ($users) use ($adminRole, $hrRole, $managerRole, $employeeRole) {
            foreach ($users as $user) {
                if ($user->role === 'admin' && !$user->roles()->where('slug', 'admin')->exists()) {
                    $user->assignRole($adminRole);
                } elseif ($user->role === 'hr' && !$user->roles()->where('slug', 'hr')->exists()) {
                    $user->assignRole($hrRole);
                } elseif ($user->role === 'manager' && !$user->roles()->where('slug', 'manager')->exists()) {
                    $user->assignRole($managerRole);
                } elseif ($user->role === 'employee' && !$user->roles()->where('slug', 'employee')->exists()) {
                    $user->assignRole($employeeRole);
                }
            }
        });

        $this->command->info('Roles and permissions seeded successfully!');
    }
}
