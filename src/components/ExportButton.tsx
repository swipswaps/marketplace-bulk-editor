import { useState } from 'react';
import { Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing } from '../types';

type SortField = keyof MarketplaceListing | null;
type SortDirection = 'asc' | 'desc' | null;

interface ExportButtonProps {
  data: MarketplaceListing[];
  sortField: SortField;
  sortDirection: SortDirection;
}

export function ExportButton({ data, sortField, sortDirection }: ExportButtonProps) {
  const [showPreview, setShowPreview] = useState(false);

  const getSortedData = () => {
    // Sort data if a sort is active
    const sortedData = [...data];
    if (sortField && sortDirection) {
      sortedData.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === bVal) return 0;

        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison; // Match DataTable sorting exactly
      });
    }
    return sortedData;
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const sortedData = getSortedData();

    // Prepare data for export (remove id field)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const exportData = sortedData.map(({ id, ...rest }) => rest);

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marketplace Listings');

    // Set column widths
    const colWidths = [
      { wch: 50 }, // TITLE
      { wch: 10 }, // PRICE
      { wch: 15 }, // CONDITION
      { wch: 60 }, // DESCRIPTION
      { wch: 15 }, // CATEGORY
      { wch: 15 }, // OFFER SHIPPING
    ];
    worksheet['!cols'] = colWidths;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Facebook_Marketplace_Bulk_Upload_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  return (
    <>
      <button
        onClick={() => setShowPreview(true)}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <Download size={16} />
        Export for FB
      </button>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Export Preview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Showing first 10 of {data.length} listings • {sortField ? `Sorted by ${sortField} (${sortDirection})` : 'Original order'}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full border border-gray-300 dark:border-gray-700 text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="border dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">TITLE</th>
                    <th className="border dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">PRICE</th>
                    <th className="border dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">CONDITION</th>
                    <th className="border dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">DESCRIPTION</th>
                    <th className="border dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">CATEGORY</th>
                    <th className="border dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">OFFER SHIPPING</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedData().slice(0, 10).map((listing, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing.TITLE}</td>
                      <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">${listing.PRICE}</td>
                      <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing.CONDITION}</td>
                      <td className="border dark:border-gray-700 px-3 py-2 max-w-xs truncate text-gray-900 dark:text-gray-100">{listing.DESCRIPTION}</td>
                      <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing.CATEGORY}</td>
                      <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing['OFFER SHIPPING']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleExport();
                  setShowPreview(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Confirm Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

