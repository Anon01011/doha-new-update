import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { hasRole, hasPermission, hasAnyPermission } from '@/helpers/permissions';
import Avatar from '@/Components/Avatar';
import {
    FiGrid, FiUsers, FiBriefcase, FiFolder, FiClock, FiCalendar, FiDollarSign, FiCreditCard,
    FiAward, FiCheckSquare, FiAlertCircle, FiFileText, FiPieChart, FiShield, FiFile, FiSettings,
    FiBell, FiCheck, FiTrash2, FiExternalLink, FiX, FiLogOut, FiBookOpen, FiDatabase, FiSearch
} from 'react-icons/fi';
import {
    BellIcon,
    CheckIcon,
    TrashIcon,
    EnvelopeOpenIcon,
    InformationCircleIcon,
    ExclamationCircleIcon,
    BanknotesIcon,
    BriefcaseIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, appSettings } = usePage().props;
    const user = auth?.user || {};
    const userRole = user.role || 'employee';

    const getNotificationStyles = (type) => {
        switch (type) {
            case 'task_assigned':
                return { icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />, classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
            case 'project_assigned':
                return { icon: <BriefcaseIcon className="w-5 h-5" />, classes: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
            case 'salary_generated':
                return { icon: <BanknotesIcon className="w-5 h-5" />, classes: 'bg-amber-50 text-amber-600 border-amber-100' };
            case 'leave_requested':
            case 'leave_status_updated':
                return { icon: <FiCalendar className="w-5 h-5" />, classes: 'bg-purple-50 text-purple-600 border-purple-100' };
            case 'grievance_submitted':
            case 'grievance_status_updated':
                return { icon: <FiAlertCircle className="w-5 h-5" />, classes: 'bg-orange-50 text-orange-600 border-orange-100' };
            case 'warning_letter_issued':
                return { icon: <FiFileText className="w-5 h-5" />, classes: 'bg-rose-50 text-rose-600 border-rose-100' };
            case 'loan_requested':
            case 'loan_status_updated':
            case 'advance_requested':
            case 'advance_status_updated':
                return { icon: <FiDollarSign className="w-5 h-5" />, classes: 'bg-sky-50 text-sky-600 border-sky-100' };
            default:
                return { icon: <InformationCircleIcon className="w-5 h-5" />, classes: 'bg-slate-50 text-slate-600 border-slate-100' };
        }
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
        setExpandedMenus(prev => {
            const newExpanded = prev.includes(menuName)
                ? prev.filter(m => m !== menuName)
                : [...prev, menuName];
            if (typeof window !== 'undefined') {
                localStorage.setItem('expandedMenus', JSON.stringify(newExpanded));
            }
            return newExpanded;
        });
    };

    // Helper function to check if user can access a route
    const canAccess = (roles, permissions) => {
        // If it's a super admin, they can access everything
        if (user.role === 'admin' && !user.employee_id) return true;

        // If permissions are specified, they take precedence
        if (permissions && permissions.length > 0) {
            return userHasAnyPermission(permissions);
        }

        // Fallback to role-based access if no permissions specified
        if (!roles || roles.length === 0) return true;

        // Check if user's role field matches any required role
        if (userRole && roles.includes(userRole)) return true;

        // Also check roles relationship (for new permission system)
        if (user && user.roles && Array.isArray(user.roles)) {
            const userRoleSlugs = user.roles.map(r => r.slug || r);
            if (roles.some(role => userRoleSlugs.includes(role))) return true;
        }

        return false;
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
                    href: userRole === 'employee' ? route('employee.dashboard') : route('dashboard'),
                    icon: <FiGrid className="h-4 w-4" />,
                    current: route().current('dashboard') || route().current('employee.dashboard')
                },
                {
                    name: 'Reports',
                    href: route('reports.index'),
                    icon: <FiPieChart className="h-4 w-4" />,
                    current: route().current('reports.*'),
                    permissions: ['view-reports']
                }
            ]
        },
        {
            title: 'HUMAN RESOURCES',
            items: [
                {
                    name: 'Employees',
                    href: route('employees.index'),
                    icon: <FiUsers className="h-4 w-4" />,
                    current: route().current('employees.*') || route().current('settings.dropdown-options.*'),
                    permissions: ['view-employees'],
                    subMenu: [
                        { name: 'Directory', href: route('employees.index'), current: route().current('employees.*'), permissions: ['view-employees'] },
                        { name: 'Configurations', href: route('settings.dropdown-options.index'), current: route().current('settings.dropdown-options.*'), permissions: ['manage-dropdowns'] }
                    ]
                },
                {
                    name: 'Evaluations',
                    href: route('evaluations.index'),
                    icon: <FiAward className="h-4 w-4" />,
                    current: route().current('evaluations.*'),
                    roles: ['admin', 'hr', 'manager', 'employee']
                },
                {
                    name: 'Attendance',
                    href: route('employee-attendances.index'),
                    icon: <FiClock className="h-4 w-4" />,
                    current: route().current('employee-attendances.*'),
                    permissions: ['view-attendance']
                },
                {
                    name: 'Shift Roster',
                    href: route('shift-rosters.index'),
                    icon: <FiCalendar className="h-4 w-4" />,
                    current: route().current('shift-rosters.*'),
                    permissions: ['view-shift-roster']
                },
                {
                    name: 'Leave & Holidays',
                    href: route('leave-requests.index'),
                    icon: <FiCalendar className="h-4 w-4" />,
                    current: route().current('leave-requests.*') || route().current('leave-types.*') || route().current('holidays.*'),
                    permissions: ['view-leave-requests'],
                    subMenu: [
                        { name: 'Requests', href: route('leave-requests.index'), current: route().current('leave-requests.*'), permissions: ['view-leave-requests'] },
                        { name: 'Types', href: route('leave-types.index'), current: route().current('leave-types.*'), permissions: ['manage-leave-types'] },
                        { name: 'Holidays', href: route('holidays.index'), current: route().current('holidays.*'), permissions: ['view-holidays'] }
                    ]
                },
                {
                    name: 'Training',
                    href: route('trainings.index'),
                    icon: <FiBookOpen className="h-4 w-4" />,
                    current: route().current('trainings.*') || route().current('training-assignments.*') || route().current('training-categories.*'),
                    permissions: ['view-trainings'],
                    subMenu: [
                        { name: 'Courses', href: route('trainings.index'), current: route().current('trainings.*'), permissions: ['view-trainings'] },
                        { name: 'Assignments', href: route('training-assignments.index'), current: route().current('training-assignments.*'), permissions: ['view-training-assignments'] },
                        { name: 'Categories', href: route('training-categories.index'), current: route().current('training-categories.*'), roles: ['admin', 'hr', 'manager'] }
                    ]
                },
                {
                    name: 'Grievances',
                    href: route('grievances.index'),
                    icon: <FiAlertCircle className="h-4 w-4" />,
                    current: route().current('grievances.*'),
                    roles: ['admin', 'hr', 'manager', 'employee']
                },
                {
                    name: 'Warning Letters',
                    href: route('warning-letters.index'),
                    icon: <FiFileText className="h-4 w-4" />,
                    current: route().current('warning-letters.*'),
                    roles: ['admin', 'hr', 'manager', 'employee']
                }
            ]
        },
        {
            title: 'OPERATIONS',
            items: [
                {
                    name: 'Payroll',
                    href: route('salary-postings.index'),
                    icon: <FiDollarSign className="h-4 w-4" />,
                    current: route().current('salary-postings.*') || route().current('salary-components.*'),
                    permissions: ['view-salary-postings'],
                    subMenu: [
                        { name: 'Salary Postings', href: route('salary-postings.index'), current: route().current('salary-postings.*'), permissions: ['view-salary-postings'] },
                        { name: 'Components', href: route('salary-components.index'), current: route().current('salary-components.*'), permissions: ['manage-salary-components'] }
                    ]
                },
                {
                    name: 'Financials',
                    href: route('loans.index'),
                    icon: <FiCreditCard className="h-4 w-4" />,
                    current: route().current('loans.*') || route().current('advances.*'),
                    permissions: ['view-loans', 'view-advances'],
                    subMenu: [
                        { name: 'Loans', href: route('loans.index'), current: route().current('loans.*'), permissions: ['view-loans'] },
                        { name: 'Advances', href: route('advances.index'), current: route().current('advances.*'), permissions: ['view-advances'] }
                    ]
                },
                {
                    name: 'Tasks & Projects',
                    href: route('tasks.index'),
                    icon: <FiCheckSquare className="h-4 w-4" />,
                    current: route().current('tasks.*') || route().current('projects.*'),
                    permissions: ['view-tasks', 'view-projects'],
                    subMenu: [
                        { name: 'Projects', href: route('projects.index'), current: route().current('projects.*'), permissions: ['view-projects'] },
                        { name: 'Tasks', href: route('tasks.index'), current: route().current('tasks.index'), permissions: ['view-tasks'] }
                    ]
                }
            ]
        },
        {
            title: 'ADMINISTRATION',
            items: [
                {
                    name: 'Organization',
                    href: route('companies.index'),
                    icon: <FiBriefcase className="h-4 w-4" />,
                    current: route().current('companies.*') || route().current('departments.*'),
                    permissions: ['view-branches'],
                    subMenu: [
                        { name: 'Branches', href: route('companies.index'), current: route().current('companies.*'), permissions: ['view-branches'] },
                        { name: 'Departments', href: route('departments.index'), current: route().current('departments.*'), permissions: ['view-departments'] }
                    ]
                },
                {
                    name: 'Security',
                    href: '#',
                    icon: <FiShield className="h-4 w-4" />,
                    current: route().current('roles.*') || route().current('permissions.*'),
                    permissions: ['manage-roles-permissions'],
                    subMenu: [
                        { name: 'Roles', href: route('roles.index'), current: route().current('roles.*'), permissions: ['manage-roles-permissions'] },
                        { name: 'Permissions', href: route('permissions.index'), current: route().current('permissions.*'), permissions: ['manage-roles-permissions'] }
                    ]
                },
                {
                    name: 'Documents',
                    icon: <FiFile className="h-4 w-4" />,
                    current: route().current('document-types.*') || route().current('documents.expiring'),
                    permissions: ['view-documents'],
                    subMenu: [
                        { name: 'Types', href: route('document-types.index'), current: route().current('document-types.*'), permissions: ['manage-document-types'] },
                        { name: 'Expiring', href: route('documents.expiring'), current: route().current('documents.expiring'), permissions: ['view-expiring-documents'] }
                    ]
                },
                {
                    name: 'Audit Logs',
                    href: route('audit-logs.index'),
                    icon: <FiDatabase className="h-4 w-4" />,
                    current: route().current('audit-logs.*'),
                    roles: ['admin'],
                    permissions: ['view-audit-logs']
                },
                {
                    name: 'Settings',
                    href: route('settings.index'),
                    icon: <FiSettings className="h-4 w-4" />,
                    current: route().current('settings.*'),
                    permissions: ['manage-settings']
                }
            ]
        }
    ];

    const [searchQuery, setSearchQuery] = useState('');

    const filteredGroups = navigationGroups.map(group => {
        const visibleItems = group.items.filter(item => {
            const hasAccess = canAccess(item.roles, item.permissions);
            const hasVisibleSub = item.subMenu?.some(sub => canAccess(sub.roles, sub.permissions));
            if (!hasAccess && !hasVisibleSub) return false;

            if (!searchQuery) return true;

            const matchesSelf = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSub = item.subMenu?.some(sub => {
                const subHasAccess = canAccess(sub.roles, sub.permissions);
                return subHasAccess && sub.name.toLowerCase().includes(searchQuery.toLowerCase());
            });

            return matchesSelf || matchesSub;
        });

        // Filter submenus inside visibleItems if there is a search query
        const processedItems = visibleItems.map(item => {
            if (!searchQuery || !item.subMenu) return item;
            
            const filteredSub = item.subMenu.filter(sub => {
                const subHasAccess = canAccess(sub.roles, sub.permissions);
                return subHasAccess && sub.name.toLowerCase().includes(searchQuery.toLowerCase());
            });

            return {
                ...item,
                // If the parent item matches the search query itself, keep all submenus.
                // Otherwise, show only the matching submenus.
                subMenu: item.name.toLowerCase().includes(searchQuery.toLowerCase()) ? item.subMenu : filteredSub
            };
        });

        return {
            ...group,
            items: processedItems
        };
    }).filter(group => group.items.length > 0);

    const navigation = navigationGroups.flatMap(group => group.items);

    // On mount and when route changes, update activeMenu and expand parent menus
    useEffect(() => {
        // Check if any navigation item or sub-menu item is current
        const currentNav = navigation.find(item => item.current);
        if (currentNav) {
            setActiveMenu(currentNav.name);
            // If it has sub-menu and one of them is active, expand it
            if (currentNav.subMenu && currentNav.subMenu.some(sub => sub.current)) {
                if (!expandedMenus.includes(currentNav.name)) {
                    setExpandedMenus(prev => {
                        const newExpanded = [...prev, currentNav.name];
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('expandedMenus', JSON.stringify(newExpanded));
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
                if (item.subMenu && item.subMenu.some(sub => sub.current)) {
                    setActiveMenu(item.name);
                    if (!expandedMenus.includes(item.name)) {
                        setExpandedMenus(prev => {
                            const newExpanded = [...prev, item.name];
                            if (typeof window !== 'undefined') {
                                localStorage.setItem('expandedMenus', JSON.stringify(newExpanded));
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

    return (
        <div className="min-h-screen bg-gray-50" style={{
            '--primary-color': primaryColor,
            '--secondary-color': secondaryColor,
            '--accent-color': accentColor
        }}>
            <style dangerouslySetInnerHTML={{
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

                /* Exceptions for inputs and small labels */
                input, select, textarea, label, .text-xs, .text-sm {
                    font-weight: 400 !important;
                }

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

                /* Force white buttons on primary/theme backgrounds */
                .bg-primary button.bg-primary, .bg-primary a.bg-primary,
                .bg-primary button.bg-indigo-600, .bg-primary a.bg-indigo-600,
                .bg-slate-900 button.bg-primary, .bg-slate-900 a.bg-primary,
                .bg-slate-900 button.bg-slate-900, .bg-slate-900 a.bg-slate-900,
                .bg-primary .bg-white\/10:not(svg), .bg-slate-900 .bg-white\/10:not(svg) {
                    background-color: white !important;
                    color: var(--primary-color) !important;
                    border-color: white !important;
                }
                
                /* Ensure icons inside forced white buttons take the primary color */
                .bg-primary .bg-white svg, .bg-slate-900 .bg-white svg,
                .bg-primary button.bg-white svg, .bg-primary a.bg-white svg,
                .bg-slate-900 button.bg-white svg, .bg-slate-900 a.bg-white svg {
                    color: var(--primary-color) !important;
                    stroke: var(--primary-color) !important;
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
            `}} />
            {/* Flash Messages */}
            {showFlash && (flash.success || flash.error) && (
                <div className="fixed top-20 right-4 z-[99999] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border ${flash.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${flash.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {flash.success ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest leading-none mb-1">
                                {flash.success ? 'Success' : 'Error'}
                            </span>
                            <span className="text-sm font-bold opacity-90">{flash.success || flash.error}</span>
                        </div>
                        <button onClick={() => setShowFlash(false)} className="ml-4 hover:opacity-70">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
            {/* Sidebar for mobile */}
            <div className={`fixed inset-0 z-[700] lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>

                <div className={`absolute inset-y-0 left-0 flex w-[260px] flex-col shadow-2xl transition-transform duration-500 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: secondaryColor }}>
                    <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/10 rounded-lg shadow-lg">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-6 w-auto" />
                            </div>
                            <span className="text-xs font-black text-white tracking-tighter uppercase whitespace-nowrap">
                                {appSettings?.app_name || 'FST HRMS'}
                            </span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="px-4 pt-4 pb-2 border-b border-white/5">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/35">
                                <FiSearch size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/30 hover:text-white transition-colors"
                                    type="button"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <nav className="flex-1 py-6 px-4 flex flex-col overflow-y-auto space-y-8 custom-scrollbar">
                        {filteredGroups.map((group) => (
                            <div key={group.title} className="space-y-2">
                                <h5 className="px-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] mb-4">
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
                                            className={`group flex items-center rounded-lg px-3 py-2.5 transition-all duration-300 ${isMenuActive(item)
                                                ? 'bg-white text-primary shadow-lg shadow-black/10'
                                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            <div className={`transition-transform duration-300 ${isMenuActive(item) ? 'text-primary' : 'text-white/30 group-hover:text-white'}`}>
                                                {item.icon}
                                            </div>
                                            <span className="ml-3 text-[13px] font-semibold tracking-tight">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    <div className="p-3 border-t border-white/5 bg-black/20">
                        <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg bg-white/5">
                            <Avatar src={user.employee_image || user.image} name={user.name} size="sm" className="ring-1 ring-white/10" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white truncate leading-none mb-1">{user.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{userRole}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Static sidebar for desktop */}
            <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-500 ease-in-out z-[600] ${sidebarCollapsed ? 'lg:w-[78px]' : 'lg:w-[260px]'}`}>
                <div className="flex min-h-0 flex-1 flex-col shadow-2xl border-r border-black/10 overflow-hidden relative" style={{ backgroundColor: secondaryColor }}>
                    {/* Header / Logo Section */}
                    <div className="flex h-16 items-center justify-between px-3 relative z-10 border-b border-white/5">
                        {sidebarCollapsed ? (
                            <Link href="/" className="mx-auto p-1.5 bg-white/10 rounded-lg shadow-lg hover:scale-110 transition-transform duration-300">
                                <ApplicationLogo src={appSettings?.app_logo} className="h-6 w-auto" />
                            </Link>
                        ) : (
                            <Link href="/" className="flex items-center gap-2 pl-2 transition-all duration-300 opacity-100 scale-100">
                                <div className="p-1.5 bg-white/10 rounded-lg shadow-lg">
                                    <ApplicationLogo src={appSettings?.app_logo} className="h-6 w-auto" />
                                </div>
                                <span className="text-xs font-black text-white tracking-tighter uppercase whitespace-nowrap">
                                    {appSettings?.app_name || 'Workforce Pro'}
                                </span>
                            </Link>
                        )}

                        {!sidebarCollapsed && (
                            <button
                                onClick={() => setSidebarCollapsed(true)}
                                className="p-2 rounded-lg transition-all duration-300 hover:bg-white/10 group text-white/50 hover:text-white"
                                title="Collapse"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Search box for desktop */}
                    {!sidebarCollapsed && (
                        <div className="px-4 pt-4 pb-2 border-b border-white/5 relative z-10">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-white/35">
                                    <FiSearch size={14} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-white/30 hover:text-white transition-colors"
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
                        <div className="flex justify-center pb-2 border-b border-white/5 mx-4 mb-2">
                            <button
                                onClick={() => setSidebarCollapsed(false)}
                                className="p-2.5 rounded-lg bg-white/5 text-accent hover:text-white hover:bg-indigo-600 transition-all duration-300 shadow-sm shadow-black/20"
                                title="Expand"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Navigation Section */}
                    <nav className={`flex-1 py-6 flex flex-col overflow-y-auto custom-scrollbar relative z-10 ${sidebarCollapsed ? 'items-center px-2 space-y-4' : 'px-4 space-y-8'}`}>
                        {filteredGroups.map((group) => (
                                <div key={group.title} className="w-full space-y-2">
                                    {!sidebarCollapsed && (
                                        <h5 className="px-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.25em] mb-4">
                                            {group.title}
                                        </h5>
                                    )}
                                    <div className="space-y-1">
                                        {group.items.map((item) => {
                                            const hasSubMenu = item.subMenu && item.subMenu.length > 0;
                                            const isExpanded = expandedMenus.includes(item.name) || (searchQuery !== '' && item.subMenu?.some(subItem => subItem.name.toLowerCase().includes(searchQuery.toLowerCase())));
                                            const isActive = isMenuActive(item);

                                            return (
                                                <div key={item.name} className="w-full">
                                                    {hasSubMenu && !sidebarCollapsed ? (
                                                        <div className="mb-0.5">
                                                            <button
                                                                 onClick={() => toggleSubMenu(item.name)}
                                                                 className={`group flex items-center justify-between rounded-xl p-3 w-full transition-all duration-300 ${isActive
                                                                     ? 'bg-white text-primary shadow-xl shadow-black/20'
                                                                     : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                                     }`}
                                                             >
                                                                 <div className="flex items-center">
                                                                     <div className={`transition-transform duration-300 ${isActive ? 'text-primary' : 'text-white/40 group-hover:text-white'}`}>
                                                                         {item.icon}
                                                                     </div>
                                                                     <span className="ml-3 text-sm font-bold tracking-tight">{item.name}</span>
                                                                 </div>
                                                                 <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''} ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                                 </svg>
                                                             </button>
 
                                                             <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] mt-1.5 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                                 <div className="ml-5 space-y-0.5 border-l border-white/10 pl-4 py-1">
                                                                     {item.subMenu.map((subItem) => (
                                                                         <Link
                                                                             key={subItem.name}
                                                                             href={subItem.href}
                                                                             className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 ${subItem.current
                                                                                 ? 'text-primary bg-white shadow-sm'
                                                                                 : 'text-white/40 hover:text-white hover:bg-white/5'
                                                                                 }`}
                                                                         >
                                                                            <div className={`w-1 h-1 rounded-full ${subItem.current ? 'bg-primary' : 'bg-white/10'}`}></div>
                                                                            {subItem.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Link
                                                            href={item.href}
                                                            onClick={() => handleMenuClick(item)}
                                                            className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto mb-2' : 'justify-start px-3 py-2.5'} rounded-lg w-full transition-all duration-300 ${isActive
                                                                ? 'bg-white text-primary shadow-lg shadow-black/10'
                                                                : 'text-white/50 hover:bg-white/5 hover:text-white'
                                                                }`}
                                                        >
                                                            <div className={`transition-transform duration-300 ${isActive ? 'text-primary' : 'text-white/30 group-hover:text-white'}`}>
                                                                {item.icon}
                                                            </div>
                                                            {!sidebarCollapsed && (
                                                                <span className="ml-3 text-[13px] font-semibold tracking-tight">{item.name}</span>
                                                            )}
                                                            {isActive && !sidebarCollapsed && (
                                                                <div className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
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
                    <div className="p-3 mt-auto border-t border-white/5 bg-black/20 relative z-10">
                        <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'px-3 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors shadow-inner'}`}>
                            <div className="relative flex-shrink-0">
                                <Avatar src={user.employee_image || user.image} name={user.name} size={sidebarCollapsed ? 'xs' : 'sm'} className="relative ring-2 ring-white/10 shadow-lg" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-primary rounded-full shadow-sm"></div>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-white truncate leading-none mb-1.5">{user.name}</p>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest truncate">{userRole}</p>
                                </div>
                            )}
                            {!sidebarCollapsed && (
                                <Link href={route('logout')} method="post" as="button" className="p-2 text-white/30 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all" title="Sign Out">
                                    <FiLogOut className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={`${sidebarCollapsed ? 'lg:pl-[78px]' : 'lg:pl-[260px]'} transition-all duration-500`}> {/* Adjust padding for collapsed sidebar */}
                {/* Top bar */}
                <div className="sticky top-0 z-[500] flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-full transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 items-center">
                            {header && (
                                typeof header === 'string' ? (
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{header}</h2>
                                ) : (
                                    header
                                )
                            )}
                        </div>

                        {/* Live Clock */}
                        <div className="hidden md:flex items-center px-4 border-x border-gray-100">
                            <div className="flex flex-col items-center">
                                <div className="text-sm font-black text-slate-800 tracking-widest tabular-nums">
                                    {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Quick Add Menu */}
                            {userHasAnyPermission(['manage-tasks', 'create-employees', 'manage-projects', 'manage-branches']) && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 group">
                                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content width="80" contentClasses="py-2 bg-white rounded-lg shadow-2xl border border-slate-100">
                                        <div className="px-5 py-3 border-b border-slate-50 mb-1 bg-slate-50/50 rounded-t-2xl">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Actions</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 p-2">
                                            {userHasPermission('manage-tasks') && (
                                                <Dropdown.Link href={route('tasks.create')} className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 rounded-lg group text-center border border-transparent hover:border-slate-100 transition-all">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">Create Task</span>
                                                </Dropdown.Link>
                                            )}

                                            {userHasPermission('create-employees') && (
                                                <Dropdown.Link href={route('employees.create')} className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 rounded-lg group text-center border border-transparent hover:border-slate-100 transition-all">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">Add Employee</span>
                                                </Dropdown.Link>
                                            )}

                                            {userHasPermission('manage-projects') && (
                                                <Dropdown.Link href={route('projects.create')} className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 rounded-lg group text-center border border-transparent hover:border-slate-100 transition-all">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">New Project</span>
                                                </Dropdown.Link>
                                            )}

                                            {userHasPermission('manage-branches') && (
                                                <Dropdown.Link href={route('companies.create')} className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-slate-50 rounded-lg group text-center border border-transparent hover:border-slate-100 transition-all">
                                                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-sm">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">Add Branch</span>
                                                </Dropdown.Link>
                                            )}
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}

                            {/* Attendance Quick Actions */}
                            {user.employee_id && (
                                <div className="flex items-center gap-2">
                                    {!user.todayAttendance?.from_time ? (
                                        <button
                                            onClick={() => {
                                                setIsProcessing(true);
                                                router.post(route('employee-attendances.clockIn'), {}, {
                                                    onFinish: () => setIsProcessing(false)
                                                });
                                            }}
                                            disabled={isProcessing}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50 active:scale-95"
                                            title="Clock In"
                                        >
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            Clock In
                                        </button>
                                    ) : !user.todayAttendance?.to_time ? (
                                        <div className="flex items-center gap-2">
                                            {user.todayAttendance?.current_break_start ? (
                                                <button
                                                    onClick={() => {
                                                        setIsProcessing(true);
                                                        router.post(route('employee-attendances.endBreak'), {}, {
                                                            onFinish: () => setIsProcessing(false)
                                                        });
                                                    }}
                                                    disabled={isProcessing}
                                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-amber-100 disabled:opacity-50 active:scale-95"
                                                    title="End Break"
                                                >
                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Resume
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setIsProcessing(true);
                                                        router.post(route('employee-attendances.startBreak'), {}, {
                                                            onFinish: () => setIsProcessing(false)
                                                        });
                                                    }}
                                                    disabled={isProcessing}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50 active:scale-95"
                                                    title="Start Break"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Break
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setIsProcessing(true);
                                                    router.post(route('employee-attendances.clockOut'), {}, {
                                                        onFinish: () => setIsProcessing(false)
                                                    });
                                                }}
                                                disabled={isProcessing || user.todayAttendance?.current_break_start}
                                                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-rose-100 disabled:opacity-50 active:scale-95"
                                                title="Clock Out"
                                            >
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                                Clock Out
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                            Shift Done
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notifications */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative group active:scale-95"
                                    >
                                        <span className="sr-only">View notifications</span>
                                        <BellIcon className="h-5 w-5" />
                                        {user.unreadNotifications?.length > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform animate-bounce">
                                                {user.unreadNotifications.length > 9 ? '9+' : user.unreadNotifications.length}
                                            </span>
                                        )}
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content width="80" contentClasses="py-0 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Notification Hub</h3>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">System Signals & Directives</p>
                                        </div>
                                        {user.unreadNotifications?.length > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.post(route('notifications.markAllAsRead'));
                                                }}
                                                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                            >
                                                Purge All
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {user.unreadNotifications?.length > 0 ? (
                                            <div className="divide-y divide-slate-50">
                                                {user.unreadNotifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className="p-4 hover:bg-slate-50 transition-colors group relative"
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${getNotificationStyles(notification.data.type).classes}`}>
                                                                {getNotificationStyles(notification.data.type).icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {notification.data.type?.replace('_', ' ') || 'Alert'}
                                                                    </span>
                                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tight">
                                                                        {notification.created_at}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2">
                                                                    {notification.data.message}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-3">
                                                                    {notification.data.action_url ? (
                                                                        <Link
                                                                            href={notification.data.action_url}
                                                                            onClick={() => router.post(route('notifications.markAsRead', notification.id))}
                                                                            className="text-[9px] font-black text-white bg-slate-900 px-3 py-1 rounded-md hover:bg-black transition-all flex items-center gap-1.5 uppercase tracking-widest"
                                                                        >
                                                                            Execute
                                                                            <FiExternalLink className="w-2.5 h-2.5" />
                                                                        </Link>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => router.post(route('notifications.markAsRead', notification.id))}
                                                                            className="text-[9px] font-black text-white bg-slate-900 px-3 py-1 rounded-md hover:bg-black transition-all flex items-center gap-1.5 uppercase tracking-widest"
                                                                        >
                                                                            Mark Resolve
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-5 py-12 text-center">
                                                <div className="w-12 h-12 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <BellIcon className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Clear Frequency</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-1">No pending signals detected</p>
                                            </div>
                                        )}
                                    </div>

                                    {user.unreadNotifications?.length > 0 && (
                                        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 text-center">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">End of Directive Stream</p>
                                        </div>
                                    )}
                                </Dropdown.Content>
                            </Dropdown>

                            {/* User menu */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-50 rounded-lg transition-all group"
                                    >
                                        <Avatar
                                            src={user.image}
                                            name={user.name}
                                            size="sm"
                                            className="group-hover:scale-105 transition-transform"
                                        />
                                        <div className="hidden lg:flex flex-col items-start text-left">
                                            <span className="text-xs font-black text-slate-800 tracking-tight leading-none mb-1">{user.name}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{user.email}</span>
                                        </div>
                                        <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content width="48" contentClasses="py-2 bg-white rounded-lg shadow-2xl border border-slate-100">
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3 py-2.5 hover:bg-indigo-50 group">
                                        <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="font-bold text-slate-700">My Profile</span>
                                    </Dropdown.Link>
                                    <div className="h-px bg-slate-50 my-1 mx-4"></div>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 py-2.5 hover:bg-rose-50 group w-full text-left">
                                        <svg className="w-4 h-4 text-slate-400 group-hover:text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="font-bold text-slate-700 group-hover:text-rose-700">Sign Out</span>
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <main className="py-6 w-full"> 
                    <div className="w-full px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
