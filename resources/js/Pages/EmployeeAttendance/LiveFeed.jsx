import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Avatar from '@/Components/Avatar';
import { FiClock, FiUser, FiActivity, FiPieChart, FiFilter, FiSearch, FiX, FiChevronDown, FiChevronUp, FiPhone, FiBriefcase, FiCheckCircle, FiPauseCircle, FiPlayCircle, FiUsers } from 'react-icons/fi';
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
  const [pollInterval, setPollInterval] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(filters.company_id || data.selected_company_id || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(filters.department_id || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [refreshing, setRefreshing] = useState(false);

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
  }, [selectedCompanyId, selectedDepartmentId, statusFilter, searchTerm, canView]);

  // Initial load
  useEffect(() => {
    if (!canView()) return;
    employeesRef.current = data.employees || [];
    timelineRef.current = data.timeline || [];
    fetchData();
  }, []);

  // Polling for live updates (every 5 seconds when tab is active)
  useEffect(() => {
    if (!canView()) return;

    const poll = () => {
      if (document.hidden) return;
      fetchData();
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [canView, fetchData]);

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

      {/* Top Filter Bar (Mobile + Desktop) */}
      <div className="sticky top-0 z-20 flex flex-col gap-3 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <FiClock className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Live Feed</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            {data.current_time || '--:--'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-indigo-300"
          >
            <FiFilter className={`h-4 w-4 ${filterOpen ? 'text-indigo-600 rotate-180' : 'text-slate-400'}`} />
            <span className={`font-semibold ${filterOpen ? 'text-indigo-600' : 'text-slate-600'}`}>Filter</span>
            {(selectedCompanyId || selectedDepartmentId || statusFilter !== 'all' || searchTerm) && (
              <span className="ml-1 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <FiActivity className="h-4 w-4" />
            )}
            <span className="font-semibold">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Drawer / Panel */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex" aria-label="Filters">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setFilterOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl rounded-t-2xl border-t border-slate-200 flex flex-col max-h-[85vh] flex-1 transform transition-transform duration-300 translate-y-0 sm:rounded-none sm:rounded-l-2xl sm:h-full sm:max-h-none sm:border-t-0 sm:border-r border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Filters</h3>
              <button onClick={() => setFilterOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</p>
                <div className="space-y-2">
                  {companies.map((company) => (
                    <label key={company.id} className="flex items-center justify-between p-2 rounded-lg border border-transparent cursor-pointer hover:bg-slate-50 hover:border-slate-200 transition-all group">
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{company.name}</span>
                      <input
                        type="radio"
                        name="company_filter"
                        checked={String(company.id) === selectedCompanyId}
                        onChange={() => setSelectedCompanyId(String(company.id))}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                  {!selectedCompanyId && (
                    <div className="text-[10px] text-slate-400 italic mt-1">All companies</div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Department</p>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex items-center justify-between p-2 rounded-lg border border-transparent cursor-pointer hover:bg-slate-50 hover:border-slate-200 transition-all group">
                      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{dept.name}</span>
                      <input
                        type="radio"
                        name="department_filter"
                        checked={String(dept.id) === selectedDepartmentId}
                        onChange={() => setSelectedDepartmentId(String(dept.id))}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  ))}
                  {!selectedDepartmentId && (
                    <div className="text-[10px] text-slate-400 italic mt-1">All departments</div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'working', label: 'Working Now', color: 'emerald' },
                    { value: 'on_break', label: 'On Break', color: 'amber' },
                    { value: 'clocked_out', label: 'Clocked Out', color: 'blue' },
                    { value: 'not_checked_in', label: 'Not Checked In', color: 'slate' },
                    { value: 'on_leave', label: 'On Leave', color: 'purple' },
                    { value: 'weekly_off', label: 'Weekly Off', color: 'indigo' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatusFilter(s.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${
                        statusFilter === s.value
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{s.label}</span>
                      {statusFilter === s.value && <FiCheckCircle className="h-4 w-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Search</p>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, code, designation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedCompanyId('');
                    setSelectedDepartmentId('');
                    setStatusFilter('all');
                    setSearchTerm('');
                    setFilterOpen(false);
                    fetchData(true);
                  }}
                  className="w-full py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => {
                    setFilterOpen(false);
                    fetchData(true);
                  }}
                  className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 text-sm font-bold text-white transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

          <div className="divide-y divide-slate-50/50">
            {filteredEmployees.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FiActivity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900">No employees found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const status = STATUS_CONFIG[emp.status] || STATUS_CONFIG.not_checked_in;
                return (
                  <div key={emp.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group hover:bg-slate-50 transition-colors border-b border-slate-50/50 last:border-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <Avatar src={emp.image} name={emp.name} size="sm" className="flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                          <span className="text-[10px] font-bold uppercase text-slate-400">{emp.employee_code}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 truncate">{emp.designation} • {emp.department}</p>
                        {emp.company && (
                          <p className="text-[10px] font-bold text-slate-400 truncate">{emp.company}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase border-${status.color}-100 bg-${status.color}-50 text-${status.color}-700`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.color}-500`} />
                        {status.label}
                      </span>

                      {emp.clock_in_time && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600">
                          <FiClock className="h-3 w-3 text-slate-400" />
                          {fmtTime(emp.clock_in_time)}
                        </span>
                      )}

                      {emp.status === 'on_break' && emp.break_start_time && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700 animate-pulse">
                          <FiPauseCircle className="h-3 w-3 text-amber-500 animate-pulse" />
                          Break: {fmtBreakTimer(emp.break_elapsed_minutes)}
                        </span>
                      )}

                      {emp.hours_worked && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600">
                          {fmtDuration(emp.hours_worked)} hrs
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
