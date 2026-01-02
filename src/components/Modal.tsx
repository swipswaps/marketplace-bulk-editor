/**
 * Reusable Modal Component
 * Based on Tailwind CSS best practices and accessibility guidelines
 * Source: Material Tailwind, DEV Community, React docs
 */

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}: ModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mobile-first responsive sizing
  const sizeClasses = {
    sm: 'w-full max-w-sm mx-4',           // 384px max, 16px margin on mobile
    md: 'w-full max-w-md mx-4',           // 448px max
    lg: 'w-full max-w-2xl mx-4',          // 672px max
    xl: 'w-full max-w-4xl mx-4',          // 896px max
    full: 'w-full h-full m-0 rounded-none', // Full screen on mobile
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-0 sm:p-4">
        {/* Modal content */}
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} transform transition-all flex flex-col ${size === 'full' ? 'max-h-screen' : 'max-h-[95vh]'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Mobile optimized with larger touch targets */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3
              id="modal-title"
              className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white pr-2"
            >
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Body - Scrollable content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>

          {/* Footer - Optional */}
          {footer && (
            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

