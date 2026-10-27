import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Avatar from '@/Components/Avatar';
import { FiClock, FiUser, FiActivity, FiPieChart, FiFilter, FiSearch, FiX, FiChevronDown, FiChevronUp, FiPhone, FiBriefcase, FiCheckCircle, FiPauseCircle, FiPlayCircle, FiUsers, FiGrid, FiList, FiEye, FiAlertCircle, FiMapPin } from 'react-icons/fi';
import { hasPermission } from '@/helpers/permissions';

/**
 * Format minutes into HH:MM string
 */
const fmtDuration = (minutes) => {
  const m = Math.max(0, Math.round(parseFloat(minutes) || 0));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${String(min).padStart(2, '0')}`;
};

/**
 * Format a time string (HH:mm:ss or HH:mm A) into HH:mm A
 */
const fmtTime = (timeStr) => {
  if (!timeStr) return '--:--';
  try {
    const d = new Date(`2000-01-01T${timeStr}`);
    if (isNaN(d)) return timeStr;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return timeStr;
  }
};

/**
 * Status color mapping
 */
const STATUS_CONFIG = {
  working: { label: 'Working Now', color: 'emerald', icon: <FiCheckCircle className="h-4 w-4" />, dot: 'bg-emerald-500' },
  on_break: { label: 'On Break', color: 'amber', icon: <FiPauseCircle className="h-4 w-4" />, dot: 'bg-amber-500' },
  clocked_out: { label: 'Clocked Out', color: 'blue', icon: <FiPlayCircle className="h-4 w-4" />, dot: 'bg-blue-500' },
  not_checked_in: { label: 'Not Checked In', color: 'slate', icon: <FiUser className="h-4 w-4" />, dot: 'bg-slate-400' },
  on_leave: { label: 'On Leave', color: 'purple', icon: <FiPhone className="h-4 w-4" />, dot: 'bg-purple-500' },
  weekly_off: { label: 'Weekly Off', color: 'indigo', icon: <FiBriefcase className="h-4 w-4" />, dot: 'bg-indigo-500' },
};

export default function LiveFeed({ initialData = {}, filters = {}, companies = [], departments = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user || {};

  const [data, setData] = useState(initialData);
  const [refreshRate, setRefreshRate] = useState(5000); // 5000ms by default, 0 to pause
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(filters.company_id || initialData.selected_company_id || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(filters.department_id || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [onlyLogged, setOnlyLogged] = useState(filters.only_logged !== undefined ? (filters.only_logged === '1' || filters.only_logged === true) : true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedEmployeePunches, setSelectedEmployeePunches] = useState(null);

  const employeesRef = useRef([]);
  const timelineRef = useRef([]);

  // Determine if current user can view live feed
  const canView = useCallback(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.isAdmin?.() || user.isHR?.() || user.isManager?.()) return true;
    return hasPermission(user, 'view-live-attendance') || hasPermission(user, 'view-attendance');
  }, [user]);

  // Fetch live feed data
  const fetchData = useCallback(async (force = false) => {
    if (!canView()) return;
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompanyId) params.set('company_id', selectedCompanyId);
      if (selectedDepartmentId) params.set('department_id', selectedDepartmentId);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('only_logged', onlyLogged ? '1' : '0');

      const response = await fetch(`${route('attendance.live-feed.data')}?${params.toString()}`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      });

      if (response.ok) {
        const json = await response.json();
        if (json.error) {
          console.error('Live feed error:', json.error);
        } else {
          setData(json);
          employeesRef.current = json.employees || [];
          timelineRef.current = json.timeline || [];
        }
      }
    } catch (err) {
      console.error('Failed to fetch live feed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedCompanyId, selectedDepartmentId, statusFilter, searchTerm, onlyLogged, canView]);

  // Initial load
  useEffect(() => {
    if (!canView()) return;
    employeesRef.current = data.employees || [];
    timelineRef.current = data.timeline || [];
    fetchData();
  }, []);

  // Polling for live updates when tab is active
  useEffect(() => {
    if (!canView() || refreshRate === 0) return;

    const poll = () => {
      if (document.hidden) return;
      fetchData();
    };

    const interval = setInterval(poll, refreshRate);
    return () => clearInterval(interval);
  }, [canView, fetchData, refreshRate]);

  // Compute KPIs from current data
  const kpi = data.summary || { total: 0, working: 0, on_break: 0, clocked_out: 0, not_checked_in: 0, on_leave: 0, weekly_off: 0 };

  const filteredEmployees = data.employees?.filter((emp) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return emp.name.toLowerCase().includes(term) ||
             emp.employee_code.toLowerCase().includes(term) ||
             emp.designation.toLowerCase().includes(term) ||
             emp.department.toLowerCase().includes(term);
    }
    return true;
  }) || [];

  const activeBreaks = filteredEmployees.filter((e) => e.status === 'on_break');

  // Format break elapsed as MM:SS
  const fmtBreakTimer = (minutes) => {
    const m = Math.max(0, Math.round(parseFloat(minutes) || 0));
    const h = Math.floor(m / 60);
    const min = m % 60;
    const sec = Math.round(((parseFloat(minutes) || 0) - Math.floor(parseFloat(minutes) || 0)) * 60);
    return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (!canView()) {
    return (
      <AuthenticatedLayout header="Live Employee Feed">
        <Head title="Live Feed - Unauthorized" />
        <div className="min-h-full bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <FiClock className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">Unauthorized</h2>
            <p className="mt-2 text-slate-600">You do not have permission to view the live employee feed.</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout header="Live Employee Feed">
      <Head title="Live Employee Feed | Workforce Pro" />

      {/* Live Header & Inline Controls */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FiClock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Workforce Live Radar</h1>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {data.current_time || '--:--'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{data.current_date} • {data.timezone}</p>
            </div>
          </div>

          {/* Right Controls: Auto-refresh, manual refresh, View mode */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyLogged(!onlyLogged)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                onlyLogged ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${onlyLogged ? 'bg-indigo-600' : 'bg-slate-400'}`} />
              {onlyLogged ? 'Logged Today Only' : 'All Staff'}
            </button>

            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="text-xs rounded-lg border-slate-200 py-1.5 pl-2.5 pr-7 bg-white text-slate-600 font-medium focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={5000}>Refresh 5s</option>
              <option value={10000}>Refresh 10s</option>
              <option value={30000}>Refresh 30s</option>
              <option value={0}>Pause</option>
            </select>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <FiActivity className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>Sync</span>
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Grid View"
              >
                <FiGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Table View"
              >
                <FiList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter inputs row: Company, Department, Search */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100">
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="text-xs rounded-lg border-slate-200 py-1.5 pl-2.5 pr-8 bg-slate-50 text-slate-700 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Companies / Branches</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="text-xs rounded-lg border-slate-200 py-1.5 pl-2.5 pr-8 bg-slate-50 text-slate-700 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <div className="relative">
            <FiSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee name, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-lg border-slate-200 pl-8 pr-7 py-1.5 bg-slate-50 text-slate-700 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { value: 'all', label: 'All Logged', count: kpi.logged_today ?? (kpi.working + kpi.on_break + kpi.clocked_out) },
            { value: 'working', label: 'Working', count: kpi.working, dot: 'bg-emerald-500' },
            { value: 'on_break', label: 'On Break', count: kpi.on_break, dot: 'bg-amber-500' },
            { value: 'clocked_out', label: 'Clocked Out', count: kpi.clocked_out, dot: 'bg-blue-500' },
            { value: 'not_checked_in', label: 'Not In', count: kpi.not_checked_in, dot: 'bg-slate-400' },
            { value: 'on_leave', label: 'Leave', count: kpi.on_leave, dot: 'bg-purple-500' },
            { value: 'weekly_off', label: 'Off', count: kpi.weekly_off, dot: 'bg-indigo-500' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                statusFilter === s.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.dot && <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === s.value ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700 font-bold'}`}>
                {s.count ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-6 px-4 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Employee Feed</h1>
            <p className="text-slate-500 text-sm">{data.current_date || ''} • {data.timezone || ''}</p>
          </div>

          <div className="flex items-center gap-2 hidden lg:flex">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase text-slate-400">Live updates every 5s</span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Employees', value: kpi.total, color: 'slate', icon: <FiUsers className="h-5 w-5" /> },
            { label: 'Working Now', value: kpi.working, color: 'emerald', icon: <FiCheckCircle className="h-5 w-5" /> },
            { label: 'On Break', value: kpi.on_break, color: 'amber', icon: <FiPauseCircle className="h-5 w-5" /> },
            { label: 'Clocked Out', value: kpi.clocked_out, color: 'blue', icon: <FiPlayCircle className="h-5 w-5" /> },
            { label: 'Not Checked In', value: kpi.not_checked_in, color: 'slate', icon: <FiUser className="h-5 w-5" /> },
            { label: 'On Leave', value: kpi.on_leave, color: 'purple', icon: <FiPhone className="h-5 w-5" /> },
            { label: 'Weekly Off', value: kpi.weekly_off, color: 'indigo', icon: <FiBriefcase className="h-5 w-5" /> },
          ].map((card, idx) => (
            <div key={idx} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}-50 text-${card.color}-600 shadow-sm group-hover:shadow-lg transition-shadow`}>
                  {card.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider text-${card.color}-600 group-hover:text-${card.color}-700`}>
                  {card.label}
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Active Breaks Banner */}
        {activeBreaks.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm shadow-amber-50/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <FiClock className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800">Active Breaks</h3>
                <p className="text-[10px] font-bold uppercase text-amber-600">{activeBreaks.length} employee(s) currently on break</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="inline-flex min-w-full gap-3 px-1">
                {activeBreaks.map((emp) => (
                  <div key={emp.id} className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg bg-white shadow-sm border border-amber-200 whitespace-nowrap">
                    <Avatar src={emp.image} name={emp.name} size="xs" className="rounded-full border border-amber-200" />
                    <span className="text-[10px] font-bold text-amber-800 leading-tight">{emp.name}</span>
                    <span className="text-[9px] font-bold text-amber-600">{fmtBreakTimer(emp.break_elapsed_minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Employee Grid / List */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">Live Status</span>
              <span className="ml-1 text-[10px] font-bold text-slate-500">{filteredEmployees.length} of {kpi.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 sm:w-auto"
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="px-6 py-12 text-center bg-white">
              <FiActivity className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900">No employees match criteria</h3>
              <p className="text-slate-500 text-xs mt-1">Try switching to "All Staff" or selecting a different status filter.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5 bg-slate-50/50">
              {filteredEmployees.map((emp) => {
                const status = STATUS_CONFIG[emp.status] || STATUS_CONFIG.not_checked_in;
                const isBreak = emp.status === 'on_break';
                const isWorking = emp.status === 'working';
                return (
                  <div
                    key={emp.id}
                    className={`relative rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      isBreak ? 'border-amber-300 ring-2 ring-amber-100' : isWorking ? 'border-emerald-200' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          isBreak ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          isWorking ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          emp.status === 'clocked_out' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${isWorking || isBreak ? 'animate-pulse' : ''}`} />
                          {status.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{emp.employee_code}</span>
                      </div>

                      {/* Employee Info */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar src={emp.image} name={emp.name} size="md" className="rounded-full border border-slate-200" />
                          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${status.dot}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{emp.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate">{emp.department} • {emp.company}</p>
                        </div>
                      </div>

                      {/* Live Break Indicator */}
                      {isBreak && (
                        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-2 text-center animate-pulse">
                          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800">
                            <FiPauseCircle className="h-3.5 w-3.5" />
                            <span>Break Duration: {fmtBreakTimer(emp.break_elapsed_minutes)}</span>
                          </div>
                          <span className="text-[10px] text-amber-600">Started at {fmtTime(emp.break_start_time)}</span>
                        </div>
                      )}

                      {/* Punch & Shift Metrics */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Clock In</span>
                          <span className="font-bold text-slate-700">{fmtTime(emp.clock_in_time)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Worked</span>
                          <span className="font-bold text-slate-700">{emp.hours_worked ? `${fmtDuration(emp.hours_worked)}h` : '--'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom actions */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {emp.punches_count || 0} punches today
                      </span>
                      <button
                        onClick={() => setSelectedEmployeePunches(emp)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <FiEye className="h-3.5 w-3.5" />
                        <span>Punches</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Dept & Company</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Clock In</th>
                    <th className="py-3 px-3">Break Elapsed</th>
                    <th className="py-3 px-3">Worked</th>
                    <th className="py-3 px-3 text-right">Punches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => {
                    const status = STATUS_CONFIG[emp.status] || STATUS_CONFIG.not_checked_in;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={emp.image} name={emp.name} size="sm" className="rounded-full" />
                            <div>
                              <div className="font-bold text-slate-900">{emp.name}</div>
                              <div className="text-[10px] text-slate-400">{emp.employee_code} • {emp.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-700">{emp.department}</div>
                          <div className="text-[10px] text-slate-400">{emp.company}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.status === 'on_break' ? 'bg-amber-100 text-amber-800' :
                            emp.status === 'working' ? 'bg-emerald-100 text-emerald-800' :
                            emp.status === 'clocked_out' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{fmtTime(emp.clock_in_time)}</td>
                        <td className="py-3 px-3">
                          {emp.status === 'on_break' ? (
                            <span className="font-bold text-amber-600 animate-pulse">{fmtBreakTimer(emp.break_elapsed_minutes)}</span>
                          ) : (
                            <span className="text-slate-400">{emp.total_break_minutes ? `${emp.total_break_minutes}m` : '--'}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {emp.hours_worked ? `${fmtDuration(emp.hours_worked)} hrs` : '--'}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedEmployeePunches(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
                          >
                            <FiEye className="h-3 w-3" />
                            <span>{emp.punches_count || 0}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Day Punches Modal */}
        {selectedEmployeePunches && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedEmployeePunches.image} name={selectedEmployeePunches.name} size="md" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedEmployeePunches.name}</h3>
                    <p className="text-xs text-slate-500">{selectedEmployeePunches.employee_code} • {selectedEmployeePunches.designation}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployeePunches(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Worked</span>
                    <span className="text-sm font-bold text-slate-800">{selectedEmployeePunches.hours_worked ? `${fmtDuration(selectedEmployeePunches.hours_worked)}h` : '0h'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Break</span>
                    <span className="text-sm font-bold text-amber-600">{selectedEmployeePunches.total_break_minutes || 0}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Punches</span>
                    <span className="text-sm font-bold text-indigo-600">{selectedEmployeePunches.punches?.length || 0}</span>
                  </div>
                </div>

                {/* Punches Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Today's Punch Log</h4>
                  {(!selectedEmployeePunches.punches || selectedEmployeePunches.punches.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No biometric/manual punches recorded today.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedEmployeePunches.punches.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (p.type || p.punch_type || 'IN').toLowerCase().includes('in') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {p.type || p.punch_type || (idx % 2 === 0 ? 'PUNCH IN' : 'PUNCH OUT')}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {p.punch_time || p.time || p.created_at || '--:--'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {p.device_name || p.location || p.type_label || 'App / Biometric'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Break History */}
                {selectedEmployeePunches.break_history && selectedEmployeePunches.break_history.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Break History</h4>
                    <div className="space-y-1.5">
                      {selectedEmployeePunches.break_history.map((b, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-amber-50/50 border border-amber-100">
                          <span className="font-semibold text-amber-900">
                            {fmtTime(b.start)} - {b.end ? fmtTime(b.end) : 'In Progress'}
                          </span>
                          <span className="font-bold text-amber-700">
                            {b.duration ? `${Math.round(b.duration)} mins` : 'Ongoing'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedEmployeePunches(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="mt-8 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiActivity className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Last 40 events</span>
          </div>

          <div className="divide-y divide-slate-50/50">
            {(data.timeline || []).map((event) => (
              <div key={event.id} className="px-6 py-4 flex items-start gap-4 group hover:bg-slate-50 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-100 bg-white">
                  <div className={`h-2 w-2 rounded-full ${event.color}-500`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{event.employee_name}</p>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{event.employee_code}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase ${event.color}-600`}>{event.title}</span>
                    <span className="text-[10px] font-bold text-slate-400">•</span>
                    <span className="text-[10px] font-bold text-slate-500">{event.time}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 mt-1">{event.detail}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{event.department} • {event.company}</p>
                </div>
              </div>
            ))}
            {(data.timeline || []).length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="text-slate-500 text-sm">No recent activity.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
