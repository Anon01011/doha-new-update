<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Task;
use Carbon\Carbon;

class ProcessRecurringTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:process-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process recurring tasks and generate next occurrences';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Processing recurring tasks...');

        $tasks = Task::where('is_recurring', true)
            ->whereNotNull('recurrence_pattern')
            ->where('due_date', '<=', now()->toDateString())
            ->get();

        foreach ($tasks as $task) {
            $this->generateNextOccurrence($task);
        }

        $this->info('Finished processing recurring tasks.');
    }

    private function generateNextOccurrence(Task $task)
    {
        $nextDueDate = $this->calculateNextDueDate($task->due_date, $task->recurrence_pattern);

        if (!$nextDueDate) {
            return;
        }

        // Check if the next occurrence already exists to avoid duplicates
        $exists = Task::where('parent_id', $task->id)
            ->where('due_date', $nextDueDate->toDateString())
            ->exists();

        if ($exists) {
            return;
        }

        // Create the new task
        $newTask = $task->replicate(['status', 'is_blocked', 'blocked_reason']);
        $newTask->due_date = $nextDueDate;
        $newTask->status = 'pending';
        $newTask->parent_id = $task->id; // Link to the original task
        $newTask->save();

        // Replicate assignments if any
        foreach ($task->assignments as $assignment) {
            $newTask->assignments()->create([
                'employee_id' => $assignment->employee_id,
                'assigned_by' => $assignment->assigned_by,
                'assigned_date' => now()->toDateString(),
                'acceptance_status' => 'pending',
                'progress_percentage' => 0,
            ]);
        }

        $this->info("Generated next occurrence for task: {$task->title} (Due: {$nextDueDate->toDateString()})");
    }

    private function calculateNextDueDate($currentDueDate, $pattern)
    {
        $date = Carbon::parse($currentDueDate);

        switch (strtolower($pattern)) {
            case 'daily':
                return $date->addDay();
            case 'weekly':
                return $date->addWeek();
            case 'monthly':
                return $date->addMonth();
            case 'quarterly':
                return $date->addMonths(3);
            case 'yearly':
                return $date->addYear();
            default:
                return null;
        }
    }
}
