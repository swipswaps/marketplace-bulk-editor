/**
 * History Tab - File import/export/OCR history
 */
import { useState } from 'react';
import FileHistoryTable from './FileHistoryTable';

export default function HistoryTab() {
  const [filterType, setFilterType] = useState<'all' | 'import' | 'export' | 'ocr'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          File History
        </h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('import')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filterType === 'import'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          📥 Imports
        </button>
        <button
          onClick={() => setFilterType('export')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filterType === 'export'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          📤 Exports
        </button>
        <button
          onClick={() => setFilterType('ocr')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filterType === 'ocr'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🔍 OCR
        </button>
      </div>

      {/* File History Table */}
      <FileHistoryTable
        fileType={filterType === 'all' ? undefined : filterType}
        onRefresh={refreshKey > 0 ? handleRefresh : undefined}
      />
    </div>
  );
}

