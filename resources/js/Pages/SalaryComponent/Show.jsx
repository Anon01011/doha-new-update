import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Show({ component }) {
    const { appSettings } = usePage().props;
    const currency = appSettings?.currency || 'QAR';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-normal text-gray-800">Salary Component Details</h2>}>
            <Head title={component.name} />

            <div className="full-w mx-auto p-4 space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-normal">{component.name}</h1>
                        <div className="flex space-x-2">
                            <Link href={route('salary-components.edit', component.id)} className="px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 shadow-lg shadow-primary/20 active:scale-95">Edit</Link>
                            <Link href={route('salary-components.index')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Back</Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm text-gray-500">Type:</label><p className="font-normal">{component.type}</p></div>
                        <div><label className="text-sm text-gray-500">Default Amount:</label><p className="font-normal">{formatCurrency(component.default_amount)}</p></div>
                        <div><label className="text-sm text-gray-500">Taxable:</label><p className="font-normal">{component.is_taxable ? 'Yes' : 'No'}</p></div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}


