import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function EmployeeNotFound({ employee_name, company_name, week_start, employee_exists, company_exists, all_companies = [], all_employees = [] }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Employee Roster Not Found</h2>}>
            <Head title="Employee Roster Not Found" />
            <div className="max-w-lg mx-auto bg-white rounded-lg shadow p-8 mt-10 text-center">
                <h1 className="text-2xl font-normal mb-4 text-red-600">Roster Not Found</h1>
                {!employee_exists && (
                    <>
                        <p className="mb-2 text-gray-700">Employee <b>{employee_name}</b> does not exist.</p>
                        <div className="mb-4">
                            <div className="font-normal text-sm mb-1">Available Employees:</div>
                            <div className="text-xs text-gray-600 flex flex-wrap gap-2 justify-center">
                                {all_employees.map(name => <span key={name} className="bg-gray-100 rounded px-2 py-1">{name}</span>)}
                            </div>
                        </div>
                    </>
                )}
                {!company_exists && (
                    <>
                        <p className="mb-2 text-gray-700">Company <b>{company_name}</b> does not exist.</p>
                        <div className="mb-4">
                            <div className="font-normal text-sm mb-1">Available Companies:</div>
                            <div className="text-xs text-gray-600 flex flex-wrap gap-2 justify-center">
                                {all_companies.map(name => <span key={name} className="bg-gray-100 rounded px-2 py-1">{name}</span>)}
                            </div>
                        </div>
                    </>
                )}
                {employee_exists && company_exists && (
                    <p className="mb-2 text-gray-700">No roster found for <b>{employee_name}</b> at <b>{company_name}</b> for this week.</p>
                )}
                <Link href={route('shift-rosters.index')} className="mt-6 inline-block px-4 py-2 bg-primary text-white rounded hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95">Back to Roster Index</Link>
            </div>
        </AuthenticatedLayout>
    );
} 