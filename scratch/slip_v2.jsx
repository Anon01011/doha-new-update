import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { FiPrinter, FiArrowLeft } from 'react-icons/fi';

// Simple SVG Pie/Donut Chart Component
const PieChart = ({ data, size = 120, innerRadius = 0, centerText = null }) => {
    let total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) total = 1; // Prevent division by zero
    let currentAngle = -90; // Start at 12 o'clock
    
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {data.map((item, i) => {
                if (item.value === 0) return null;
                const percentage = item.value / total;
                const angle = percentage * 360;
                
                // If it's 100%, render a circle
                if (percentage === 1) {
                    return (
                        <g key={i}>
                            <circle cx={size/2} cy={size/2} r={size/2} fill={item.color} />
                            {innerRadius > 0 && (
                                <circle cx={size/2} cy={size/2} r={size/2 * innerRadius} fill="#fff" />
                            )}
                            {centerText ? (
                                <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" fill="#000" fontSize="14" fontWeight="bold">
                                    {centerText}
                                </text>
                            ) : (
                                !innerRadius && <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="bold">
                                    {Math.round(percentage * 100)}%
                                </text>
                            )}
                        </g>
                    );
                }
                
                const x1 = size/2 + (size/2) * Math.cos((Math.PI * currentAngle) / 180);
                const y1 = size/2 + (size/2) * Math.sin((Math.PI * currentAngle) / 180);
                
                const midAngle = currentAngle + angle / 2;
                const textDistance = innerRadius > 0 ? (1 + innerRadius) / 2 : 0.6;
                const textX = size/2 + (size/2 * textDistance) * Math.cos((Math.PI * midAngle) / 180);
                const textY = size/2 + (size/2 * textDistance) * Math.sin((Math.PI * midAngle) / 180);
                
                currentAngle += angle;
                const x2 = size/2 + (size/2) * Math.cos((Math.PI * currentAngle) / 180);
                const y2 = size/2 + (size/2) * Math.sin((Math.PI * currentAngle) / 180);
                
                const largeArcFlag = percentage > 0.5 ? 1 : 0;
                
                return (
                    <g key={i}>
                        <path
                            d={`M ${size/2} ${size/2} L ${x1} ${y1} A ${size/2} ${size/2} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={item.color}
                            stroke="#fff"
                            strokeWidth="1"
                        />
                        {percentage > 0.05 && !centerText && (
                            <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle" fill="#000" fontSize="9" fontWeight="bold">
                                {Math.round(percentage * 100)}%
                            </text>
                        )}
                    </g>
                );
            })}
            
            {innerRadius > 0 && percentage !== 1 && (
                <circle cx={size/2} cy={size/2} r={size/2 * innerRadius} fill="#fff" />
            )}
            
            {centerText && percentage !== 1 && (
                <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle" fill="#000" fontSize="14" fontWeight="bold">
                    {centerText}
                </text>
            )}
        </svg>
    );
};

// Helper for Amount in Words
const numberToWords = (num) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
};

export default function Slip({ salaryPosting }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';
    
    // Configurable Toggles
    const showPhoto = appSettings?.salary_slip_show_photo !== false;
    const showCharts = appSettings?.salary_slip_show_charts !== false;
    const hasRightColumn = showPhoto || showCharts;
    
    // Determine the stamp to use. Check payroll setting first, then fallback to company stamp.
    const stampImage = appSettings?.salary_slip_stamp || appSettings?.company_stamp;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount || 0);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[salaryPosting.month - 1] || 'N/A';

    const basicSalary = parseFloat(salaryPosting.basic_salary) || 0;
    const overtimeAmount = parseFloat(salaryPosting.overtime_amount) || 0;
    const leaveDeduction = parseFloat(salaryPosting.leave_deduction) || 0;
    const netSalary = parseFloat(salaryPosting.net_salary) || 0;

    const allowances = salaryPosting.allowances || {};
    const deductions = salaryPosting.deductions || {};

    const allowancesTotal = Object.values(allowances).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const deductionsTotal = Object.values(deductions).reduce((a, b) => a + (parseFloat(b) || 0), 0);

    const totalEarnings = basicSalary + allowancesTotal + overtimeAmount;
    const allDeductions = deductionsTotal + leaveDeduction;

    const handlePrint = () => {
        window.print();
    };

    // Amount to words for main currency
    const netInt = Math.floor(netSalary);
    const netDec = Math.round((netSalary - netInt) * 100);
    const wordsStr = `${numberToWords(netInt)} ${currency === 'QAR' ? 'Qatari Riyals' : currency} ${netDec > 0 ? `and ${numberToWords(netDec)} Dirhams ` : ''}Only`;

    // Pie Chart Data Colors
    const colors = ['#3b82f6', '#fcd34d', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb923c'];
    
    // Additions Chart Data
    const additionsData = [
        { label: 'Basic salary', value: basicSalary, color: colors[0] },
    ];
    let cIdx = 1;
    Object.entries(allowances).forEach(([key, value]) => {
        additionsData.push({ label: key.replace(/_/g, ' '), value: parseFloat(value) || 0, color: colors[cIdx % colors.length] });
        cIdx++;
    });

    // Reliability Track Chart Data
    const reliabilityData = [
        { label: 'Gross salary for the month', value: basicSalary + allowancesTotal, color: '#3b82f6' },
        { label: '(Add) Overtime', value: overtimeAmount, color: '#34d399' },
        { label: '(Add) Other additions', value: 0, color: '#84cc16' } // Placeholder if needed
    ];

    const employee = salaryPosting.employee || {};

    return (
        <AuthenticatedLayout>
            <Head title={`Salary Slip - ${employee.name}`} />

            <div className="min-h-screen bg-[#F8FAFC] py-8">
                {/* Print Navigation Bar */}
                <div className="max-w-[800px] mx-auto mb-4 print:hidden flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                    <Link href={route('salary-postings.index')} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium">
                        <FiArrowLeft /> Back to Postings
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center gap-2"
                    >
                        <FiPrinter /> Print Slip
                    </button>
                </div>

                {/* Document Container */}
                <div className="max-w-[800px] mx-auto bg-white border border-gray-300 shadow-xl print:shadow-none print:border-none">
                    
                    {/* Inner Border Wrapper */}
                    <div className="border border-black m-6 p-0 relative">
                        
                        {/* Header */}
                        <div className="text-center py-6 pb-2 border-b border-black">
                            <h1 className="text-4xl font-serif tracking-[0.2em]">{appSettings?.app_name || 'EARTH.'}</h1>
                            <p className="text-amber-600 font-serif italic text-sm mt-1">Employees monthly salary slip</p>
                        </div>

                        {/* Top Flex Container: Employee Info & Photo */}
                        <div className="flex border-b border-black">
                            <div className={`${hasRightColumn ? 'w-[65%]' : 'w-full'} border-r border-black flex flex-col`}>
                                {/* Employee Details Section */}
                                <div className="bg-[#dcfce7] border-b border-black text-center text-xs font-bold py-1">
                                    Employee details
                                </div>
                                <div className="flex flex-col text-xs">
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">Name of the staff</div>
                                        <div className="w-2/3 font-bold uppercase">{employee.name}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">Designation</div>
                                        <div className="w-2/3 font-bold uppercase">{employee.designation || '-'}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">Department</div>
                                        <div className="w-2/3 font-bold uppercase">{employee.department?.name || '-'}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">QID/Passport no.</div>
                                        <div className="w-2/3 font-bold uppercase">{employee.qid_number || employee.passport_number || '-'}</div>
                                    </div>
                                    <div className="flex p-1 px-2">
                                        <div className="w-1/3">Date of Joining</div>
                                        <div className="w-2/3 font-bold uppercase">{formatDate(employee.joining_date)}</div>
                                    </div>
                                </div>

                                {/* Salary Period Details Section */}
                                <div className="bg-[#dcfce7] border-y border-black text-center text-xs font-bold py-1">
                                    Salary period details
                                </div>
                                <div className="flex flex-col text-xs">
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">Month of salary</div>
                                        <div className="w-2/3 font-bold uppercase">{monthName}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">Year of salary</div>
                                        <div className="w-2/3 font-bold uppercase">{salaryPosting.year}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2">
                                        <div className="w-1/3">Mode of pay</div>
                                        <div className="w-2/3 font-bold uppercase">WPS / Bank Transfer</div>
                                    </div>
                                    <div className="flex p-1 px-2">
                                        <div className="w-1/3">Bank account no.</div>
                                        <div className="w-2/3 font-bold uppercase">{employee.bank_account_number || '-'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {hasRightColumn && (
                                <div className="w-[35%] flex flex-col items-center justify-center p-0 overflow-hidden bg-black relative">
                                    {showPhoto ? (
                                        employee.employee_image ? (
                                            <img src={`/storage/${employee.employee_image}`} alt="Employee" className="w-full h-full object-cover absolute inset-0" />
                                        ) : (
                                            <div className="text-gray-400 italic text-xs">No Photo Available</div>
                                        )
                                    ) : (
                                        <div className="w-full h-full bg-white"></div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Middle Flex Container: Additions & Pie Chart */}
                        <div className="flex border-b border-black">
                            <div className={`${hasRightColumn ? 'w-[65%]' : 'w-full'} border-r border-black flex flex-col`}>
                                {/* Additions Section */}
                                <div className="bg-[#dcfce7] border-b border-black text-center text-xs font-bold py-1">
                                    Additions
                                </div>
                                <div className="flex flex-col text-xs">
                                    <div className="flex border-b border-gray-200 p-1 px-2 justify-between">
                                        <div>Basic salary</div>
                                        <div className="font-bold">{formatCurrency(basicSalary)}</div>
                                    </div>
                                    {Object.entries(allowances).map(([key, value]) => (
                                        <div key={key} className="flex border-b border-gray-200 p-1 px-2 justify-between">
                                            <div className="capitalize">{key.replace(/_/g, ' ')}</div>
                                            <div className="font-bold">{formatCurrency(value)}</div>
                                        </div>
                                    ))}
                                    <div className="flex border-b border-black p-1 px-2 justify-between">
                                        <div className="font-bold">Total</div>
                                        <div className="font-bold">{formatCurrency(basicSalary + allowancesTotal)}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2 justify-between bg-gray-50">
                                        <div>Number of working days</div>
                                        <div className="font-bold">30</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2 justify-between bg-gray-50">
                                        <div>Gross salary for the month</div>
                                        <div className="font-bold">{formatCurrency(basicSalary + allowancesTotal)}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2 justify-between bg-gray-50">
                                        <div>(Add) Overtime</div>
                                        <div className="font-bold">{formatCurrency(overtimeAmount)}</div>
                                    </div>
                                    <div className="flex border-b border-gray-200 p-1 px-2 justify-between bg-gray-50">
                                        <div>(Add) Other additions</div>
                                        <div className="font-bold">{formatCurrency(0)}</div>
                                    </div>
                                    <div className="flex p-1 px-2 justify-between bg-gray-50">
                                        <div className="font-bold">Total Additions</div>
                                        <div className="font-bold">{formatCurrency(totalEarnings)}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {hasRightColumn && (
                                <div className="w-[35%] flex flex-row items-center justify-start pl-2 p-2 relative bg-white">
                                    {showCharts && (
                                        <>
                                            <PieChart data={additionsData} size={100} />
                                            <div className="ml-2 flex flex-col justify-center gap-1 text-[8px] leading-tight max-w-[50%]">
                                                {additionsData.map((d, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <div className="w-2 h-2 flex-shrink-0 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                        <span className="capitalize truncate">{d.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Flex Container: Deductions & Reliability Donut Chart */}
                        <div className="flex">
                            <div className={`${hasRightColumn ? 'w-[65%]' : 'w-full'} border-r border-black flex flex-col`}>
                                {/* Deductions Section */}
                                <div className="bg-[#dcfce7] border-b border-black text-center text-xs font-bold py-1">
                                    Deductions
                                </div>
                                <div className="flex flex-col text-xs">
                                    {Object.entries(deductions).map(([key, value]) => (
                                        <div key={key} className="flex border-b border-gray-200 p-1 px-2 justify-between">
                                            <div className="capitalize">{key.replace(/_/g, ' ')}</div>
                                            <div className="font-bold">{formatCurrency(value)}</div>
                                        </div>
                                    ))}
                                    {leaveDeduction > 0 && (
                                        <div className="flex border-b border-gray-200 p-1 px-2 justify-between">
                                            <div>Leave recovery</div>
                                            <div className="font-bold">{formatCurrency(leaveDeduction)}</div>
                                        </div>
                                    )}
                                    {Object.keys(deductions).length === 0 && leaveDeduction === 0 && (
                                        <div className="flex border-b border-gray-200 p-1 px-2 justify-between text-gray-500 italic">
                                            <div>No deductions</div>
                                            <div>{formatCurrency(0)}</div>
                                        </div>
                                    )}
                                    <div className="flex p-1 px-2 justify-between flex-1 items-end pt-4">
                                        <div className="font-bold">Total Deductions</div>
                                        <div className="font-bold">{formatCurrency(allDeductions)}</div>
                                    </div>
                                </div>
                            </div>

                            {hasRightColumn && (
                                <div className="w-[35%] flex flex-row items-center justify-start pl-2 p-2 relative bg-white">
                                    {showCharts && (
                                        <>
                                            <div className="absolute top-1 left-2 font-bold italic text-[9px] text-gray-700">Reliability track</div>
                                            <div className="mt-4">
                                                <PieChart data={reliabilityData} size={100} innerRadius={0.5} centerText="100%" />
                                            </div>
                                            <div className="ml-2 mt-4 flex flex-col justify-center gap-1 text-[8px] leading-tight max-w-[50%]">
                                                {reliabilityData.map((d, i) => (
                                                    <div key={i} className="flex items-start gap-1">
                                                        <div className="w-2 h-2 flex-shrink-0 rounded-full mt-[1px]" style={{ backgroundColor: d.color }}></div>
                                                        <span className="truncate whitespace-normal leading-tight">{d.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Net Payable Amount */}
                        <div className="bg-[#dcfce7] border-y border-black font-bold p-2 px-4 flex justify-between text-sm">
                            <div>Net payable amount</div>
                            <div>{formatCurrency(netSalary)}</div>
                        </div>

                        {/* Amount in Words */}
                        <div className="flex border-b border-black text-xs">
                            <div className="w-1/4 p-2 border-r border-black">Amount in words:</div>
                            <div className="w-3/4 p-2 capitalize font-medium">{wordsStr}</div>
                        </div>

                        {/* Remarks */}
                        <div className="border-b border-black p-2 min-h-[100px] text-xs">
                            <div className="font-bold mb-1">Remarks (if any):</div>
                            <div className="text-blue-700 space-y-1 font-medium">
                                <div>&gt;Salary and allowance for the month.</div>
                                {overtimeAmount > 0 && (
                                    <div>&gt;OT ({monthName} {salaryPosting.year}) - [{formatCurrency(overtimeAmount)}]</div>
                                )}
                            </div>
                        </div>

                        {/* Signatures & Declarations */}
                        <div className="p-4 text-xs font-bold space-y-4">
                            <p>I the undersigned (Staff name)</p>
                            <div className="flex gap-2 items-center">
                                <span className="border-b border-black flex-1 max-w-[200px] inline-block uppercase text-center">{employee.name}</span>
                                <span className="arabic" dir="rtl">أنا الموقع أدناه (اسم الموظف):</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                                <span>Holding Qid/passport no:</span>
                                <span className="border-b border-black font-bold flex-1 max-w-[150px] inline-block text-center">{employee.qid_number || employee.passport_number}</span>
                                <span className="arabic ml-auto" dir="rtl">يحمل رقم البطاقة الشخصية/جواز السفر:</span>
                            </div>

                            <p className="mt-4 text-center">
                                I hereby acknowledge and confirm that I have received the above-mentioned amount (salary, allowances, overtime, and other additions) in Qatari Riyals.
                            </p>
                            <p className="text-center arabic" dir="rtl">
                                أقر وأؤكد بموجبه أنني قد استلمت المبلغ المذكور أعلاه (الراتب، البدلات، ساعات العمل الإضافية، والإضافات الأخرى) بالريال القطري.
                            </p>

                            <p className="text-center mt-2">
                                I also acknowledge and agree to any deductions stated, if applicable.
                            </p>
                            <p className="text-center arabic" dir="rtl">
                                كما أقر وأوافق على أي خصومات مذكورة، إن وجدت.
                            </p>

                            <div className="flex justify-between items-end mt-12 mb-4">
                                <div className="text-left w-1/3">
                                    <div>Received & Confirmed</div>
                                    <div className="mt-6 mb-1 bg-yellow-300 inline-block px-1 font-bold text-[10px]">Please sign here</div>
                                    <div className="border-b border-black w-full pb-1 uppercase">{employee.name}</div>
                                    <div>{employee.qid_number || employee.passport_number}</div>
                                </div>
                                <div className="text-right w-1/3 arabic" dir="rtl">
                                    <div>تم الاستلام والموافق</div>
                                    <div className="mt-12 border-b border-black w-full pb-1 text-left uppercase" dir="ltr">{employee.name}</div>
                                    <div className="text-left" dir="ltr">{employee.qid_number || employee.passport_number}</div>
                                </div>
                            </div>
                        </div>

                        {/* Office Use Only Section */}
                        <div className="bg-[#dcfce7] border-y border-black text-center text-xs font-bold py-1">
                            For office use only
                        </div>
                        
                        <div className="p-4 text-xs font-bold pb-10">
                            <div>Authorized by</div>
                            <div className="mt-4 relative h-20 w-48">
                                {/* Stamp Image Placeholder */}
                                {stampImage ? (
                                    <img src={`/storage/${stampImage}`} alt="Company Stamp" className="absolute top-0 left-0 h-24 object-contain -rotate-12 mix-blend-multiply" />
                                ) : (
                                    <div className="border-2 border-blue-500 text-blue-500 inline-block p-2 text-[8px] transform -rotate-12 opacity-50">
                                        STAMP<br/>NOT UPLOADED
                                    </div>
                                )}
                            </div>
                            <div className="mt-8">Finance & HR Department</div>
                            <div>{appSettings?.app_name || 'EARTH.'}</div>
                        </div>
                        
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white; }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                }
                .arabic { font-family: 'Arial', sans-serif; }
            `}</style>
        </AuthenticatedLayout>
    );
}
