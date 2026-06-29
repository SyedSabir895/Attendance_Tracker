import Modal from './Modal';
import Button from './Button';
import { MdWarning } from 'react-icons/md';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <MdWarning size={28} className="text-red-600 dark:text-red-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{message || 'This action cannot be undone.'}</p>
      </div>
      <div className="flex gap-3 mt-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
