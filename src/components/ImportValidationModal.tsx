import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import type { ImportValidationResult } from '../types';

interface ImportValidationModalProps {
  validationResult: ImportValidationResult;
  onImportAll: () => void;
  onImportValidOnly: () => void;
  onCancel: () => void;
}

export function ImportValidationModal({
  validationResult,
  onImportAll,
  onImportValidOnly,
  onCancel
}: ImportValidationModalProps) {
  const { validCount, autoFilledCount, rejectedCount, totalRows, autoFilled, rejected } = validationResult;

  // Mobile-friendly footer with larger touch targets
  const footer = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-900 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={onCancel}
        className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors min-h-[44px] sm:min-h-0 order-3 sm:order-1"
      >
        Cancel
      </button>

      {(validCount > 0 || autoFilledCount > 0) && (
        <button
          onClick={onImportValidOnly}
          className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-green-600 dark:bg-green-700 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors min-h-[44px] sm:min-h-0 order-2 sm:order-2"
        >
          Import Valid Only ({validCount})
        </button>
      )}

      {autoFilledCount > 0 && (
        <button
          onClick={onImportAll}
          className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[44px] sm:min-h-0 order-1 sm:order-3"
        >
          Import & Review ({validCount + autoFilledCount})
        </button>
      )}

      {autoFilledCount === 0 && validCount > 0 && (
        <button
          onClick={onImportAll}
          className="px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[44px] sm:min-h-0 order-1 sm:order-3"
        >
          Import All ({validCount})
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={24} />
          <div>
            <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Import Validation Report
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-normal">
              Imported <strong>{totalRows}</strong> row(s) from file
            </p>
          </div>
        </div>
      }
      size="lg"
      footer={footer}
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Valid rows */}
        {validCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-base sm:text-sm font-medium text-green-900 dark:text-green-100">
                ✅ {validCount} row(s) valid
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                All required fields (TITLE, PRICE, CONDITION) are filled
              </p>
            </div>
          </div>
        )}

        {/* Auto-filled rows */}
        {autoFilledCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-base sm:text-sm font-medium text-orange-900 dark:text-orange-100">
                ⚠️ {autoFilledCount} row(s) with auto-filled fields
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 mb-3">
                These rows had missing fields that were filled with default values. Please review.
              </p>

              {/* Show details for first 5 auto-filled rows */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {autoFilled.slice(0, 5).map((listing, idx) => (
                  <div key={listing.id} className="text-xs sm:text-xs bg-white dark:bg-gray-800 p-2 rounded border border-orange-200 dark:border-orange-700">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Row {idx + 1}: {listing.TITLE || '(No title)'}
                    </p>
                    {listing._autoFilled?.map((field, fieldIdx) => (
                      <p key={fieldIdx} className="text-orange-700 dark:text-orange-300 ml-2">
                        • {String(field.field)}: {field.reason}
                      </p>
                    ))}
                  </div>
                ))}
                {autoFilled.length > 5 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 italic">
                    ... and {autoFilled.length - 5} more row(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejected rows */}
        {rejectedCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <XCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-base sm:text-sm font-medium text-red-900 dark:text-red-100">
                ❌ {rejectedCount} row(s) rejected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1 mb-3">
                These rows are missing TITLE (required field) and cannot be imported
              </p>

              {/* Show details for first 5 rejected rows */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rejected.slice(0, 5).map((listing, idx) => (
                  <div key={listing.id} className="text-xs sm:text-xs bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-700">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Row {idx + 1}: (No title)
                    </p>
                    <p className="text-red-700 dark:text-red-300 ml-2">
                      • Missing required field: TITLE
                    </p>
                  </div>
                ))}
                {rejected.length > 5 && (
                  <p className="text-xs text-red-600 dark:text-red-400 italic">
                    ... and {rejected.length - 5} more row(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

