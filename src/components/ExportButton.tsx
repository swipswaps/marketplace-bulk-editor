import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing } from '../types';

interface ExportButtonProps {
  data: MarketplaceListing[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for export (remove id field)
    const exportData = data.map(({ id, ...rest }) => rest);

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
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
    >
      <Download size={16} />
      Export for FB
    </button>
  );
}

