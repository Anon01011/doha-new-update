import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { FaExclamationTriangle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

export default function ConfirmationModal({
    show = false,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    onConfirm,
    onClose,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info', // 'info', 'success', 'warning', 'danger'
    processing = false,
    hideCancel = false,
}) {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <FaCheckCircle className="text-emerald-500 w-6 h-6" />;
            case 'danger':
                return <FaExclamationTriangle className="text-red-500 w-6 h-6" />;
            case 'warning':
                return <FaExclamationTriangle className="text-amber-500 w-6 h-6" />;
            default:
                return <FaInfoCircle className="text-blue-500 w-6 h-6" />;
        }
    };

    const getConfirmButton = () => {
        if (type === 'danger') {
            return (
                <DangerButton
                    className="ml-3"
                    disabled={processing}
                    onClick={onConfirm}
                >
                    {confirmText}
                </DangerButton>
            );
        }

        return (
            <PrimaryButton
                className={`ml-3 ${type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                disabled={processing}
                onClick={onConfirm}
            >
                {confirmText}
            </PrimaryButton>
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${type === 'success' ? 'bg-emerald-50' :
                            type === 'danger' ? 'bg-red-50' :
                                type === 'warning' ? 'bg-amber-50' :
                                    'bg-blue-50'
                        }`}>
                        {getIcon()}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                        {title}
                    </h2>
                </div>

                <div className="mt-4">
                    <p className="text-sm text-gray-600">
                        {message}
                    </p>
                </div>

                <div className="mt-6 flex justify-end">
                    {!hideCancel && (
                        <SecondaryButton onClick={onClose} disabled={processing}>
                            {cancelText}
                        </SecondaryButton>
                    )}

                    {getConfirmButton()}
                </div>
            </div>
        </Modal>
    );
}
