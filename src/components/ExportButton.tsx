import { useState } from 'react';
import { Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing, TemplateMetadata } from '../types';

type SortField = keyof MarketplaceListing | null;
type SortDirection = 'asc' | 'desc' | null;

interface ExportButtonProps {
  data: MarketplaceListing[];
  sortField: SortField;
  sortDirection: SortDirection;
  template: TemplateMetadata | null;
}

export function ExportButton({ data, sortField, sortDirection, template }: ExportButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);

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

    // Reverse order if checkbox is checked
    return reverseOrder ? sortedData.reverse() : sortedData;
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

    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet;
    let sheetName = 'Marketplace Listings';

    if (template) {
      // Use template structure
      sheetName = template.sheetName;

      // Create an array of arrays for the worksheet
      const wsData: (string | number)[][] = [];

      // Add header rows from template (rows before column headers)
      template.headerRows.forEach(row => {
        wsData.push(row);
      });

      // Add column headers
      wsData.push(template.columnHeaders);

      // Add data rows
      exportData.forEach(row => {
        const dataRow: (string | number)[] = [];
        template.columnHeaders.forEach(header => {
          if (header && header in row) {
            dataRow.push(row[header as keyof typeof row] as string | number);
          } else {
            dataRow.push('');
          }
        });
        wsData.push(dataRow);
      });

      // Create worksheet from array of arrays
      worksheet = XLSX.utils.aoa_to_sheet(wsData);
    } else {
      // No template - use default export
      worksheet = XLSX.utils.json_to_sheet(exportData);
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

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

            {/* Validation Warnings */}
            {(() => {
              const sortedData = getSortedData();
              const emptyTitles = sortedData.filter(item => !item.TITLE || String(item.TITLE).trim() === '').length;
              const emptyDescriptions = sortedData.filter(item => !item.DESCRIPTION || String(item.DESCRIPTION).trim() === '').length;
              const zeroPrices = sortedData.filter(item => !item.PRICE || Number(item.PRICE) === 0).length;

              const hasWarnings = emptyTitles > 0 || emptyDescriptions > 0 || zeroPrices > 0;

              if (!hasWarnings) return null;

              return (
                <div className="mx-6 mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                        ⚠️ Validation Warnings
                      </p>
                      <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                        {emptyTitles > 0 && (
                          <li>• {emptyTitles} listing{emptyTitles > 1 ? 's have' : ' has'} empty TITLE (required by Facebook)</li>
                        )}
                        {emptyDescriptions > 0 && (
                          <li>• {emptyDescriptions} listing{emptyDescriptions > 1 ? 's have' : ' has'} empty DESCRIPTION (required by Facebook)</li>
                        )}
                        {zeroPrices > 0 && (
                          <li>• {zeroPrices} listing{zeroPrices > 1 ? 's have' : ' has'} PRICE = 0 (may be rejected by Facebook)</li>
                        )}
                      </ul>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                        Facebook may reject listings with missing required fields.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                  {getSortedData().slice(0, 10).map((listing, idx) => {
                    const hasEmptyTitle = !listing.TITLE || String(listing.TITLE).trim() === '';
                    const hasEmptyDescription = !listing.DESCRIPTION || String(listing.DESCRIPTION).trim() === '';
                    const hasZeroPrice = !listing.PRICE || Number(listing.PRICE) === 0;
                    const hasError = hasEmptyTitle || hasEmptyDescription;

                    return (
                      <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${hasError ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                        <td className={`border dark:border-gray-700 px-3 py-2 ${hasEmptyTitle ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                          {hasEmptyTitle ? '⚠️ Empty' : listing.TITLE}
                        </td>
                        <td className={`border dark:border-gray-700 px-3 py-2 ${hasZeroPrice ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          ${listing.PRICE}
                        </td>
                        <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing.CONDITION}</td>
                        <td className={`border dark:border-gray-700 px-3 py-2 max-w-xs truncate ${hasEmptyDescription ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                          {hasEmptyDescription ? '⚠️ Empty' : listing.DESCRIPTION}
                        </td>
                        <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing.CATEGORY}</td>
                        <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing['OFFER SHIPPING']}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {/* Reverse Order Checkbox */}
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reverseOrder}
                  onChange={(e) => setReverseOrder(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                />
                <span>Reverse order on export</span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
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
        </div>
      )}
    </>
  );
}

