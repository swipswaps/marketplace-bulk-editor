import { useState, useEffect } from 'react';
import { Download, X, AlertTriangle, ChevronDown, Database, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing, TemplateMetadata } from '../types';
import { validateListings, validateListing } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';

type SortField = keyof MarketplaceListing | null;
type SortDirection = 'asc' | 'desc' | null;

interface ExportButtonProps {
  data: MarketplaceListing[];
  sortField: SortField;
  sortDirection: SortDirection;
  template: TemplateMetadata | null;
  onPreviewRender?: (content: React.ReactNode | null) => void;
}

export function ExportButton({ data, sortField, sortDirection, template, onPreviewRender }: ExportButtonProps) {
  const { isAuthenticated } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Notify parent when preview state changes
  useEffect(() => {
    if (onPreviewRender) {
      onPreviewRender(showPreview ? renderPreviewContent() : null);
    }
  }, [showPreview, data, sortField, sortDirection, reverseOrder]);

  const getSortedData = () => {
    // Filter out invalid listings (missing required fields)
    const validData = data.filter(listing => {
      const validation = validateListing(listing);
      // Only export listings with TITLE, PRICE, and CONDITION filled
      return !validation.emptyTitle && !validation.zeroPrice && !validation.emptyCondition;
    });

    // Sort data if a sort is active
    const sortedData = [...validData];
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

  const handleExportSQL = async () => {
    if (!isAuthenticated) {
      alert('Please login to export to SQL');
      return;
    }

    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      const sortedData = getSortedData();

      // Transform to backend format
      const backendListings = sortedData.map(listing => ({
        title: listing.TITLE,
        price: listing.PRICE.toString(),
        condition: listing.CONDITION,
        description: listing.DESCRIPTION || '',
        category: listing.CATEGORY || '',
        offer_shipping: listing['OFFER SHIPPING'] || 'No',
      }));

      // Call backend API (returns text/plain SQL)
      const sqlContent = await apiClient.post<string>('/api/export/sql', { listings: backendListings });

      // Download file
      const blob = new Blob([sqlContent], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketplace-listings-${Date.now()}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setShowExportMenu(false);
    } catch (error) {
      console.error('SQL export failed:', error);
      alert('Failed to export to SQL. Please try again.');
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const sortedData = getSortedData();

    // Warn if invalid rows were skipped
    const skippedCount = data.length - sortedData.length;
    if (skippedCount > 0) {
      if (!confirm(`${skippedCount} invalid row(s) will be skipped (missing TITLE, PRICE, or CONDITION). Continue export?`)) {
        return;
      }
    }

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

  const renderPreviewContent = () => {
    const sortedData = getSortedData();
    const validation = validateListings(sortedData);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
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
        {validation.warnings.length > 0 && (
          <div className="mx-6 mt-6 space-y-3">
            {/* Errors */}
            {validation.warnings.filter(w => w.type === 'error').length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                      🚫 Policy Violations Detected
                    </p>
                    <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                      {validation.warnings.filter(w => w.type === 'error').map((error, idx) => (
                        <li key={idx}>
                          <strong>{error.category}:</strong> {error.message}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-3 font-medium">
                      ⚠️ Facebook may reject or ban your account for these violations. Review and fix before uploading.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.filter(w => w.type === 'warning').length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
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
                      {validation.warnings.filter(w => w.type === 'warning').map((warning, idx) => (
                        <li key={idx}>
                          <strong>{warning.category}:</strong> {warning.message}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                      Facebook may reject listings with these issues.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Table */}
        <div className="overflow-auto p-6">
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
              {sortedData.slice(0, 10).map((listing, idx) => {
                const itemValidation = validateListings([listing]);
                const hasEmptyTitle = itemValidation.emptyTitles > 0;
                const hasEmptyDescription = itemValidation.emptyDescriptions > 0;
                const hasZeroPrice = itemValidation.zeroPrices > 0;
                const hasProhibited = itemValidation.prohibitedItems > 0;
                const hasError = hasEmptyTitle || hasEmptyDescription || hasProhibited;

                return (
                  <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${hasError ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    <td className={`border dark:border-gray-700 px-3 py-2 ${hasEmptyTitle ? 'text-red-600 dark:text-red-400 font-medium' : hasProhibited ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {hasEmptyTitle ? '⚠️ Empty' : hasProhibited ? `🚫 ${listing.TITLE}` : listing.TITLE}
                    </td>
                    <td className={`border dark:border-gray-700 px-3 py-2 ${hasZeroPrice ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      ${listing.PRICE}
                    </td>
                    <td className="border dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">{listing.CONDITION}</td>
                    <td className={`border dark:border-gray-700 px-3 py-2 max-w-xs truncate ${hasEmptyDescription ? 'text-red-600 dark:text-red-400 font-medium' : hasProhibited ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {hasEmptyDescription ? '⚠️ Empty' : hasProhibited ? `🚫 ${listing.DESCRIPTION}` : listing.DESCRIPTION}
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
    );
  };

  return (
    <div className="relative">
      {/* Main Export Button */}
      <button
        onClick={() => setShowPreview(true)}
        disabled={data.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-l-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <Download size={16} />
        Export for FB
      </button>

      {/* Dropdown Toggle */}
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        disabled={data.length === 0}
        className="inline-flex items-center px-2 py-2 text-sm font-medium text-white bg-blue-600 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm border-l border-blue-500"
      >
        <ChevronDown size={16} />
      </button>

      {/* Export Options Dropdown */}
      {showExportMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowExportMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {/* Excel Export (default) */}
              <button
                onClick={() => {
                  setShowPreview(true);
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileSpreadsheet size={18} className="text-green-600 dark:text-green-400" />
                <div>
                  <div className="font-medium">Export to Excel</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Facebook Marketplace format</div>
                </div>
              </button>

              {/* SQL Export (requires auth) */}
              {isAuthenticated && (
                <button
                  onClick={handleExportSQL}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Database size={18} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium">Export to SQL</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Database INSERT statements</div>
                  </div>
                </button>
              )}

              {/* Login prompt if not authenticated */}
              {!isAuthenticated && (
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                  <Database size={14} className="inline mr-1" />
                  Login to export to SQL
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}