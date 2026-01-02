import { useState } from 'react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  showDontAskAgain?: boolean;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  showDontAskAgain = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontAskAgain);
  };

  // Mobile-friendly button classes with larger touch targets
  const confirmButtonClass = confirmVariant === 'danger'
    ? 'px-4 py-3 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium min-h-[44px] sm:min-h-0'
    : 'px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px] sm:min-h-0';

  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
      <button
        onClick={onCancel}
        className="px-4 py-3 sm:py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium min-h-[44px] sm:min-h-0 order-2 sm:order-1"
      >
        {cancelText}
      </button>
      <button
        onClick={handleConfirm}
        className={`${confirmButtonClass} order-1 sm:order-2`}
      >
        {confirmText}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="space-y-4">
        <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">{message}</p>

        {showDontAskAgain && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="dont-ask-again"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-5 h-5"
            />
            <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Don't ask me again
            </span>
          </label>
        )}
      </div>
    </Modal>
  );
}

