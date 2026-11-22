<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Employee;
use App\Models\ShiftRoster;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ShiftRosterExportService
{
    /**
     * Generate and stream a styled Excel spreadsheet for a company's weekly shift roster.
     */
    public static function exportWeek(Company $company, Carbon $weekStart, ?int $departmentId = null): BinaryFileResponse
    {
        // Get all employees for this company, filtered by department if specified
        $employeesQuery = Employee::where('company_id', $company->id)->orderBy('name');

        if ($departmentId) {
            $employeesQuery->where('department_id', $departmentId);
        }

        $employees = $employeesQuery->get();

        // Get rosters for the week, filtered by department employees
        $rosterQuery = ShiftRoster::with(['employee'])
            ->where('company_id', $company->id)
            ->where('week_start', $weekStart->format('Y-m-d'));

        if ($departmentId) {
            $rosterQuery->whereIn('employee_id', $employees->pluck('id'));
        }

        $rosters = $rosterQuery->get()->groupBy('employee_id');

        // Generate days of the week
        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $weekStart->copy()->addDays($i);
            $days[] = [
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('l'),
                'label' => $date->format('D, M d'),
            ];
        }

        // Create Excel file using PhpSpreadsheet
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Roster');

        // Set page orientation to landscape
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);

        // Title Row
        $sheet->setCellValue('A1', $company->name . ' - Weekly Roster');
        $sheet->mergeCells('A1:J1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A1')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FF4472C4');
        $sheet->getStyle('A1')->getFont()->getColor()->setARGB('FFFFFFFF');
        $sheet->getRowDimension(1)->setRowHeight(30);

        // Week Info Row
        $weekInfo = 'Week: ' . $weekStart->format('M d, Y') . ' - ' . $weekStart->copy()->addDays(6)->format('M d, Y');
        $sheet->setCellValue('A2', $weekInfo);
        $sheet->mergeCells('A2:J2');
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A2')->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFD9E1F2');
        $sheet->getRowDimension(2)->setRowHeight(25);

        // Header Row
        $headerRow = 4;
        $headers = ['Employee ID', 'Employee Name', 'Designation'];
        foreach ($days as $day) {
            $headers[] = $day['label'];
        }

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $headerRow, $header);
            $sheet->getStyle($col . $headerRow)->getFont()->setBold(true)->setSize(11);
            $sheet->getStyle($col . $headerRow)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle($col . $headerRow)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FF5B9BD5');
            $sheet->getStyle($col . $headerRow)->getFont()->getColor()->setARGB('FFFFFFFF');
            $col++;
        }
        $sheet->getRowDimension($headerRow)->setRowHeight(25);

        // Data Rows
        $row = $headerRow + 1;
        foreach ($employees as $employee) {
            $employeeRosters = $rosters->get($employee->id, collect());

            // Employee ID
            $sheet->setCellValue('A' . $row, $employee->employee_code ?? $employee->id);

            // Employee Name
            $sheet->setCellValue('B' . $row, $employee->name);

            // Designation
            $sheet->setCellValue('C' . $row, $employee->designation ?? '-');

            // Shift times for each day
            $col = 'D';
            foreach ($days as $day) {
                $roster = $employeeRosters->firstWhere('day', $day['day']);
                if ($roster) {
                    $cellValue = $roster->shift_time;
                    if ($roster->shift_type) {
                        $cellValue .= "\n(" . $roster->shift_type . ")";
                    }
                    $sheet->setCellValue($col . $row, $cellValue);

                    // Color code based on shift type
                    $bgColor = 'FFFFFFFF'; // White default
                    if ($roster->shift_type === 'Morning') {
                        $bgColor = 'FFFCE4D6'; // Light orange
                    } elseif ($roster->shift_type === 'Evening') {
                        $bgColor = 'FFE2EFDA'; // Light green
                    } elseif ($roster->shift_type === 'Night') {
                        $bgColor = 'FFD9E1F2'; // Light blue
                    }

                    $sheet->getStyle($col . $row)->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setARGB($bgColor);

                    $sheet->getStyle($col . $row)->getAlignment()
                        ->setWrapText(true)
                        ->setVertical(Alignment::VERTICAL_CENTER);
                } else {
                    $sheet->setCellValue($col . $row, '-');
                    $sheet->getStyle($col . $row)->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
                $col++;
            }

            // Alternate row colors
            if ($row % 2 == 0) {
                $sheet->getStyle('A' . $row . ':C' . $row)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('FFF2F2F2');
            }

            $sheet->getRowDimension($row)->setRowHeight(35);
            $row++;
        }

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(15); // Employee ID
        $sheet->getColumnDimension('B')->setWidth(25); // Employee Name
        $sheet->getColumnDimension('C')->setWidth(20); // Designation

        // Day columns
        foreach (range('D', 'J') as $col) {
            $sheet->getColumnDimension($col)->setWidth(18);
        }

        // Add borders to all data
        $lastRow = $row - 1;
        $sheet->getStyle('A4:J' . $lastRow)->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)
            ->getColor()->setARGB('FF000000');

        // Center align all cells
        $sheet->getStyle('A' . $headerRow . ':J' . $lastRow)->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);

        // Left align employee names
        $sheet->getStyle('B' . ($headerRow + 1) . ':B' . $lastRow)->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Add legend
        $legendRow = $lastRow + 2;
        $sheet->setCellValue('A' . $legendRow, 'Legend:');
        $sheet->getStyle('A' . $legendRow)->getFont()->setBold(true);

        $legendRow++;
        $sheet->setCellValue('A' . $legendRow, 'Morning Shift');
        $sheet->getStyle('A' . $legendRow)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFFCE4D6');

        $sheet->setCellValue('B' . $legendRow, 'Evening Shift');
        $sheet->getStyle('B' . $legendRow)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFE2EFDA');

        $sheet->setCellValue('C' . $legendRow, 'Night Shift');
        $sheet->getStyle('C' . $legendRow)->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFD9E1F2');

        // Generate filename
        $filename = 'Roster_' . $company->name . '_' . $weekStart->format('Y-m-d') . '.xlsx';
        $filename = preg_replace('/[^A-Za-z0-9_\-.]/', '_', $filename);

        // Save to temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'roster_');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        // Return file download
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
