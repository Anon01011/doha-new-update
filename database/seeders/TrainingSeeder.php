<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Training;
use App\Models\TrainingSession;
use App\Models\TrainingAssignment;
use App\Models\TrainingMaterial;
use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use Carbon\Carbon;

class TrainingSeeder extends Seeder
{
    public function run()
    {
        // Get the first company or create one if none exists
        $company = Company::first();
        if (!$company) {
            $company = Company::create(['name' => 'Default Company']);
        }

        // Create a few sample trainings
        $trainings = [
            [
                'title' => 'Workplace Safety Fundamentals',
                'description' => 'Essential safety protocols and emergency procedures for all employees.',
                'category' => 'Compliance',
                'duration_hours' => 4.0,
                'trainer_name' => 'Safety Officer John',
                'location' => 'Main Conference Room',
                'start_date' => Carbon::now()->addDays(5),
                'end_date' => Carbon::now()->addDays(5),
                'max_participants' => 20,
                'status' => 'scheduled',
                'company_id' => $company->id,
            ],
            [
                'title' => 'Customer Service Excellence',
                'description' => 'Advanced techniques for handling customer inquiries and complaints.',
                'category' => 'Soft Skills',
                'duration_hours' => 6.0,
                'trainer_name' => 'Sarah Smith',
                'location' => 'Training Hall B',
                'start_date' => Carbon::now()->addDays(10),
                'end_date' => Carbon::now()->addDays(12),
                'max_participants' => 15,
                'status' => 'scheduled',
                'company_id' => $company->id,
            ],
            [
                'title' => 'New Software Onboarding',
                'description' => 'Training on the new internal management system.',
                'category' => 'Technical Skills',
                'duration_hours' => 2.5,
                'trainer_name' => 'IT Dept',
                'location' => 'Online (Zoom)',
                'start_date' => Carbon::now()->subDays(2),
                'end_date' => Carbon::now()->subDays(2),
                'max_participants' => 50,
                'status' => 'completed',
                'company_id' => $company->id,
            ],
        ];

        foreach ($trainings as $data) {
            $training = Training::create($data);

            // Create Sessions
            if ($training->status === 'scheduled') {
                TrainingSession::create([
                    'training_id' => $training->id,
                    'session_date' => $training->start_date,
                    'start_time' => '09:00:00',
                    'end_time' => '13:00:00',
                    'location' => $training->location,
                ]);
                if ($training->duration_hours > 4) {
                    TrainingSession::create([
                        'training_id' => $training->id,
                        'session_date' => Carbon::parse($training->start_date)->addDay(),
                        'start_time' => '09:00:00',
                        'end_time' => '11:00:00',
                        'location' => $training->location,
                    ]);
                }
            } elseif ($training->status === 'completed') {
                TrainingSession::create([
                    'training_id' => $training->id,
                    'session_date' => $training->start_date,
                    'start_time' => '14:00:00',
                    'end_time' => '16:30:00',
                    'location' => $training->location,
                ]);
            }

            // Create Materials (Dummy)
            TrainingMaterial::create([
                'training_id' => $training->id,
                'company_id' => $company->id,
                'title' => 'Course Syllabus',
                'description' => 'Outline of topics covered.',
                'file_path' => 'dummy/path/syllabus.pdf', // Placeholder
                'file_type' => 'pdf',
                'file_size' => 1024,
                'is_mandatory' => true,
            ]);

            // Assign Employees
            $employees = Employee::where('company_id', $company->id)->limit(5)->get();
            foreach ($employees as $employee) {
                TrainingAssignment::create([
                    'training_id' => $training->id,
                    'employee_id' => $employee->id,
                    'assigned_by' => 1, // Assuming admin ID 1
                    'assigned_date' => Carbon::now(),
                    'status' => $training->status === 'completed' ? 'completed' : 'in_progress',
                    'progress_percentage' => $training->status === 'completed' ? 100 : 0,
                    'company_id' => $company->id,
                ]);
            }
        }
    }
}
