import ApplicationLogo from '@/Components/ApplicationLogo';
import Avatar from '@/Components/Avatar';
import Dropdown from '@/Components/Dropdown';
import {
    hasAnyPermission,
    hasPermission,
    hasRole,
} from '@/helpers/permissions';
import {
    BanknotesIcon,
    BellIcon,
    BriefcaseIcon,
    ClipboardDocumentCheckIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FiAlertCircle,
    FiAward,
    FiBookOpen,
    FiBriefcase,
    FiCalendar,
    FiCheckSquare,
    FiClock,
    FiCreditCard,
    FiDatabase,
    FiDollarSign,
    FiExternalLink,
    FiFile,
    FiFileText,
    FiGrid,
    FiLogOut,
    FiPieChart,
    FiSearch,
    FiSettings,
    FiShield,
    FiUserMinus,
    FiUsers,
    FiVolume2,
    FiVolumeX,
    FiX,
} from 'react-icons/fi';

/**
 * Convert a hex colour (#rgb / #rrggbb) into an "R, G, B" channel triplet.
 * Used to expose the admin-configured theme colour to CSS as --primary-rgb so
 * Tailwind opacity modifiers (bg-primary/10, shadow-primary/20, ...) work.
 * Falls back to the default brand navy when the value is not a valid hex colour.
 */
