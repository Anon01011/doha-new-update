import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { hasPermission } from '@/helpers/permissions';
import Avatar from '@/Components/Avatar';
import Modal from '@/Components/Modal';
import axios from 'axios';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { FiSearch, FiUsers, FiCheckCircle, FiClock, FiGrid, FiUserPlus, FiSend, FiList, FiPlus, FiEye, FiEdit2, FiAlertCircle, FiDownload, FiUpload, FiFileText } from 'react-icons/fi';

export default function Index({ employees, status, search: initialSearch = '', stats = {}, companies = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user || {};
    const [searchTerm, setSearchTerm] = useState(initialSearch || '');
    const [departmentId, setDepartmentId] = useState(new URLSearchParams(window.location.search).get('department_id') || '');
    const departments = usePage().props.departments || [];
    const [targetCompanyId, setTargetCompanyId] = useState('');
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [targetDepartmentId, setTargetDepartmentId] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [processingTransfer, setProcessingTransfer] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Import State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importCompanyId, setImportCompanyId] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');

    const [confirmingAction, setConfirmingAction] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        hideCancel: false
    });

    const closeModal = () => setConfirmingAction(prev => ({ ...prev, show: false }));

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        router.get(route('employees.index'), {
            search: searchTerm,
            status,
            department_id: departmentId
        }, { preserveState: true });
    };

    // Trigger search when department changes
    useEffect(() => {
        if (departmentId !== (new URLSearchParams(window.location.search).get('department_id') || '')) {
            handleSearch();
        }
    }, [departmentId]);

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Bulk Actions
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedEmployees([]);
    };

    const toggleEmployeeSelection = (employeeId) => {
        if (selectedEmployees.includes(employeeId)) {
            setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
        } else {
            setSelectedEmployees([...selectedEmployees, employeeId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedEmployees.length === employees.data.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.data.map(emp => emp.id));
        }
    };

    const toggleSelection = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
        } else {
            setSelectedEmployees([...selectedEmployees, id]);
        }
    };

    // Fetch departments when target company changes
    useEffect(() => {
        if (targetCompanyId) {
            axios.get(route('api.departments.byBranch'), { params: { branch_id: targetCompanyId } })
                .then(response => {
                    setAvailableDepartments(response.data.departments || []);
                    setTargetDepartmentId(''); // Reset department selection
                })
                .catch(error => {
                    console.error('Error fetching departments:', error);
                    setAvailableDepartments([]);
                });
        } else {
            setAvailableDepartments([]);
            setTargetDepartmentId('');
        }
    }, [targetCompanyId]);

    const handleBulkTransfer = () => {
        if (!targetCompanyId || !targetDepartmentId) return;

        // Filter out employees who are already in the target branch
        const effectiveEmployeeIds = selectedEmployees.filter(id => {
            const emp = employees.data.find(e => e.id === id);
            return emp && String(emp.company_id) !== String(targetCompanyId);
        });

        if (effectiveEmployeeIds.length === 0) {
            // If all selected employees are already in the target branch, show a message
            setConfirmingAction({
                show: true,
                title: 'Transfer Not Required',
                message: 'All selected employees are already in this branch.',
                type: 'warning',
                hideCancel: true,
                onConfirm: closeModal
            });
            return;
        }

        setProcessingTransfer(true);
        router.post(route('employees.bulk-transfer'), {
            employee_ids: effectiveEmployeeIds,
            company_id: targetCompanyId,
            department_id: targetDepartmentId
        }, {
            onSuccess: () => {
                setShowTransferModal(false);
                setIsSelectionMode(false);
                setSelectedEmployees([]);
                setProcessingTransfer(false);
                setTargetCompanyId('');
                setTargetDepartmentId('');
            },
            onError: () => {
                setProcessingTransfer(false);
            }
        });
    };

    // Calculate derived state for modal
    const getTransferSummary = () => {
        if (!targetCompanyId) return { valid: selectedEmployees.length, skipped: 0 };

        const valid = selectedEmployees.filter(id => {
            const emp = employees.data.find(e => e.id === id);
            return emp && String(emp.company_id) !== String(targetCompanyId);
        }).length;

        return { valid, skipped: selectedEmployees.length - valid };
    };

    const transferSummary = getTransferSummary();

    const handleExport = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (status) params.append('status', status);
        if (departmentId) params.append('department_id', departmentId);
        const queryStr = params.toString();
        window.location.href = queryStr ? `${route('employees.export')}?${queryStr}` : route('employees.export');
    };

    const handleImport = (e) => {
        if (e) e.preventDefault();
        if (!importFile) {
            setImportError('Please select a CSV file to import.');
            return;
        }

        setIsImporting(true);
        setImportError('');

        const formData = new FormData();
        formData.append('file', importFile);
        if (importCompanyId) {
            formData.append('company_id', importCompanyId);
        }

        router.post(route('employees.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setShowImportModal(false);
                setImportFile(null);
                setImportCompanyId('');
                setIsImporting(false);
            },
            onError: (err) => {
                setIsImporting(false);
                setImportError(err.file || err.error || 'Failed to import employees. Please verify file format.');
            }
        });
    };

    // Determine if we should filter the company dropdown
    // If all selected employees are from the same company, exclude that company from the list
    const selectedEmployeeObjects = employees.data.filter(e => selectedEmployees.includes(e.id));
    const uniqueCurrentCompanyIds = [...new Set(selectedEmployeeObjects.map(e => e.company_id))];
    const commonCompanyId = uniqueCurrentCompanyIds.length === 1 ? uniqueCurrentCompanyIds[0] : null;

    const availableCompanies = companies.filter(c => {
        if (commonCompanyId && String(c.id) === String(commonCompanyId)) {
            return false;
        }
        return true;
    });

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Employees</h2>}>
            <Head title="Employees" />

            <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Search and Filter Controls */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-[10px] font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Search Database</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Name, code, email, or designation..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-normal"
                                />
                                <FiSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="w-full md:w-64">
                            <label className="block text-[10px] font-normal text-slate-500 uppercase tracking-normal mb-2 ml-1">Department</label>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-normal"
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-primary text-white px-6 py-2 rounded-lg hover:brightness-110 font-normal text-sm transition-all shadow-lg shadow-primary/20 active:scale-95"
                            >
                                Search
                            </button>
                            {(searchTerm || departmentId) && (
                                <Link
                                    href={route('employees.index', { status })}
                                    onClick={() => { setSearchTerm(''); setDepartmentId(''); }}
                                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 font-normal text-sm transition-all"
                                >
                                    Clear
                                </Link>
                            )}
                        </div>
                    </form>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2">
                    <Link href={route('employees.index', { search: searchTerm })} className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all ${!status ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>All Staff</Link>
                    <Link href={route('employees.index', { status: 'active', search: searchTerm })} className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all ${status === 'active' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Active</Link>
                    <Link href={route('employees.index', { status: 'waiting', search: searchTerm })} className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all ${status === 'waiting' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Waiting</Link>
                    <Link href={route('employees.index', { status: 'inactive', search: searchTerm })} className={`px-4 py-1.5 rounded-full text-xs font-normal transition-all ${status === 'inactive' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>Inactive</Link>
                </div>

                {/* Header Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Staff', value: stats.total, color: 'primary', icon: <FiUsers className="w-5 h-5" /> },
                        { label: 'Active', value: stats.active, color: 'emerald', icon: <FiCheckCircle className="w-5 h-5" /> },
                        { label: 'Pending', value: stats.waiting, color: 'amber', icon: <FiClock className="w-5 h-5" /> },
                        { label: 'Depts', value: stats.departments, color: 'indigo', icon: <FiGrid className="w-5 h-5" /> },
                        { label: 'New Hires', value: stats.this_month, color: 'rose', icon: <FiUserPlus className="w-5 h-5" /> }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm group hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-normal text-slate-500 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-normal text-slate-900 group-hover:text-primary transition-colors">{stat.value || 0}</p>
                                </div>
                                <div className={`p-2 ${stat.color === 'primary' ? 'bg-primary' : `bg-${stat.color}-600`} rounded-lg text-white shadow-md transition-all`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-normal text-gray-800">Employee List</h3>
                        <span className="text-sm text-gray-500">Showing {employees.data?.length || 0} of {employees.total || 0} employees</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Bulk Action Toggle */}
                        {hasPermission(user, 'create-employees') && ( // Assuming create-employees implies management
                            <>
                                {isSelectionMode ? (
                                    <>
                                        <div className="flex items-center gap-2 mr-2">
                                            <span className="text-sm font-normal text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                                                {selectedEmployees.length} Selected
                                            </span>
                                            <button
                                                onClick={handleSelectAll}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-normal"
                                            >
                                                {selectedEmployees.length === employees.data.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        {selectedEmployees.length > 0 && (
                                            <button
                                                onClick={() => setShowTransferModal(true)}
                                                className="bg-primary text-white px-4 py-2 rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-sm font-normal transition-colors flex items-center gap-2"
                                            >
                                                <FiSend className="w-4 h-4" />
                                                Transfer Selected
                                            </button>
                                        )}

                                        <button
                                            onClick={toggleSelectionMode}
                                            className="text-gray-600 hover:text-gray-800 px-3 py-2 text-sm font-normal"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={toggleSelectionMode}
                                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-normal transition-colors flex items-center gap-2"
                                    >
                                        <FiList className="w-4 h-4" />
                                        Bulk Actions
                                    </button>
                                )}
                            </>
                        )}

                        {/* Export Button */}
                        <button
                            type="button"
                            onClick={handleExport}
                            className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 text-sm font-normal transition-all shadow-sm flex items-center gap-2"
                            title="Export filtered employee list as CSV"
                        >
                            <FiDownload className="w-4 h-4 text-slate-500" />
                            <span>Export</span>
                        </button>

                        {/* Import Button */}
                        {hasPermission(user, 'create-employees') && (
                            <button
                                type="button"
                                onClick={() => {
                                    setImportFile(null);
                                    setImportError('');
                                    setShowImportModal(true);
                                }}
                                className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 text-sm font-normal transition-all shadow-sm flex items-center gap-2"
                                title="Import employees from CSV"
                            >
                                <FiUpload className="w-4 h-4 text-slate-500" />
                                <span>Import</span>
                            </button>
                        )}

                        {hasPermission(user, 'create-employees') && (
                            <Link
                                href={route('employees.create')}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 text-sm font-normal flex items-center gap-2 transition-all"
                            >
                                <FiPlus className="w-4 h-4" />
                                Add Employee
                            </Link>
                        )}
                    </div>
                </div>

                {/* Employee Cards Grid */}
                {employees.data && employees.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {employees.data.map((employee) => (
                            <div
                                key={employee.id}
                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all border relative overflow-hidden group ${selectedEmployees.includes(employee.id) ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-slate-200'
                                    }`}
                                onClick={() => isSelectionMode && toggleEmployeeSelection(employee.id)}
                            >
                                {isSelectionMode && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedEmployees.includes(employee.id)}
                                            onChange={() => toggleEmployeeSelection(employee.id)}
                                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}

                                <div className={`p-4 flex gap-4 ${isSelectionMode ? 'cursor-pointer' : ''}`}>
                                    <Avatar
                                        src={employee.employee_image}
                                        name={employee.name}
                                        size="md"
                                        className="ring-4 ring-slate-50 group-hover:ring-primary/10 transition-all shadow-inner"
                                    />
                                    <div className="flex-1 min-w-0">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-slate-900 text-sm truncate tracking-normal">{employee.name}</h4>
                                                <p className="text-[10px] text-slate-500 font-normal tracking-normal uppercase">{employee.employee_code}</p>
                                            </div>
                                            {!isSelectionMode && (
                                                <div className="flex space-x-1 shrink-0">
                                                    <Link
                                                        href={route('employees.show', employee.id)}
                                                        className="text-slate-400 hover:text-primary p-1 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                    {hasPermission(user, 'edit-employees') && (
                                                        <Link
                                                            href={route('employees.edit', employee.id)}
                                                            className="text-slate-400 hover:text-emerald-600 p-1.5 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 className="w-4 h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500 font-normal">Position:</span>
                                                <span className="text-slate-900 font-semibold truncate max-w-[100px]">{employee.designation || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500 font-normal">Branch:</span>
                                                <span className="text-slate-900 font-semibold truncate max-w-24">{employee.company?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500 font-normal">Department:</span>
                                                <span className="text-slate-900 font-semibold truncate max-w-24">{employee.department?.name || 'N/A'}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-normal uppercase tracking-normal ${employee.manual_status === 'waiting' ? 'bg-amber-50 text-amber-600' :
                                                    employee.is_active ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    {employee.manual_status === 'waiting' ? 'Pending' : (employee.is_active ? 'Active' : 'Inactive')}
                                                </span>
                                                <span className="text-[10px] font-normal text-slate-400">{formatDate(employee.joined_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="max-w-md mx-auto">
                            <FiAlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-normal text-gray-900 mb-2">No employees found</h3>
                            <p className="text-gray-500 mb-6">Get started by adding your first employee to the system.</p>
                            <Link
                                href={route('employees.create')}
                                className="bg-primary text-white px-6 py-3 rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 font-normal inline-flex items-center gap-2"
                            >
                                <FiPlus className="w-5 h-5" />
                                Add Your First Employee
                            </Link>
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {employees.data && employees.data.length > 0 && (employees.last_page > 1) && (
                    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-normal">{employees.from}</span> to <span className="font-normal">{employees.to}</span> of{' '}
                            <span className="font-normal">{employees.total}</span> results
                        </div>
                        <div className="flex gap-2">
                            {employees.links.map((link, index) => {
                                if (link.url === null) {
                                    return (
                                        <span
                                            key={index}
                                            className="px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-2 text-sm rounded-md transition-colors ${link.active
                                            ? 'bg-blue-600 text-white font-normal'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveScroll
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Transfer Modal */}
            <Modal show={showTransferModal} onClose={() => setShowTransferModal(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-normal text-gray-900 mb-4">Transfer Employees</h3>

                    <div className="mb-4">
                        <p className="text-gray-600">
                            You have selected <span className="font-normal text-blue-600">{selectedEmployees.length}</span> employee(s).
                        </p>
                        {targetCompanyId && transferSummary.skipped > 0 && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                                <span className="font-normal">{transferSummary.skipped}</span> employee(s) are already in the selected branch and will be <span className="font-normal underline">excluded</span> from this transfer.
                            </div>
                        )}
                        {targetCompanyId && (
                            <p className="mt-2 text-sm text-gray-500">
                                Effective Transfer: <span className="font-normal text-green-600">{transferSummary.valid}</span> employee(s).
                            </p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-normal text-gray-700 mb-1">Target Branch (Company) *</label>
                            <select
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={targetCompanyId}
                                onChange={(e) => setTargetCompanyId(e.target.value)}
                            >
                                <option value="">Select Branch</option>
                                {availableCompanies.map(company => (
                                    <option key={company.id} value={company.id}>{company.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-normal text-gray-700 mb-1">Target Department *</label>
                            <select
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={targetDepartmentId}
                                onChange={(e) => setTargetDepartmentId(e.target.value)}
                                disabled={!targetCompanyId || transferSummary.valid === 0}
                            >
                                <option value="">Select Department</option>
                                {availableDepartments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                            {!targetCompanyId && <p className="text-xs text-gray-500 mt-1">Please select a branch first.</p>}
                            {targetCompanyId && transferSummary.valid === 0 && <p className="text-xs text-red-500 mt-1">No eligible employees to transfer to this branch.</p>}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowTransferModal(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-normal"
                            disabled={processingTransfer}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkTransfer}
                            disabled={!targetCompanyId || !targetDepartmentId || processingTransfer || transferSummary.valid === 0}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 font-normal disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {processingTransfer ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Transferring...
                                </>
                            ) : (
                                'Confirm Transfer'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Employee CSV Import Modal */}
            <Modal show={showImportModal} onClose={() => !isImporting && setShowImportModal(false)}>
                <div className="p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                <FiUpload className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-slate-900">Import Employees (CSV)</h3>
                                <p className="text-xs text-slate-500">Upload a CSV file to create or bulk update employees</p>
                            </div>
                        </div>
                        <a
                            href={route('employees.download-template')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                            download
                        >
                            <FiDownload className="w-3.5 h-3.5" />
                            Download Sample Template
                        </a>
                    </div>

                    {importError && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                            <span>{importError}</span>
                        </div>
                    )}

                    <form onSubmit={handleImport} className="space-y-4">
                        {companies.length > 1 && (
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Default Branch / Salon (Optional)</label>
                                <select
                                    value={importCompanyId}
                                    onChange={e => setImportCompanyId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    disabled={isImporting}
                                >
                                    <option value="">Use branch specified in CSV (or default)</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">If the CSV row leaves branch empty, this selected branch will be used.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Spreadsheet File (Excel or CSV) *</label>
                            <div className="relative border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-slate-50/50 group">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImportFile(e.target.files[0]);
                                            setImportError('');
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isImporting}
                                />
                                {importFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                            <FiFileText className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-800">{importFile.name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{(importFile.size / 1024).toFixed(1)} KB — Click or drag to replace</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <FiUpload className="w-5 h-5" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">Click to choose or drag & drop Excel / CSV file</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Supports .xlsx, .xls, .csv files up to 15MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                            <p className="font-medium text-slate-700">Tips for seamless import:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-500 pl-1">
                                <li>Ensure column headers match the template (e.g. <b>Full Name</b>, <b>Employee Code</b>, <b>Branch</b>, <b>Designation</b>).</li>
                                <li>If <b>Employee Code</b> or <b>Email</b> matches an existing employee, their record will be automatically updated.</li>
                                <li>If left blank, employee codes will be auto-generated automatically.</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 text-sm font-normal text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                disabled={isImporting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!importFile || isImporting}
                                className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                            >
                                {isImporting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="w-4 h-4" />
                                        Upload & Import
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            <ConfirmationModal
                show={confirmingAction.show}
                title={confirmingAction.title}
                message={confirmingAction.message}
                onConfirm={confirmingAction.onConfirm}
                onClose={closeModal}
                type={confirmingAction.type}
                hideCancel={confirmingAction.hideCancel}
            />
        </AuthenticatedLayout >
    );
} 