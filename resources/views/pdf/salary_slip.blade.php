<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Salary Slip - {{ $salaryPosting->employee->name }}</title>
    <style>
        @page {
            margin: 0;
            size: A4;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 9px;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .page-wrapper {
            background-color: #ffffff;
            margin: 20px auto;
            width: 190mm;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .slip-border {
            border: 1px solid #000;
            margin: 20px;
            position: relative;
        }
        .header {
            text-align: center;
            padding: 15px 10px 5px;
            border-bottom: 1px solid #000;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-family: serif;
            letter-spacing: 5px;
            font-weight: normal;
        }
        .header p {
            margin: 2px 0 0;
            color: #d97706;
            font-style: italic;
            font-size: 10px;
        }
        .section-header {
            background-color: #dcfce7;
            font-weight: bold;
            padding: 4px;
            border-bottom: 1px solid #000;
            text-align: center;
            font-size: 9px;
            text-transform: capitalize;
        }
        .content-table {
            width: 100%;
            border-collapse: collapse;
        }
        .content-table td {
            vertical-align: top;
            border-bottom: 1px solid #000;
        }
        .data-row {
            width: 100%;
            border-collapse: collapse;
        }
        .data-row td {
            padding: 3px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
        }
        .data-row tr:last-child td {
            border-bottom: none;
        }
        .label {
            color: #475569;
            width: 40%;
        }
        .value {
            font-weight: bold;
            text-transform: uppercase;
            width: 60%;
        }
        .photo-box {
            background-color: #000;
            width: 100%;
            height: 100%;
            min-height: 150px;
            text-align: center;
        }
        .photo-box img {
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        .chart-box {
            padding: 8px;
            background-color: #fff;
        }
        .chart-legend {
            font-size: 7px;
            margin-top: 5px;
        }
        .legend-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin-right: 3px;
        }
        .bg-green {
            background-color: #dcfce7;
        }
        .bg-light {
            background-color: #f9fafb;
        }
        .net-payable {
            background-color: #dcfce7;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 6px 15px;
            font-weight: bold;
            font-size: 11px;
        }
        .amount-words {
            padding: 6px 15px;
            border-bottom: 1px solid #000;
            font-size: 9px;
        }
        .remarks {
            padding: 10px;
            border-bottom: 1px solid #000;
            min-height: 50px;
            font-size: 9px;
        }
        .signatures {
            padding: 15px;
            font-size: 9px;
            font-weight: bold;
        }
        .arabic {
            font-family: 'DejaVu Sans', sans-serif;
            direction: rtl;
        }
        .stamp-area {
            position: relative;
            height: 70px;
            margin-top: 5px;
        }
        .stamp-img {
            position: absolute;
            top: 0;
            left: 0;
            height: 60px;
            transform: rotate(-10deg);
            opacity: 0.8;
        }
    </style>
</head>
<body>
    @php
        $currency = $appSettings['currency'] ?? 'QAR';
        $formatCurrency = function ($amount) use ($currency) {
            return $currency . ' ' . number_format((float) $amount, 2);
        };

        $basicSalary = (float) ($salaryPosting->basic_salary ?? 0);
        $overtimeAmount = (float) ($salaryPosting->overtime_amount ?? 0);
        $leaveDeduction = (float) ($salaryPosting->leave_deduction ?? 0);
        $netSalary = (float) ($salaryPosting->net_salary ?? 0);

        $allowances = (array) ($salaryPosting->allowances ?? []);
        $deductions = (array) ($salaryPosting->deductions ?? []);

        $allowancesTotal = 0;
        foreach($allowances as $val) if ($val > 0) $allowancesTotal += $val;

        $deductionsTotal = 0;
        foreach($deductions as $val) if ($val > 0) $deductionsTotal += $val;

        $loanTotal = 0;
        foreach ($loanInstallments as $li) $loanTotal += (float) $li->amount;
        
        $advanceTotal = 0;
        foreach ($advances as $adv) $advanceTotal += (float) $adv->amount;

        $totalEarnings = $basicSalary + $allowancesTotal + $overtimeAmount;
        $allDeductions = $deductionsTotal + $leaveDeduction + $loanTotal + $advanceTotal;

        $monthName = DateTime::createFromFormat('!m', $salaryPosting->month)->format('F');
        $showPhoto = ($appSettings['salary_slip_show_photo'] ?? '1') != '0';
        $showCharts = ($appSettings['salary_slip_show_charts'] ?? '1') != '0';

        if (!function_exists('convertNumberToWord')) {
            function convertNumberToWord($num) {
                $num = str_replace(array(',', ' '), '' , trim($num));
                if(! $num) return 'Zero';
                $words = array();
                $list1 = array('', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen');
                $list2 = array('', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred');
                $list3 = array('', 'thousand', 'million', 'billion', 'trillion');
                $num_length = strlen($num);
                $levels = (int) (($num_length + 2) / 3);
                $max_length = $levels * 3;
                $num = substr('00' . $num, -$max_length);
                $num_levels = str_split($num, 3);
                for ($i = 0; $i < count($num_levels); $i++) {
                    $levels--;
                    $hundreds = (int) ($num_levels[$i] / 100);
                    $hundreds = ($hundreds ? ' ' . $list1[$hundreds] . ' hundred' . ' ' : '');
                    $tens = (int) ($num_levels[$i] % 100);
                    $singles = '';
                    if ( $tens < 20 ) {
                        $tens = ($tens ? ' ' . $list1[$tens] . ' ' : '' );
                    } else {
                        $tens = (int)($tens / 10);
                        $tens = ' ' . $list2[$tens] . ' ';
                        $singles = (int) ($num_levels[$i] % 10);
                        $singles = ' ' . $list1[$singles] . ' ';
                    }
                    $words[] = $hundreds . $tens . $singles . ( ( $levels && ( int ) ( $num_levels[$i] ) ) ? ' ' . $list3[$levels] . ' ' : '' );
                }
                return trim(implode(' ', $words));
            }
        }

        $netInt = floor($netSalary);
        $netDec = round(($netSalary - $netInt) * 100);
        $wordsStr = ucwords(convertNumberToWord($netInt)) . ' ' . ($currency === 'QAR' ? 'Qatari Riyals' : $currency) . ($netDec > 0 ? ' and ' . ucwords(convertNumberToWord($netDec)) . ' Dirhams ' : ' ') . 'Only';
        
        $appName = $appSettings['app_name'] ?? 'EARTH.';
        $stampImage = $appSettings['salary_slip_stamp'] ?? ($appSettings['company_stamp'] ?? null);
        $colors = ['#3b82f6', '#fcd34d', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb923c'];
    @endphp

    <div class="page-wrapper">
        <div class="slip-border">
            
            <div class="header">
                <h1>{{ $appName }}</h1>
                <p>Employees monthly salary slip</p>
            </div>

            <table class="content-table">
                <tr>
                    <td style="width: {{ $showPhoto ? '65%' : '100%' }}; border-right: {{ $showPhoto ? '1px solid #000' : 'none' }};">
                        <div class="section-header">Employee details</div>
                        <table class="data-row">
                            <tr><td class="label">Name of the staff</td><td class="value">{{ $salaryPosting->employee->name }}</td></tr>
                            <tr><td class="label">Designation</td><td class="value">{{ $salaryPosting->employee->designation ?? '-' }}</td></tr>
                            <tr><td class="label">Department</td><td class="value">{{ $salaryPosting->employee->department->name ?? '-' }}</td></tr>
                            <tr><td class="label">QID/Passport no.</td><td class="value">{{ $salaryPosting->employee->qid_number ?: ($salaryPosting->employee->passport_number ?: '-') }}</td></tr>
                            <tr><td class="label">Date of Joining</td><td class="value">{{ $salaryPosting->employee->joining_date ? date('F j, Y', strtotime($salaryPosting->employee->joining_date)) : 'N/A' }}</td></tr>
                        </table>

                        <div class="section-header" style="border-top: 1px solid #000;">Salary period details</div>
                        <table class="data-row">
                            <tr><td class="label">Month of salary</td><td class="value">{{ $monthName }}</td></tr>
                            <tr><td class="label">Year of salary</td><td class="value">{{ $salaryPosting->year }}</td></tr>
                            <tr><td class="label">Mode of pay</td><td class="value">WPS / Bank Transfer</td></tr>
                            <tr><td class="label">Bank account no.</td><td class="value">{{ $salaryPosting->employee->bank_account_number ?? '-' }}</td></tr>
                        </table>
                    </td>
                    @if($showPhoto)
                    <td style="width: 35%;">
                        <div class="photo-box">
                            @if($salaryPosting->employee->employee_image && file_exists(public_path('storage/' . $salaryPosting->employee->employee_image)))
                                <img src="{{ public_path('storage/' . $salaryPosting->employee->employee_image) }}">
                            @else
                                <div style="color: #64748b; padding-top: 60px;">No Photo Available</div>
                            @endif
                        </div>
                    </td>
                    @endif
                </tr>
            </table>

            <table class="content-table">
                <tr>
                    <td style="width: {{ $showCharts ? '65%' : '100%' }}; border-right: {{ $showCharts ? '1px solid #000' : 'none' }};">
                        <div class="section-header">Additions</div>
                        <table class="data-row">
                            <tr><td class="label">Basic salary</td><td class="value" style="text-align: right;">{{ $formatCurrency($basicSalary) }}</td></tr>
                            @foreach($allowances as $key => $val)
                                @if($val > 0)
                                <tr><td class="label" style="text-transform: capitalize;">{{ str_replace('_', ' ', $key) }}</td><td class="value" style="text-align: right;">{{ $formatCurrency($val) }}</td></tr>
                                @endif
                            @endforeach
                            <tr style="border-top: 1px solid #000;"><td class="label" style="font-weight: bold;">Total</td><td class="value" style="text-align: right;">{{ $formatCurrency($basicSalary + $allowancesTotal) }}</td></tr>
                            <tr class="bg-light"><td class="label">Number of working days</td><td class="value" style="text-align: right;">30</td></tr>
                            <tr class="bg-light"><td class="label">Gross salary for the month</td><td class="value" style="text-align: right;">{{ $formatCurrency($basicSalary + $allowancesTotal) }}</td></tr>
                            @if($overtimeAmount > 0)
                            <tr class="bg-light"><td class="label">(Add) Overtime</td><td class="value" style="text-align: right;">{{ $formatCurrency($overtimeAmount) }}</td></tr>
                            @endif
                            <tr class="bg-light"><td class="label" style="font-weight: bold;">Total Additions</td><td class="value" style="text-align: right;">{{ $formatCurrency($totalEarnings) }}</td></tr>
                        </table>
                    </td>
                    @if($showCharts)
                    <td style="width: 35%;" class="chart-box">
                        <div style="font-weight: bold; margin-bottom: 5px;">Additions Breakdown</div>
                        @php $addTotal = $totalEarnings ?: 1; @endphp
                        <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                            @php $cIdx = 0; @endphp
                            <div style="float: left; height: 100%; width: {{ ($basicSalary / $addTotal) * 100 }}%; background: {{ $colors[0] }};"></div>
                            @foreach($allowances as $val)
                                @if($val > 0)
                                    @php $cIdx++; @endphp
                                    <div style="float: left; height: 100%; width: {{ ($val / $addTotal) * 100 }}%; background: {{ $colors[$cIdx % count($colors)] }};"></div>
                                @endif
                            @endforeach
                        </div>
                        <div class="chart-legend">
                            <div style="margin-bottom: 2px;"><span class="legend-dot" style="background: {{ $colors[0] }};"></span>Basic Salary</div>
                            @php $cIdx = 0; @endphp
                            @foreach($allowances as $key => $val)
                                @if($val > 0)
                                    @php $cIdx++; @endphp
                                    <div style="margin-bottom: 2px;"><span class="legend-dot" style="background: {{ $colors[$cIdx % count($colors)] }};"></span>{{ str_replace('_', ' ', $key) }}</div>
                                @endif
                            @endforeach
                        </div>
                    </td>
                    @endif
                </tr>
            </table>

            <table class="content-table">
                <tr>
                    <td style="width: {{ $showCharts ? '65%' : '100%' }}; border-right: {{ $showCharts ? '1px solid #000' : 'none' }};">
                        <div class="section-header">Deductions</div>
                        <table class="data-row">
                            @foreach($deductions as $key => $val)
                                @if($val > 0)
                                <tr><td class="label" style="text-transform: capitalize;">{{ str_replace('_', ' ', $key) }}</td><td class="value" style="text-align: right;">{{ $formatCurrency($val) }}</td></tr>
                                @endif
                            @endforeach
                            @if($leaveDeduction > 0)
                            <tr><td class="label">Leave recovery</td><td class="value" style="text-align: right;">{{ $formatCurrency($leaveDeduction) }}</td></tr>
                            @endif
                            @foreach($loanInstallments as $li)
                            <tr><td class="label">Loan: {{ $li->loan->loan_type->name ?? 'Repayment' }}</td><td class="value" style="text-align: right;">{{ $formatCurrency($li->amount) }}</td></tr>
                            @endforeach
                            @foreach($advances as $adv)
                            <tr><td class="label">Advance Repayment</td><td class="value" style="text-align: right;">{{ $formatCurrency($adv->amount) }}</td></tr>
                            @endforeach
                            @if($allDeductions == 0)
                            <tr><td class="label" style="font-style: italic; color: #94a3b8;">No deductions</td><td class="value" style="text-align: right;">{{ $formatCurrency(0) }}</td></tr>
                            @endif
                            <tr><td class="label" style="font-weight: bold; padding-top: 10px;">Total Deductions</td><td class="value" style="text-align: right; padding-top: 10px;">{{ $formatCurrency($allDeductions) }}</td></tr>
                        </table>
                    </td>
                    @if($showCharts)
                    <td style="width: 35%;" class="chart-box">
                        <div style="font-weight: bold; font-style: italic; color: #475569; margin-bottom: 5px;">Reliability track</div>
                        @php $relTotal = ($basicSalary + $allowancesTotal + $overtimeAmount) ?: 1; @endphp
                        <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                            <div style="float: left; height: 100%; width: {{ (($basicSalary + $allowancesTotal) / $relTotal) * 100 }}%; background: #3b82f6;"></div>
                            @if($overtimeAmount > 0)
                            <div style="float: left; height: 100%; width: {{ ($overtimeAmount / $relTotal) * 100 }}%; background: #34d399;"></div>
                            @endif
                        </div>
                        <div class="chart-legend">
                            <div style="margin-bottom: 2px;"><span class="legend-dot" style="background: #3b82f6;"></span>Gross Salary</div>
                            @if($overtimeAmount > 0)
                            <div style="margin-bottom: 2px;"><span class="legend-dot" style="background: #34d399;"></span>Overtime</div>
                            @endif
                        </div>
                    </td>
                    @endif
                </tr>
            </table>

            <div class="net-payable">
                <table style="width: 100%;">
                    <tr><td>Net payable amount</td><td style="text-align: right;">{{ $formatCurrency($netSalary) }}</td></tr>
                </table>
            </div>

            <div class="amount-words">
                <span style="color: #64748b;">Amount in words:</span>
                <span style="font-weight: bold; margin-left: 10px;">{{ $wordsStr }}</span>
            </div>

            <div class="remarks">
                <div style="font-weight: bold; margin-bottom: 4px;">Remarks (if any):</div>
                <div style="color: #2563eb; font-weight: bold;">
                    <div>&gt; Salary and allowance for the month.</div>
                    @if($overtimeAmount > 0)
                        <div>&gt; OT ({{ $monthName }} {{ $salaryPosting->year }}) - [{{ $formatCurrency($overtimeAmount) }}]</div>
                    @endif
                </div>
            </div>

            <div class="signatures">
                <p>I the undersigned (Staff name)</p>
                <table style="width: 100%; margin: 5px 0 10px;">
                    <tr>
                        <td style="width: 45%; border-bottom: 1px solid #000; text-align: center;">{{ $salaryPosting->employee->name }}</td>
                        <td style="width: 10%;"></td>
                        <td style="width: 45%; text-align: right;" class="arabic">أنا الموقع أدناه (اسم الموظف):</td>
                    </tr>
                </table>

                <table style="width: 100%; margin-bottom: 15px;">
                    <tr>
                        <td style="width: 30%;">Holding Qid/passport no:</td>
                        <td style="width: 30%; border-bottom: 1px solid #000; text-align: center;">{{ $salaryPosting->employee->qid_number ?: $salaryPosting->employee->passport_number }}</td>
                        <td style="width: 40%; text-align: right;" class="arabic">يحمل رقم البطاقة الشخصية/جواز السفر:</td>
                    </tr>
                </table>

                <p style="text-align: center; margin-bottom: 5px;">I hereby acknowledge and confirm that I have received the above-mentioned amount (salary, allowances, overtime, and other additions) in {{ $currency === 'QAR' ? 'Qatari Riyals' : $currency }}.</p>
                <p style="text-align: center; margin-bottom: 10px;" class="arabic">أقر وأؤكد بموجبه أنني قد استلمت المبلغ المذكور أعلاه (الراتب، البدلات، ساعات العمل الإضافية، والإضافات الأخرى) بالريال القطري.</p>
                <p style="text-align: center; margin-bottom: 5px;">I also acknowledge and agree to any deductions stated, if applicable.</p>
                <p style="text-align: center; margin-bottom: 20px;" class="arabic">كما أقر وأوافق على أي خصومات مذكورة، إن وجدت.</p>

                <table style="width: 100%; margin-top: 20px;">
                    <tr>
                        <td style="width: 45%;">
                            <div>Received & Confirmed</div>
                            <div style="margin-top: 10px; background: #fef08a; display: inline-block; padding: 2px 5px; font-size: 8px;">Please sign here</div>
                            <div style="border-bottom: 1px solid #000; width: 100%; margin-top: 5px;"></div>
                            <div style="margin-top: 5px;">{{ $salaryPosting->employee->name }}</div>
                        </td>
                        <td style="width: 10%;"></td>
                        <td style="width: 45%; text-align: right;">
                            <div class="arabic">تم الاستلام والموافق</div>
                            <div style="border-bottom: 1px solid #000; width: 100%; margin-top: 40px;"></div>
                            <div style="text-align: left; margin-top: 5px;">{{ $salaryPosting->employee->name }}</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="section-header" style="border-top: 1px solid #000;">For office use only</div>
            <div style="padding: 15px; font-weight: bold;">
                <div>Authorized by</div>
                <div class="stamp-area">
                    @if($stampImage && file_exists(public_path('storage/' . $stampImage)))
                        <img src="{{ public_path('storage/' . $stampImage) }}" class="stamp-img">
                    @else
                        <div style="border: 1px dashed #94a3b8; color: #94a3b8; display: inline-block; padding: 5px; font-size: 8px; transform: rotate(-5deg); margin-top: 10px;">STAMP NOT UPLOADED</div>
                    @endif
                </div>
                <div style="margin-top: 10px;">Finance & HR Department</div>
                <div style="color: #64748b;">{{ strtoupper($appName) }}</div>
            </div>
        </div>
    </div>
</body>
</html>argin-top: 10px;">Finance & HR Department</div>
                    <div style="color: #4b5563;">{{ strtoupper($appName) }}</div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>