function hexToRgb(hex, fallback = '9, 11, 78') {
    if (typeof hex !== 'string') return fallback;

    let value = hex.trim().replace(/^#/, '');

    // Support the shorthand #abc form.
    if (value.length === 3) {
        value = value
            .split('')
            .map((char) => char + char)
            .join('');
    }

    if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;

    const int = parseInt(value, 16);
    /* eslint-disable no-bitwise */
    return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
    /* eslint-enable no-bitwise */
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, appSettings } = usePage().props;
    const user = auth?.user || {};
    const userRole = user.role || 'employee';

    const getNotificationStyles = (type) => {
        switch (type) {
            case 'task_assigned':
            case 'task_completed':
                return {
                    icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
                    classes:
                        'bg-emerald-50 text-emerald-600 border-emerald-100',
                };
            case 'task_comment':
                return {
                    icon: <FiFileText className="h-5 w-5" />,
                    classes: 'bg-teal-50 text-teal-600 border-teal-100',
                };
            case 'project_assigned':
                return {
                    icon: <BriefcaseIcon className="h-5 w-5" />,
                    classes: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                };
            case 'salary_generated':
            case 'salary_approved':
                return {
                    icon: <BanknotesIcon className="h-5 w-5" />,
                    classes: 'bg-amber-50 text-amber-600 border-amber-100',
                };
            case 'leave_requested':
            case 'leave_status_updated':
                return {
                    icon: <FiCalendar className="h-5 w-5" />,
                    classes: 'bg-purple-50 text-purple-600 border-purple-100',
                };
            case 'shift_roster_created':
                return {
                    icon: <FiClock className="h-5 w-5" />,
                    classes: 'bg-sky-50 text-sky-600 border-sky-100',
                };
            case 'shift_roster_approved':
                return {
                    icon: <FiClock className="h-5 w-5" />,
                    classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                };
            case 'shift_roster_updated':
            case 'shift_roster_rejected':
                return {
                    icon: <FiClock className="h-5 w-5" />,
                    classes: 'bg-amber-50 text-amber-600 border-amber-100',
                };
            case 'attendance_event':
            case 'attendance_updated':
                return {
                    icon: <FiClock className="h-5 w-5" />,
                    classes: 'bg-teal-50 text-teal-600 border-teal-100',
                };
            case 'document_expiring':
                return {
                    icon: <FiAlertCircle className="h-5 w-5" />,
                    classes: 'bg-amber-50 text-amber-600 border-amber-100',
                };
            case 'offboarding_requested':
            case 'offboarding_status_updated':
                return {
                    icon: <FiUserMinus className="h-5 w-5" />,
                    classes: 'bg-rose-50 text-rose-600 border-rose-100',
                };
            case 'appraisal_initiated':
                return {
                    icon: <FiAward className="h-5 w-5" />,
                    classes: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                };
            case 'appraisal_approved':
                return {
                    icon: <FiAward className="h-5 w-5" />,
                    classes: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                };
            case 'grievance_submitted':
            case 'grievance_status_updated':
                return {
                    icon: <FiAlertCircle className="h-5 w-5" />,
                    classes: 'bg-orange-50 text-orange-600 border-orange-100',
                };
            case 'warning_letter_issued':
                return {
                    icon: <FiFileText className="h-5 w-5" />,
                    classes: 'bg-rose-50 text-rose-600 border-rose-100',
                };
            case 'loan_requested':
            case 'loan_status_updated':
            case 'advance_requested':
            case 'advance_status_updated':
                return {
                    icon: <FiDollarSign className="h-5 w-5" />,
                    classes: 'bg-sky-50 text-sky-600 border-sky-100',
                };
            case 'expense_submitted':
            case 'expense_approved':
            case 'expense_rejected':
            case 'expense_paid':
                return {
                    icon: <FiDollarSign className="h-5 w-5" />,
                    classes:
                        'bg-emerald-50 text-emerald-600 border-emerald-100',
                };
            default:
                return {
                    icon: <InformationCircleIcon className="h-5 w-5" />,
                    classes: 'bg-slate-50 text-slate-600 border-slate-100',
                };
        }
    };

    // Notification state for real-time reactivity without page reload
    const [unreadCount, setUnreadCount] = useState(user?.unreadNotifications?.length || 0);
    const [notificationsList, setNotificationsList] = useState(user?.unreadNotifications || []);
    const [activeToast, setActiveToast] = useState(null);

    // Sync with page props whenever Inertia updates user.unreadNotifications
    useEffect(() => {
        if (Array.isArray(user?.unreadNotifications)) {
            setNotificationsList(user.unreadNotifications);
            setUnreadCount(user.unreadNotifications.length);
        }
    }, [user?.unreadNotifications]);

    // System Notification Audio & Auto-Polling Hook
    const [soundMuted, setSoundMuted] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('notification_sound_muted') === '1';
        }
        return false;
    });

    const toggleSoundMute = (e) => {
        if (e) e.stopPropagation();
        setSoundMuted((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('notification_sound_muted', next ? '1' : '0');
            }
            return next;
        });
    };

    const prevCountRef = useRef(user?.unreadNotifications?.length || 0);

    const playNotificationSound = useCallback(() => {
        const soundEnabled = appSettings?.notification_sound_enabled !== false;
        const soundFile = appSettings?.notification_sound_file || '/sounds/notification.mp3';

        if (soundEnabled && !soundMuted) {
            try {
                const audio = new Audio(soundFile);
                audio.volume = 0.8;
                audio.play().catch((err) => {
                    console.log('Notification chime muted pending interaction:', err?.message);
                });
            } catch (e) {
                console.error('Notification sound error:', e);
            }
        }
    }, [soundMuted, appSettings?.notification_sound_enabled, appSettings?.notification_sound_file]);

    // Live background polling for new notifications (every 4.5s when tab is active)
    useEffect(() => {
        if (!user?.id) return;

        const pollNotifications = async () => {
            if (typeof document === 'undefined' || document.hidden) return;

            try {
                const response = await fetch(route('notifications.poll'), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (response.ok) {
                    const data = await response.json();
                    const newCount = Number(data.unreadCount || 0);

                    if (newCount > prevCountRef.current) {
                        playNotificationSound();

                        if (data.latest) {
                            setActiveToast(data.latest);
                        }
                    }

                    prevCountRef.current = newCount;
                    setUnreadCount(newCount);
                    setNotificationsList(data.notifications || []);
                }
            } catch (err) {
                // Background poll silent catch
            }
        };

        const pollInterval = setInterval(pollNotifications, 4500);
        return () => clearInterval(pollInterval);
    }, [user?.id, playNotificationSound]);

    // Auto-dismiss floating toast alert after 6 seconds
    useEffect(() => {
        if (!activeToast) return;
        const timer = setTimeout(() => {
            setActiveToast(null);
        }, 6000);
        return () => clearTimeout(timer);
    }, [activeToast]);

    const handleMarkAllAsRead = (e) => {
        if (e) e.preventDefault();
        setUnreadCount(0);
        setNotificationsList([]);
        prevCountRef.current = 0;
        router.post(route('notifications.markAllAsRead'), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleMarkAsRead = (id) => {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotificationsList((prev) => prev.filter((n) => n.id !== id));
        prevCountRef.current = Math.max(0, prevCountRef.current - 1);
        router.post(route('notifications.markAsRead', id), {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('expandedMenus');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [activeMenu, setActiveMenu] = useState(() => {
        // Try to load from localStorage
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebarActiveMenu') || '';
        }
        return '';
    });

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleSubMenu = (menuName) => {
        setExpandedMenus((prev) => {
            const newExpanded = prev.includes(menuName)
                ? prev.filter((m) => m !== menuName)
                : [...prev, menuName];
            if (typeof window !== 'undefined') {
                localStorage.setItem(
                    'expandedMenus',
                    JSON.stringify(newExpanded),
                );
            }
            return newExpanded;
        });
    };

    // Helper function to check if user can access a route
    const canAccess = (roles, permissions) => {
        // Super admin has unrestricted access to everything
        if (user.role === 'admin' || hasRole(user, 'admin')) return true;

        const hasSpecificRoles = Array.isArray(roles) && roles.length > 0;
        const hasSpecificPermissions =
            Array.isArray(permissions) && permissions.length > 0;

        // If neither roles nor permissions are specified, by default visible (e.g. Dashboard)
        if (!hasSpecificRoles && !hasSpecificPermissions) return true;

        // If permissions are specified, user MUST have at least one of the required permissions
        if (hasSpecificPermissions && !userHasAnyPermission(permissions)) {
            return false;
        }

        // If roles are specified, check role restrictions
        if (hasSpecificRoles) {
            const roleAllowed = hasRole(user, roles);

            // If user's role is in the allowed list, permit access
            if (roleAllowed) return true;

            // If user is a standard employee and 'employee' is NOT in allowed roles, strictly DENY
            if (
                userRole === 'employee' ||
                user.role === 'employee' ||
                hasRole(user, 'employee')
            ) {
                return false;
            }

            // For custom staff roles (e.g. shift-manager, supervisor), if they have the required permission, permit
            if (hasSpecificPermissions && userHasAnyPermission(permissions)) {
                return true;
            }

            return false;
        }

        // If only permissions were specified, user has permission (verified above)
        return true;
    };

    // Helper function to check if user has permission
    const userHasPermission = (permission) => {
        return hasPermission(user, permission);
    };

    // Helper function to check if user has any of the permissions
    const userHasAnyPermission = (permissions) => {
        return hasAnyPermission(user, permissions);
    };

    // Re-organized navigation categories
    const navigationGroups = [
        {
            title: 'CORE',
            items: [
                {
                    name: 'Dashboard',
                    href:
                        userRole === 'employee'
                            ? route('employee.dashboard')
                            : route('dashboard'),
                    icon: <FiGrid className="h-4 w-4" />,
                    current:
                        route().current('dashboard') ||
                        route().current('employee.dashboard'),
                },
                {
                    name: 'Employees',
                    href: route('employees.index'),
                    icon: <FiUsers className="h-4 w-4" />,
                    current:
                        route().current('employees.*') ||
                        route().current('settings.dropdown-options.*'),
                    permissions: ['view-employees'],
                    roles: ['admin', 'hr', 'manager'],
                    subMenu: [
                        {
                            name: 'Directory',
                            href: route('employees.index'),
                            current: route().current('employees.*'),
                            permissions: ['view-employees'],
                            roles: ['admin', 'hr', 'manager'],
                        },
                        {
                            name: 'Configurations',
                            href: route('settings.dropdown-options.index'),
                            current: route().current(
                                'settings.dropdown-options.*',
                            ),
                            permissions: ['manage-dropdowns'],
                            roles: ['admin', 'hr'],
                        },
                    ],
                },
            ],
        },
        {
            title: 'TIME & ATTENDANCE',
            items: [
                {
                    name: 'Attendance',
                    href: route('employee-attendances.index'),
                    icon: <FiClock className="h-4 w-4" />,
                    current: route().current('employee-attendances.*'),
                    permissions: ['view-attendance'],
                    roles: ['admin', 'hr', 'manager'],
                },
                {
                    name: 'Shift Roster',
                    href: route('shift-rosters.index'),
                    icon: <FiCalendar className="h-4 w-4" />,
                    current: route().current('shift-rosters.*'),
                    permissions: ['view-shift-rosters'],
                    roles: ['admin', 'hr', 'manager'],
                    subMenu: [
                        {
                            name: 'Roster Schedule',
                            href: route('shift-rosters.index'),
                            current:
                                route().current('shift-rosters.index') ||
                                route().current('shift-rosters.create'),
                            permissions: ['view-shift-rosters'],
                        },
                        {
                            name: 'Approvals & Schedules',
                            href: route('shift-rosters.management'),
                            current: route().current(
                                'shift-rosters.management',
                            ),
                            permissions: [
                                'view-shift-roster-management',
                                'approve-shift-rosters',
                                'manage-shift-rosters',
                            ],
                            roles: ['admin', 'hr', 'manager'],
                        },
                    ],
                },
                {
                    name: 'Leave & Holidays',
                    href: route('leave-requests.index'),
                    icon: <FiCalendar className="h-4 w-4" />,
                    current:
                        route().current('leave-requests.*') ||
                        route().current('leave-types.*') ||
                        route().current('holidays.*'),
                    permissions: ['view-leave-requests'],
                    subMenu: [
                        {
                            name: 'Requests',
                            href: route('leave-requests.index'),
                            current: route().current('leave-requests.*'),
                            permissions: ['view-leave-requests'],
                        },
                        {
                            name: 'Types',
                            href: route('leave-types.index'),
                            current: route().current('leave-types.*'),
                            permissions: ['manage-leave-types'],
                            roles: ['admin', 'hr'],
                        },
                        {
                            name: 'Holidays',
                            href: route('holidays.index'),
                            current: route().current('holidays.*'),
                            permissions: ['view-holidays'],
                        },
                    ],
                },
            ],
        },
        {
            title: 'PAYROLL & FINANCE',
            items: [
                {
                    name: userRole === 'employee' ? 'My Payslips' : 'Payroll',
                    href: route('salary-postings.index'),
                    icon: <FiDollarSign className="h-4 w-4" />,
                    current:
                        route().current('salary-postings.*') ||
                        route().current('salary-components.*'),
                    permissions: ['view-salary-postings'],
                    subMenu: [
                        {
                            name:
                                userRole === 'employee'
                                    ? 'My Payslips'
                                    : 'Salary Postings',
                            href: route('salary-postings.index'),
                            current: route().current('salary-postings.*'),
                            permissions: ['view-salary-postings'],
                        },
                        {
                            name: 'Components',
                            href: route('salary-components.index'),
                            current: route().current('salary-components.*'),
                            permissions: ['manage-salary-components'],
                            roles: ['admin', 'hr'],
                        },
                    ],
                },
                {
                    name: 'Expenses',
                    href: route('expenses.index'),
                    icon: <FiFileText className="h-4 w-4" />,
                    current:
                        route().current('expenses.*') ||
                        route().current('expense-categories.*'),
                    permissions: ['view-expenses'],
                    roles: ['admin', 'hr', 'finance', 'manager', 'employee'],
                    subMenu: [
                        {
                            name: 'Claims',
                            href: route('expenses.index'),
                            current: route().current('expenses.*'),
                            permissions: ['view-expenses'],
                            roles: [
                                'admin',
                                'hr',
                                'finance',
                                'manager',
                                'employee',
                            ],
                        },
                        {
                            name: 'Categories & Policy',
                            href: route('expense-categories.index'),
                            current: route().current('expense-categories.*'),
                            permissions: ['manage-expense-categories'],
                            roles: ['admin', 'hr', 'finance'],
                        },
                    ],
                },
                {
                    name: 'Financials',
                    href: route('loans.index'),
                    icon: <FiCreditCard className="h-4 w-4" />,
                    current:
                        route().current('loans.*') ||
                        route().current('advances.*'),
                    permissions: ['view-loans', 'view-advances'],
                    roles: ['admin', 'hr', 'finance', 'manager', 'employee'],
                    subMenu: [
                        {
                            name: 'Loans',
                            href: route('loans.index'),
                            current: route().current('loans.*'),
                            permissions: ['view-loans'],
                            roles: [
                                'admin',
                                'hr',
                                'finance',
                                'manager',
                                'employee',
                            ],
                        },
                        {
                            name: 'Advances',
                            href: route('advances.index'),
                            current: route().current('advances.*'),
                            permissions: ['view-advances'],
                            roles: [
                                'admin',
                                'hr',
                                'finance',
                                'manager',
                                'employee',
                            ],
                        },
                    ],
                },
            ],
        },
        {
            title: 'HR MANAGEMENT',
            items: [
                {
                    name: 'Evaluations',
                    href: route('evaluations.index'),
                    icon: <FiAward className="h-4 w-4" />,
                    current: route().current('evaluations.*'),
                    permissions: ['view-evaluations'],
                    roles: ['admin', 'hr', 'manager'],
                },
                {
                    name: 'Training',
                    href: route('trainings.index'),
                    icon: <FiBookOpen className="h-4 w-4" />,
                    current:
                        route().current('trainings.*') ||
                        route().current('training-assignments.*') ||
                        route().current('training-categories.*'),
                    permissions: ['view-trainings'],
                    subMenu: [
                        {
                            name: 'Courses',
                            href: route('trainings.index'),
                            current: route().current('trainings.*'),
                            permissions: ['view-trainings'],
                        },
                        {
                            name: 'Assignments',
                            href: route('training-assignments.index'),
                            current: route().current('training-assignments.*'),
                            permissions: ['view-training-assignments'],
                        },
                        {
                            name: 'Categories',
                            href: route('training-categories.index'),
                            current: route().current('training-categories.*'),
                            permissions: ['create-trainings'],
                            roles: ['admin', 'hr'],
                        },
                    ],
                },
                {
                    name: 'Grievances',
                    href: route('grievances.index'),
                    icon: <FiAlertCircle className="h-4 w-4" />,
                    current: route().current('grievances.*'),
                    permissions: ['view-grievances'],
                },
                {
                    name: 'Warning Letters',
                    href: route('warning-letters.index'),
                    icon: <FiFileText className="h-4 w-4" />,
                    current: route().current('warning-letters.*'),
                    permissions: ['view-warning-letters'],
                },
                {
                    name:
                        userRole === 'employee'
                            ? 'Resignation / Exit'
                            : 'Offboarding',
                    href: route('offboarding.index'),
                    icon: <FiUserMinus className="h-4 w-4" />,
                    current: route().current('offboarding.*'),
                    permissions: ['view-offboarding', 'create-offboarding'],
                    roles: ['admin', 'hr', 'manager', 'employee'],
                },
            ],
        },
        {
            title: 'WORK',
            items: [
                {
                    name: 'Tasks & Projects',
                    href: route('tasks.index'),
                    icon: <FiCheckSquare className="h-4 w-4" />,
                    current:
                        route().current('tasks.*') ||
                        route().current('projects.*'),
                    permissions: ['view-tasks', 'view-projects'],
                    subMenu: [
                        {
                            name: 'Projects',
                            href: route('projects.index'),
                            current: route().current('projects.*'),
                            permissions: ['view-projects'],
                        },
                        {
                            name: 'Tasks',
                            href: route('tasks.index'),
                            current: route().current('tasks.index'),
                            permissions: ['view-tasks'],
                        },
                    ],
                },
            ],
        },
        {
            title: 'INSIGHTS',
            items: [
                {
                    name: 'Reports',
                    href: route('reports.index'),
                    icon: <FiPieChart className="h-4 w-4" />,
                    current: route().current('reports.*'),
                    permissions: ['view-reports'],
                    roles: ['admin', 'hr', 'manager'],
                },
            ],
        },
        {
            title: 'ADMINISTRATION',
            items: [
                {
                    name: 'Organization',
                    href: route('companies.index'),
                    icon: <FiBriefcase className="h-4 w-4" />,
                    current:
                        route().current('companies.*') ||
                        route().current('departments.*'),
                    permissions: ['view-branches', 'view-departments'],
                    roles: ['admin', 'hr'],
                    subMenu: [
                        {
                            name: 'Branches',
                            href: route('companies.index'),
                            current: route().current('companies.*'),
                            permissions: ['view-branches'],
                            roles: ['admin', 'hr'],
                        },
                        {
                            name: 'Departments',
                            href: route('departments.index'),
                            current: route().current('departments.*'),
                            permissions: ['view-departments'],
                            roles: ['admin', 'hr'],
                        },
                    ],
                },
                {
                    name: 'Documents',
                    icon: <FiFile className="h-4 w-4" />,
                    current:
                        route().current('document-types.*') ||
                        route().current('documents.expiring'),
                    permissions: ['view-documents'],
                    roles: ['admin', 'hr'],
                    subMenu: [
                        {
                            name: 'Types',
                            href: route('document-types.index'),
                            current: route().current('document-types.*'),
                            permissions: ['manage-document-types'],
                            roles: ['admin', 'hr'],
                        },
                        {
                            name: 'Expiring',
                            href: route('documents.expiring'),
                            current: route().current('documents.expiring'),
                            permissions: ['view-expiring-documents'],
                            roles: ['admin', 'hr'],
                        },
                    ],
                },
                {
                    name: 'Security',
                    href: '#',
                    icon: <FiShield className="h-4 w-4" />,
                    current:
                        route().current('roles.*') ||
                        route().current('permissions.*'),
                    permissions: ['manage-roles', 'manage-permissions'],
                    roles: ['admin'],
                    subMenu: [
                        {
                            name: 'Roles',
                            href: route('roles.index'),
                            current: route().current('roles.*'),
                            permissions: ['manage-roles'],
                            roles: ['admin'],
                        },
                        {
                            name: 'Permissions',
                            href: route('permissions.index'),
                            current: route().current('permissions.*'),
                            permissions: ['manage-permissions'],
                            roles: ['admin'],
                        },
                    ],
                },
                {
                    name: 'Audit Logs',
                    href: route('audit-logs.index'),
                    icon: <FiDatabase className="h-4 w-4" />,
                    current: route().current('audit-logs.*'),
                    permissions: ['view-audit-logs'],
                    roles: ['admin'],
                },
                {
                    name: 'Settings',
                    href: route('settings.index'),
                    icon: <FiSettings className="h-4 w-4" />,
                    current: route().current('settings.*'),
                    permissions: ['manage-settings'],
                    roles: ['admin'],
                },
            ],
        },
    ];

    const [searchQuery, setSearchQuery] = useState('');

    const filteredGroups = navigationGroups
        .map((group) => {
            const visibleItems = group.items.filter((item) => {
                const hasAccess = canAccess(item.roles, item.permissions);
                const hasVisibleSub = item.subMenu?.some((sub) =>
                    canAccess(sub.roles, sub.permissions),
                );

                // If the item has a submenu, and none of them are visible, and the parent is a dropdown wrapper (no href or href is '#')
                if (item.subMenu && item.subMenu.length > 0 && !hasVisibleSub) {
                    if (!item.href || item.href === '#') {
                        return false;
                    }
                }

                if (!hasAccess && !hasVisibleSub) return false;

                if (!searchQuery) return true;

                const matchesSelf = item.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
                const matchesSub = item.subMenu?.some((sub) => {
                    const subHasAccess = canAccess(sub.roles, sub.permissions);
                    return (
                        subHasAccess &&
                        sub.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                    );
                });

                return matchesSelf || matchesSub;
            });

            // Always filter submenus inside visibleItems by user permissions
            const processedItems = visibleItems.map((item) => {
                if (!item.subMenu) return item;

                // Filter by permission first
                let filteredSub = item.subMenu.filter((sub) =>
                    canAccess(sub.roles, sub.permissions),
                );

                // If there is a search query, filter further by name
                if (searchQuery) {
                    const parentMatches = item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    if (!parentMatches) {
                        filteredSub = filteredSub.filter((sub) =>
                            sub.name
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()),
                        );
                    }
                }

                return {
                    ...item,
                    subMenu: filteredSub,
                };
            });

            return {
                ...group,
                items: processedItems,
            };
        })
        .filter((group) => group.items.length > 0);

    const navigation = navigationGroups.flatMap((group) => group.items);

    // On mount and when route changes, update activeMenu and expand parent menus
    useEffect(() => {
        // Check if any navigation item or sub-menu item is current
        const currentNav = navigation.find((item) => item.current);
        if (currentNav) {
            setActiveMenu(currentNav.name);
            // If it has sub-menu and one of them is active, expand it
            if (
                currentNav.subMenu &&
                currentNav.subMenu.some((sub) => sub.current)
            ) {
                if (!expandedMenus.includes(currentNav.name)) {
                    setExpandedMenus((prev) => {
                        const newExpanded = [...prev, currentNav.name];
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(
                                'expandedMenus',
                                JSON.stringify(newExpanded),
                            );
                        }
                        return newExpanded;
                    });
                }
            }
            if (typeof window !== 'undefined') {
                localStorage.removeItem('sidebarActiveMenu');
            }
        } else {
            // Check sub-menus
            for (const item of navigation) {
                if (item.subMenu && item.subMenu.some((sub) => sub.current)) {
                    setActiveMenu(item.name);
                    if (!expandedMenus.includes(item.name)) {
                        setExpandedMenus((prev) => {
                            const newExpanded = [...prev, item.name];
                            if (typeof window !== 'undefined') {
                                localStorage.setItem(
                                    'expandedMenus',
                                    JSON.stringify(newExpanded),
                                );
                            }
                            return newExpanded;
                        });
                    }
                    break;
                }
            }
            // Otherwise, restore from localStorage
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('sidebarActiveMenu');
                if (saved) {
                    setActiveMenu(saved);
                }
            }
        }
    }, [window.location.pathname]);

    // When a menu is clicked, save to localStorage
    const handleMenuClick = (item) => {
        setActiveMenu(item.name);
        if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarActiveMenu', item.name);
        }
    };

    // Helper to determine if a menu is active
    const isMenuActive = (item) => {
        return item.current || activeMenu === item.name;
    };

    const { flash } = usePage().props;
    const [showFlash, setShowFlash] = useState(false);

    useEffect(() => {
        if (flash.success || flash.error) {
            setShowFlash(true);
            const timer = setTimeout(() => setShowFlash(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const primaryColor = appSettings?.theme_color || '#090b4e';
    const secondaryColor = appSettings?.secondary_color || '#103c7f';
    const accentColor = appSettings?.accent_color || '#818cf8';
    const appFont = appSettings?.app_font || 'Inter';

    // Expose the theme colours as RGB channel triplets so Tailwind opacity
    // modifiers (bg-primary/10, shadow-primary/20, ...) compile and work.
    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    const accentRgb = hexToRgb(accentColor);

    return (
        <div
            className="min-h-screen bg-gray-50"
            style={{
                '--primary-color': primaryColor,
                '--primary-rgb': primaryRgb,
                '--secondary-color': secondaryColor,
                '--secondary-rgb': secondaryRgb,
                '--accent-color': accentColor,
                '--accent-rgb': accentRgb,
            }}
        >
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                :root { 
                    --primary-color: ${primaryColor}; 
                    --secondary-color: ${secondaryColor};
                    --accent-color: ${accentColor};
                    --app-font-family: '${appFont}', sans-serif;
                }
                
                body, .font-sans { 
                    font-family: var(--app-font-family) !important; 
                    font-weight: 400;
                }

                /* Proper weight for headings and titles */
                h1, h2, h3, h4, h5, h6, 
                .title, .heading, .card-title,
                [class*="text-lg"], [class*="text-xl"], [class*="text-2xl"], [class*="text-3xl"] {
                    font-weight: 600 !important;
                    letter-spacing: -0.01em;
                }

                /* Standardize Border Radius */
                .rounded-2xl, .rounded-3xl {
                    border-radius: 0.75rem !important;
                }
                
                .rounded-xl {
                    border-radius: 0.5rem !important;
                }

                /* Exceptions for inputs and small labels.
                   Uses :where() (zero specificity) so an explicit Tailwind font-weight
                   utility (e.g. font-semibold) is no longer cancelled by this reset. */
                :where(input, select, textarea, label, .text-xs, .text-sm) {
                    font-weight: 400;
                }
                /* Preserve a visible emphasis when a small label/optgroup is bolded on purpose. */
                :where(input, select, textarea, label).font-semibold { font-weight: 600; }
                :where(input, select, textarea, label).font-medium { font-weight: 500; }
                :where(input, select, textarea, label).font-bold { font-weight: 700; }

                .bg-indigo-600, .bg-purple-600, .bg-blue-600, .bg-indigo-500, .bg-purple-500, .bg-blue-500, .bg-indigo-700, .bg-purple-700, .bg-blue-700, .bg-primary, .hover\:bg-primary:hover, .bg-slate-900, .bg-gray-900, .hover\:bg-slate-800:hover, .hover\:bg-gray-800:hover { background-color: var(--primary-color) !important; color: white !important; }
                .text-indigo-600, .text-purple-600, .text-blue-600, .text-indigo-500, .text-purple-500, .text-blue-500, .text-indigo-700, .text-purple-700, .text-blue-700, .text-primary { color: var(--primary-color) !important; }
                .border-indigo-600, .border-purple-600, .border-blue-600, .border-indigo-500, .border-purple-500, .border-blue-500, .border-primary { border-color: var(--primary-color) !important; }
                .ring-primary, .focus\:ring-primary:focus, .ring-indigo-500, .focus\:ring-indigo-500:focus, .ring-blue-600, .focus\:ring-blue-600:focus, .ring-slate-900, .focus\:ring-slate-900:focus { --tw-ring-color: var(--primary-color) !important; }
                
                /* Enforce white icons on all colored/theme backgrounds */
                .bg-primary svg, .bg-indigo-600 svg, .bg-purple-600 svg, .bg-blue-600 svg, 
                .bg-emerald-600 svg, .bg-rose-600 svg, .bg-amber-600 svg, .bg-indigo-500 svg, 
                .bg-emerald-500 svg, .bg-rose-500 svg, .bg-amber-500 svg,
                .bg-slate-900 svg, .bg-gray-900 svg, .bg-indigo-700 svg, .bg-emerald-700 svg,
                .hover\:bg-primary:hover svg, .hover\:bg-indigo-600:hover svg, .hover\:bg-indigo-700:hover svg,
                .hover\:bg-emerald-600:hover svg, .hover\:bg-rose-600:hover svg,
                .group:hover .group-hover\:bg-primary svg, .group:hover .group-hover\:bg-indigo-600 svg {
                    color: white !important;
                    stroke: white !important;
                }

                .bg-primary-light { background-color: color-mix(in srgb, var(--primary-color), white 90%) !important; }

                /* Professional Sidebar Tooltip */
                .nav-tooltip {
                    position: absolute;
                    left: calc(100% + 12px);
                    padding: 6px 12px;
                    background: #1e293b;
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    border-radius: 6px;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transform: translateX(-10px);
                    transition: all 0.2s ease;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    pointer-events: none;
                }

                .group:hover .nav-tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(0);
                }

                .nav-tooltip::after {
                    content: '';
                    position: absolute;
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 5px solid transparent;
                    border-right-color: #1e293b;
                }

                /* Force high-contrast white buttons on primary/theme/dark card backgrounds */
                .bg-primary button:not(.bg-transparent):not(.bg-white\/10):not(.bg-white\/20),
                .bg-primary a.btn:not(.bg-transparent):not(.bg-white\/10):not(.bg-white\/20),
                .bg-slate-900 button:not(.bg-transparent):not(.bg-white\/10):not(.bg-white\/20),
                .bg-slate-900 a.btn:not(.bg-transparent):not(.bg-white\/10):not(.bg-white\/20),
                .bg-gray-900 button:not(.bg-transparent):not(.bg-white\/10):not(.bg-white\/20),
                .bg-gray-900 a.btn:not(.bg-transparent):not(.bg-white\/10):not(.bg-white\/20) {
                    background-color: #ffffff !important;
                    color: var(--primary-color, #090b4e) !important;
                    border-color: #ffffff !important;
                    font-weight: 700 !important;
                    box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.25) !important;
                }
                
                /* Ensure icons inside high-contrast buttons take primary color */
                .bg-primary button svg, .bg-primary a svg,
                .bg-slate-900 button svg, .bg-slate-900 a svg,
                .bg-gray-900 button svg, .bg-gray-900 a svg {
                    color: var(--primary-color, #090b4e) !important;
                    stroke: var(--primary-color, #090b4e) !important;
                }
                
                /* Icons in transparent/outline white links inside dark cards stay white */
                .bg-primary a.border-white\/10 svg, .bg-primary a.border-white\/20 svg,
                .bg-slate-900 a.border-white\/10 svg, .bg-slate-900 a.border-white\/20 svg,
                .bg-gray-900 a.border-white\/10 svg, .bg-gray-900 a.border-white\/20 svg {
                    color: #ffffff !important;
                    stroke: #ffffff !important;
                }

                .bg-primary .bg-white\/10, .bg-slate-900 .bg-white\/10, .bg-gray-900 .bg-white\/10 {
                    background-color: rgba(255, 255, 255, 0.12) !important;
                    color: #ffffff !important;
                    border-color: rgba(255, 255, 255, 0.25) !important;
                }
                .text-primary-dark { color: color-mix(in srgb, var(--primary-color), black 20%) !important; }
                
                .bg-secondary { background-color: var(--secondary-color) !important; }
                .text-secondary { color: var(--secondary-color) !important; }
                
                .bg-accent { background-color: var(--accent-color) !important; }
                .text-accent { color: var(--accent-color) !important; }

                .from-indigo-600, .from-purple-600, .from-blue-600, .from-indigo-500, .from-purple-500, .from-blue-500 { --tw-gradient-from: var(--primary-color) !important; --tw-gradient-to: var(--primary-color) !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
                .to-indigo-600, .to-purple-600, .to-blue-600, .to-indigo-700, .to-purple-700, .to-blue-700 { --tw-gradient-to: var(--primary-color) !important; }
                
                .hover\\:bg-indigo-700:hover, .hover\\:bg-purple-700:hover, .hover\\:bg-blue-700:hover { background-color: var(--primary-color) !important; filter: brightness(0.9); }
                .focus\\:ring-indigo-500:focus, .focus\\:ring-purple-500:focus, .focus\\:ring-blue-500:focus { --tw-ring-color: var(--primary-color) !important; }
                .shadow-indigo-100, .shadow-purple-100, .shadow-blue-100 { --tw-shadow-color: ${primaryColor}20 !important; }
                .shadow-indigo-200, .shadow-purple-200, .shadow-blue-200 { --tw-shadow-color: ${primaryColor}40 !important; }

                .shadow-deep {
                    box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
                }

                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `,
                }}
            />
            {/* Flash Messages */}
            {showFlash && (flash.success || flash.error) && (
                <div className="animate-in fade-in slide-in-from-top-4 fixed right-4 top-20 z-[99999] duration-300">
                    <div
                        className={`flex items-center gap-3 rounded-lg border px-6 py-4 shadow-2xl ${flash.success ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-rose-100 bg-rose-50 text-rose-800'}`}
                    >
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${flash.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}
                        >
                            {flash.success ? (
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="mb-1 text-xs font-black uppercase leading-none tracking-widest">
                                {flash.success ? 'Success' : 'Error'}
                            </span>
                            <span className="text-sm font-bold opacity-90">
                                {flash.success || flash.error}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowFlash(false)}
                            className="ml-4 hover:opacity-70"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            {/* Sidebar for mobile */}
            <div
                className={`fixed inset-0 z-[700] transition-opacity duration-300 lg:hidden ${sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                {/* Overlay */}
                <div
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                ></div>

                <div
                    className={`absolute inset-y-0 left-0 flex w-[260px] flex-col shadow-2xl transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    style={{ backgroundColor: secondaryColor }}
                >
                    <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="rounded-lg bg-white/10 p-1.5 shadow-lg">
                                <ApplicationLogo
                                    src={appSettings?.app_logo}
                                    className="h-6 w-auto"
                                />
                            </div>
                            <span className="whitespace-nowrap text-xs font-black uppercase tracking-tighter text-white">
                                {appSettings?.app_name || 'FST HRMS'}
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-slate-400"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="border-b border-white/5 px-4 pb-2 pt-4">
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/35">
                                <FiSearch size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-white/30 outline-none transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/30 transition-colors hover:text-white"
                                    type="button"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <nav className="custom-scrollbar flex flex-1 flex-col space-y-8 overflow-y-auto px-4 py-6">
                        {filteredGroups.map((group) => (
                            <div key={group.title} className="space-y-2">
                                <h5 className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">
                                    {group.title}
                                </h5>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => {
                                                handleMenuClick(item);
                                                setSidebarOpen(false);
                                            }}
                                            className={`group flex items-center rounded-lg px-3 py-2.5 transition-all duration-300 ${
                                                isMenuActive(item)
                                                    ? 'bg-white text-primary shadow-lg shadow-black/10'
                                                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <div
                                                className={`transition-transform duration-300 ${isMenuActive(item) ? 'text-primary' : 'text-white/30 group-hover:text-white'}`}
                                            >
                                                {item.icon}
                                            </div>
                                            <span className="ml-3 text-[13px] font-semibold tracking-tight">
                                                {item.name}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="border-t border-white/5 bg-black/20 p-3">
                        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-1.5 py-1.5">
                            <Avatar
                                src={user.employee_image || user.image}
                                name={user.name}
                                size="sm"
                                className="ring-1 ring-white/10"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="mb-1 truncate text-xs font-black leading-none text-white">
                                    {user.name}
                                </p>
                                <p className="truncate text-[10px] font-bold uppercase tracking-tight text-slate-500">
                                    {userRole}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Static sidebar for desktop */}
            <div
                className={`z-[600] hidden transition-all duration-500 ease-in-out lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${sidebarCollapsed ? 'lg:w-[78px]' : 'lg:w-[260px]'}`}
            >
                <div
                    className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-r border-black/10 shadow-2xl"
                    style={{ backgroundColor: secondaryColor }}
                >
                    {/* Header / Logo Section */}
                    <div className="relative z-10 flex h-16 items-center justify-between border-b border-white/5 px-3">
                        {sidebarCollapsed ? (
                            <Link
                                href="/"
                                className="mx-auto rounded-lg bg-white/10 p-1.5 shadow-lg transition-transform duration-300 hover:scale-110"
                            >
                                <ApplicationLogo
                                    src={appSettings?.app_logo}
                                    className="h-6 w-auto"
                                />
                            </Link>
                        ) : (
                            <Link
                                href="/"
                                className="flex scale-100 items-center gap-2 pl-2 opacity-100 transition-all duration-300"
                            >
                                <div className="rounded-lg bg-white/10 p-1.5 shadow-lg">
                                    <ApplicationLogo
                                        src={appSettings?.app_logo}
                                        className="h-6 w-auto"
                                    />
                                </div>
                                <span className="whitespace-nowrap text-xs font-black uppercase tracking-tighter text-white">
                                    {appSettings?.app_name || 'Workforce Pro'}
                                </span>
                            </Link>
                        )}

                        {!sidebarCollapsed && (
                            <button
                                onClick={() => setSidebarCollapsed(true)}
                                className="group rounded-lg p-2 text-white/50 transition-all duration-300 hover:bg-white/10 hover:text-white"
                                title="Collapse"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M11 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Search box for desktop */}
                    {!sidebarCollapsed && (
                        <div className="relative z-10 border-b border-white/5 px-4 pb-2 pt-4">
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-white/35">
                                    <FiSearch size={14} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-xs font-semibold text-white placeholder-white/30 outline-none transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/30 transition-colors hover:text-white"
                                        type="button"
                                    >
                                        <FiX size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Expand button for collapsed state */}
                    {sidebarCollapsed && (
                        <div className="mx-4 mb-2 flex justify-center border-b border-white/5 pb-2">
                            <button
                                onClick={() => setSidebarCollapsed(false)}
                                className="rounded-lg bg-white/5 p-2.5 text-accent shadow-sm shadow-black/20 transition-all duration-300 hover:bg-indigo-600 hover:text-white"
                                title="Expand"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Navigation Section */}
                    <nav
                        className={`custom-scrollbar relative z-10 flex flex-1 flex-col overflow-y-auto py-6 ${sidebarCollapsed ? 'items-center space-y-4 px-2' : 'space-y-8 px-4'}`}
                    >
                        {filteredGroups.map((group) => (
                            <div key={group.title} className="w-full space-y-2">
                                {!sidebarCollapsed && (
                                    <h5 className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/20">
                                        {group.title}
                                    </h5>
                                )}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const hasSubMenu =
                                            item.subMenu &&
                                            item.subMenu.length > 0;
                                        const isExpanded =
                                            expandedMenus.includes(item.name) ||
                                            (searchQuery !== '' &&
                                                item.subMenu?.some((subItem) =>
                                                    subItem.name
                                                        .toLowerCase()
                                                        .includes(
                                                            searchQuery.toLowerCase(),
                                                        ),
                                                ));
                                        const isActive = isMenuActive(item);

                                        return (
                                            <div
                                                key={item.name}
                                                className="w-full"
                                            >
                                                {hasSubMenu &&
                                                !sidebarCollapsed ? (
                                                    <div className="mb-0.5">
                                                        <button
                                                            onClick={() =>
                                                                toggleSubMenu(
                                                                    item.name,
                                                                )
                                                            }
                                                            className={`group flex w-full items-center justify-between rounded-xl p-3 transition-all duration-300 ${
                                                                isActive
                                                                    ? 'bg-white text-primary shadow-xl shadow-black/20'
                                                                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                        >
                                                            <div className="flex items-center">
                                                                <div
                                                                    className={`transition-transform duration-300 ${isActive ? 'text-primary' : 'text-white/40 group-hover:text-white'}`}
                                                                >
                                                                    {item.icon}
                                                                </div>
                                                                <span className="ml-3 text-sm font-bold tracking-tight">
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                            <svg
                                                                className={`h-3.5 w-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''} ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white'}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        3
                                                                    }
                                                                    d="M9 5l7 7-7 7"
                                                                />
                                                            </svg>
                                                        </button>

                                                        <div
                                                            className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'mt-1.5 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                                        >
                                                            <div className="ml-5 space-y-0.5 border-l border-white/10 py-1 pl-4">
                                                                {item.subMenu.map(
                                                                    (
                                                                        subItem,
                                                                    ) => (
                                                                        <Link
                                                                            key={
                                                                                subItem.name
                                                                            }
                                                                            href={
                                                                                subItem.href
                                                                            }
                                                                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 ${
                                                                                subItem.current
                                                                                    ? 'bg-white text-primary shadow-sm'
                                                                                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                                                                            }`}
                                                                        >
                                                                            <div
                                                                                className={`h-1 w-1 rounded-full ${subItem.current ? 'bg-primary' : 'bg-white/10'}`}
                                                                            ></div>
                                                                            {
                                                                                subItem.name
                                                                            }
                                                                        </Link>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={item.href}
                                                        onClick={() =>
                                                            handleMenuClick(
                                                                item,
                                                            )
                                                        }
                                                        className={`group relative flex items-center ${sidebarCollapsed ? 'mx-auto mb-2 h-10 w-10 justify-center' : 'justify-start px-3 py-2.5'} w-full rounded-lg transition-all duration-300 ${
                                                            isActive
                                                                ? 'bg-white text-primary shadow-lg shadow-black/10'
                                                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`transition-transform duration-300 ${isActive ? 'text-primary' : 'text-white/30 group-hover:text-white'}`}
                                                        >
                                                            {item.icon}
                                                        </div>
                                                        {!sidebarCollapsed && (
                                                            <span className="ml-3 text-[13px] font-semibold tracking-tight">
                                                                {item.name}
                                                            </span>
                                                        )}
                                                        {isActive &&
                                                            !sidebarCollapsed && (
                                                                <div className="ml-auto h-1 w-1 rounded-full bg-primary shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                                                            )}

                                                        {/* Collapsed Tooltip */}
                                                        {sidebarCollapsed && (
                                                            <div className="nav-tooltip">
                                                                {item.name}
                                                            </div>
                                                        )}
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Bottom Section: Profile */}
                    <div className="relative z-10 mt-auto border-t border-white/5 bg-black/20 p-3">
                        <div
                            className={`flex items-center gap-3 transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'rounded-xl border border-white/5 bg-white/5 px-3 py-3 shadow-inner transition-colors hover:bg-white/10'}`}
                        >
                            <div className="relative flex-shrink-0">
                                <Avatar
                                    src={user.employee_image || user.image}
                                    name={user.name}
                                    size={sidebarCollapsed ? 'xs' : 'sm'}
                                    className="relative shadow-lg ring-2 ring-white/10"
                                />
                                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-emerald-500 shadow-sm"></div>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="mb-1.5 truncate text-xs font-black leading-none text-white">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-white/40">
                                        {userRole}
                                    </p>
                                </div>
                            )}
                            {!sidebarCollapsed && (
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="rounded-lg p-2 text-white/30 transition-all hover:bg-rose-400/10 hover:text-rose-400"
                                    title="Sign Out"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div
                className={`${sidebarCollapsed ? 'lg:pl-[78px]' : 'lg:pl-[260px]'} transition-all duration-500`}
            >
                {' '}
                {/* Adjust padding for collapsed sidebar */}
                {/* Top bar */}
                <div className="sticky top-0 z-[500] flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-200/50 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 rounded-full p-2.5 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 items-center">
                            {header &&
                                (typeof header === 'string' ? (
                                    <h2 className="text-xl font-black tracking-tight text-slate-800">
                                        {header}
                                    </h2>
                                ) : (
                                    header
                                ))}
                        </div>

                        {/* Live Clock */}
                        <div className="hidden items-center border-x border-gray-100 px-4 md:flex">
                            <div className="flex flex-col items-center">
                                <div className="text-sm font-black tabular-nums tracking-widest text-slate-800">
                                    {currentTime.toLocaleTimeString('en-US', {
                                        hour12: true,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                    {currentTime.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Quick Add Menu */}
                            {userHasAnyPermission([
                                'manage-tasks',
                                'create-employees',
                                'manage-projects',
                                'manage-branches',
                            ]) && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="group rounded-lg bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95">
                                            <svg
                                                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content
                                        width="80"
                                        contentClasses="py-2 bg-white rounded-lg shadow-2xl border border-slate-100"
                                    >
                                        <div className="mb-1 rounded-t-2xl border-b border-slate-50 bg-slate-50/50 px-5 py-3">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                Quick Actions
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 p-2">
                                            {userHasPermission(
                                                'manage-tasks',
                                            ) && (
                                                <Dropdown.Link
                                                    href={route('tasks.create')}
                                                    className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent p-3 text-center transition-all hover:border-slate-100 hover:bg-slate-50"
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shadow-sm transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        Create Task
                                                    </span>
                                                </Dropdown.Link>
                                            )}

                                            {userHasPermission(
                                                'create-employees',
                                            ) && (
                                                <Dropdown.Link
                                                    href={route(
                                                        'employees.create',
                                                    )}
                                                    className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent p-3 text-center transition-all hover:border-slate-100 hover:bg-slate-50"
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        Add Employee
                                                    </span>
                                                </Dropdown.Link>
                                            )}

                                            {userHasPermission(
                                                'manage-projects',
                                            ) && (
                                                <Dropdown.Link
                                                    href={route(
                                                        'projects.create',
                                                    )}
                                                    className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent p-3 text-center transition-all hover:border-slate-100 hover:bg-slate-50"
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 shadow-sm transition-colors group-hover:bg-purple-600 group-hover:text-white">
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        New Project
                                                    </span>
                                                </Dropdown.Link>
                                            )}

                                            {userHasPermission(
                                                'manage-branches',
                                            ) && (
                                                <Dropdown.Link
                                                    href={route(
                                                        'companies.create',
                                                    )}
                                                    className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-transparent p-3 text-center transition-all hover:border-slate-100 hover:bg-slate-50"
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shadow-sm transition-colors group-hover:bg-amber-600 group-hover:text-white">
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">
                                                        Add Branch
                                                    </span>
                                                </Dropdown.Link>
                                            )}
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}

                            {/* Attendance Quick Actions */}
                            {user.employee_id && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    {!user.todayAttendance?.from_time ? (
                                        <button
                                            onClick={() => {
                                                setIsProcessing(true);
                                                router.post(
                                                    route(
                                                        'employee-attendances.clockIn',
                                                    ),
                                                    {},
                                                    {
                                                        onFinish: () =>
                                                            setIsProcessing(
                                                                false,
                                                            ),
                                                    },
                                                );
                                            }}
                                            disabled={isProcessing}
                                            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-widest"
                                            title="Clock In"
                                        >
                                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></div>
                                            <span>Clock In</span>
                                        </button>
                                    ) : !user.todayAttendance?.to_time ? (
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            {user.todayAttendance
                                                ?.current_break_start ? (
                                                <button
                                                    onClick={() => {
                                                        setIsProcessing(true);
                                                        router.post(
                                                            route(
                                                                'employee-attendances.endBreak',
                                                            ),
                                                            {},
                                                            {
                                                                onFinish: () =>
                                                                    setIsProcessing(
                                                                        false,
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-amber-500 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg shadow-amber-100 transition-all hover:bg-amber-600 active:scale-95 disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-widest"
                                                    title="End Break"
                                                >
                                                    <svg
                                                        className="h-3 w-3 animate-spin"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2.5}
                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    <span className="xs:inline hidden sm:inline">
                                                        Resume
                                                    </span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setIsProcessing(true);
                                                        router.post(
                                                            route(
                                                                'employee-attendances.startBreak',
                                                            ),
                                                            {},
                                                            {
                                                                onFinish: () =>
                                                                    setIsProcessing(
                                                                        false,
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                    disabled={isProcessing}
                                                    className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-500 px-2 py-1.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-widest"
                                                    title="Start Break"
                                                >
                                                    <svg
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2.5}
                                                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    <span className="xs:inline hidden sm:inline">
                                                        Break
                                                    </span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setIsProcessing(true);
                                                    router.post(
                                                        route(
                                                            'employee-attendances.clockOut',
                                                        ),
                                                        {},
                                                        {
                                                            onFinish: () =>
                                                                setIsProcessing(
                                                                    false,
                                                                ),
                                                        },
                                                    );
                                                }}
                                                disabled={
                                                    isProcessing ||
                                                    user.todayAttendance
                                                        ?.current_break_start
                                                }
                                                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-rose-500 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg shadow-rose-100 transition-all hover:bg-rose-600 active:scale-95 disabled:opacity-50 sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-widest"
                                                title="Clock Out"
                                            >
                                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                                <span>Clock Out</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-widest">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                                            <span>Done</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notifications */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="group relative rounded-lg p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
                                    >
                                        <span className="sr-only">
                                            View notifications
                                        </span>
                                        <BellIcon className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 animate-bounce items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[8px] font-black text-white transition-transform group-hover:scale-110">
                                                {unreadCount > 9
                                                    ? '9+'
                                                    : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content
                                    width="80"
                                    contentClasses="py-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-4">
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">
                                                Notification Hub
                                            </h3>
                                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-tight text-slate-400">
                                                System Signals & Directives
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={toggleSoundMute}
                                                className={`p-1 rounded-md text-xs transition-colors ${
                                                    soundMuted
                                                        ? 'text-slate-400 hover:text-slate-600 bg-slate-100'
                                                        : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50'
                                                }`}
                                                title={soundMuted ? 'Notification sound muted (click to unmute)' : 'Notification sound active (click to mute)'}
                                            >
                                                {soundMuted ? <FiVolumeX className="h-3.5 w-3.5" /> : <FiVolume2 className="h-3.5 w-3.5" />}
                                            </button>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="rounded-md bg-indigo-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 transition-colors hover:text-indigo-800"
                                                >
                                                    Purge All
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
                                        {notificationsList?.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {notificationsList.map(
                                                    (notification) => (
                                                        <div
                                                            key={
                                                                notification.id
                                                            }
                                                            className="group relative p-4 transition-colors hover:bg-slate-50"
                                                        >
                                                            <div className="flex gap-3">
                                                                <div
                                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ${getNotificationStyles(notification.data?.type).classes}`}
                                                                >
                                                                    {
                                                                        getNotificationStyles(
                                                                            notification
                                                                                .data
                                                                                ?.type,
                                                                        ).icon
                                                                    }
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="mb-1 flex items-center justify-between gap-2">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                            {notification.data?.type?.replace(
                                                                                /_/g,
                                                                                ' ',
                                                                            ) ||
                                                                                'Alert'}
                                                                        </span>
                                                                        <span className="text-[8px] font-black uppercase tracking-tight text-slate-300">
                                                                            {
                                                                                notification.created_at
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {notification.data?.title && (
                                                                        <h4 className="text-[11px] font-black text-slate-800 leading-tight mb-0.5">
                                                                            {notification.data.title}
                                                                        </h4>
                                                                    )}
                                                                    <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-600">
                                                                        {
                                                                            notification
                                                                                .data
                                                                                ?.message
                                                                        }
                                                                    </p>
                                                                    <div className="mt-3 flex items-center gap-2">
                                                                        {notification
                                                                            .data
                                                                            ?.action_url ? (
                                                                            <Link
                                                                                href={
                                                                                    notification
                                                                                        .data
                                                                                        .action_url
                                                                                }
                                                                                onClick={() =>
                                                                                    handleMarkAsRead(
                                                                                        notification.id,
                                                                                    )
                                                                                }
                                                                                className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-black"
                                                                            >
                                                                                Execute
                                                                                <FiExternalLink className="h-2.5 w-2.5" />
                                                                            </Link>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() =>
                                                                                    handleMarkAsRead(
                                                                                        notification.id,
                                                                                    )
                                                                                }
                                                                                className="flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-black"
                                                                            >
                                                                                Mark Resolve
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-5 py-12 text-center">
                                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-200">
                                                    <BellIcon className="h-6 w-6" />
                                                </div>
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                                                    Clear Frequency
                                                </h4>
                                                <p className="mt-1 text-[9px] font-bold uppercase tracking-tight text-slate-400">
                                                    No pending signals detected
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-100 bg-slate-50 p-2.5 text-center">
                                        <Link
                                            href={route('notifications.index')}
                                            className="inline-flex items-center justify-center gap-1.5 w-full py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                                        >
                                            <span>Open Notification Center</span>
                                            <FiExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>
                                </Dropdown.Content>
                            </Dropdown>

                            {/* User menu */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="group flex items-center gap-3 rounded-lg p-1 pr-3 transition-all hover:bg-slate-50"
                                    >
                                        <Avatar
                                            src={user.image}
                                            name={user.name}
                                            size="sm"
                                            className="transition-transform group-hover:scale-105"
                                        />
                                        <div className="hidden flex-col items-start text-left lg:flex">
                                            <span className="mb-1 text-xs font-black leading-none tracking-tight text-slate-800">
                                                {user.name}
                                            </span>
                                            <span className="text-[9px] font-bold uppercase leading-none tracking-wider text-slate-400">
                                                {user.email}
                                            </span>
                                        </div>
                                        <svg
                                            className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content
                                    width="48"
                                    contentClasses="py-2 bg-white rounded-lg shadow-2xl border border-slate-100"
                                >
                                    <Dropdown.Link
                                        href={route('profile.edit')}
                                        className="group flex items-center gap-3 py-2.5 hover:bg-indigo-50"
                                    >
                                        <svg
                                            className="h-4 w-4 text-slate-400 group-hover:text-indigo-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <span className="font-bold text-slate-700">
                                            My Profile
                                        </span>
                                    </Dropdown.Link>
                                    <div className="mx-4 my-1 h-px bg-slate-50"></div>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="group flex w-full items-center gap-3 py-2.5 text-left hover:bg-rose-50"
                                    >
                                        <svg
                                            className="h-4 w-4 text-slate-400 group-hover:text-rose-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                        <span className="font-bold text-slate-700 group-hover:text-rose-700">
                                            Sign Out
                                        </span>
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
                {/* Main content area */}
                <main className="w-full py-6">
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Real-time floating Notification Toast Banner */}
            {activeToast && (
                <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 drop-shadow-2xl">
                    <div className="rounded-2xl border border-indigo-100 bg-white/95 backdrop-blur-md p-4 shadow-2xl ring-1 ring-black/5">
                        <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${getNotificationStyles(activeToast.data?.type).classes}`}>
                                {getNotificationStyles(activeToast.data?.type).icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">
                                        {activeToast.data?.type?.replace(/_/g, ' ') || 'System Signal'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveToast(null)}
                                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                    >
                                        <span className="sr-only">Close</span>
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </div>
                                {activeToast.data?.title && (
                                    <h4 className="text-xs font-black text-slate-800 leading-snug mt-0.5">
                                        {activeToast.data.title}
                                    </h4>
                                )}
                                <p className="mt-1 line-clamp-2 text-xs text-slate-600 leading-relaxed font-medium">
                                    {activeToast.data?.message}
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    {activeToast.data?.action_url && (
                                        <Link
                                            href={activeToast.data.action_url}
                                            onClick={() => {
                                                handleMarkAsRead(activeToast.id);
                                                setActiveToast(null);
                                            }}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:bg-indigo-700 transition-colors"
                                        >
                                            <span>View Details</span>
                                            <FiExternalLink className="h-3 w-3" />
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleMarkAsRead(activeToast.id);
                                            setActiveToast(null);
                                        }}
                                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
