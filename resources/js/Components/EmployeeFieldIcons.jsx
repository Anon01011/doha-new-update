import React from 'react';
import { 
    FiUser, FiHash, FiUsers, FiCalendar, FiSmartphone, FiMail, 
    FiAward, FiGlobe, FiShield, FiBriefcase, FiMapPin, FiFolder, 
    FiClock, FiActivity, FiFileText, FiCreditCard, FiDollarSign, 
    FiLogOut, FiCamera, FiLock 
} from 'react-icons/fi';

const iconClass = "h-5 w-5";

const EmployeeFieldIcons = {
    name: <FiUser className={`${iconClass} text-blue-400`} />,
    employee_code: <FiHash className={`${iconClass} text-purple-400`} />,
    gender: <FiUsers className={`${iconClass} text-pink-400`} />,
    dob: <FiCalendar className={`${iconClass} text-green-400`} />,
    mobile: <FiSmartphone className={`${iconClass} text-indigo-400`} />,
    email: <FiMail className={`${iconClass} text-blue-400`} />,
    designation: <FiAward className={`${iconClass} text-teal-400`} />,
    nationality: <FiGlobe className={`${iconClass} text-orange-400`} />,
    sponsor: <FiShield className={`${iconClass} text-lime-400`} />,
    company: <FiBriefcase className={`${iconClass} text-cyan-400`} />,
    location: <FiMapPin className={`${iconClass} text-rose-400`} />,
    department: <FiFolder className={`${iconClass} text-fuchsia-400`} />,
    joined_date: <FiCalendar className={`${iconClass} text-green-400`} />,
    rejoined_date: <FiCalendar className={`${iconClass} text-green-300`} />,
    shift: <FiClock className={`${iconClass} text-amber-400`} />,
    visa_type: <FiFileText className={`${iconClass} text-blue-300`} />,
    visa_designation: <FiFileText className={`${iconClass} text-blue-200`} />,
    employee_category: <FiActivity className={`${iconClass} text-pink-300`} />,
    contract_duration: <FiClock className={`${iconClass} text-gray-400`} />,
    exit_status: <FiLogOut className={`${iconClass} text-red-400`} />,
    payment_type: <FiDollarSign className={`${iconClass} text-green-500`} />,
    leave_status: <FiClock className={`${iconClass} text-blue-500`} />,
    reported_to: <FiUser className={`${iconClass} text-gray-500`} />,
    employee_image: <FiCamera className={`${iconClass} text-indigo-500`} />,
    passport: <FiCreditCard className={`${iconClass} text-indigo-600`} />,
    card: <FiCreditCard className={`${iconClass} text-blue-600`} />,
    password: <FiLock className={`${iconClass} text-indigo-500`} />,
};

export default EmployeeFieldIcons;
