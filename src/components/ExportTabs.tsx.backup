/**
 * Export Tabs Component
 * Tab-based export UI for CSV, JSON, TXT, XLSX, SQL formats
 * Based on receipts-ocr pattern
 */

import { useState, useMemo } from 'react';
import { Download, FileText, FileJson, Table, FileSpreadsheet, Database } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { useAuth } from '../contexts/AuthContext';

type OutputTab = 'text' | 'json' | 'csv' | 'xlsx' | 'sql';

interface ExportTabsProps {
  data: MarketplaceListing[];
}

export function ExportTabs({ data }: ExportTabsProps) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<OutputTab>('csv');

  // Format converters
  const textOutput = useMemo(() => {
    if (!data.length) return '';
    const header = 'TITLE\tPRICE\tCONDITION\tDESCRIPTION\tCATEGORY\tOFFER SHIPPING\n';
    const rows = data.map(item => 
      `${item.TITLE}\t${item.PRICE}\t${item.CONDITION}\t${item.DESCRIPTION || ''}\t${item.CATEGORY || ''}\t${item['OFFER SHIPPING'] || 'No'}`
    ).join('\n');
    return header + rows;
  }, [data]);

  const jsonOutput = useMemo(() => {
    if (!data.length) return '[]';
    return JSON.stringify(data, null, 2);
  }, [data]);

  const csvOutput = useMemo(() => {
    if (!data.length) return '';
    const header = 'TITLE,PRICE,CONDITION,DESCRIPTION,CATEGORY,OFFER SHIPPING\n';
    const rows = data.map(item => {
      const escape = (val: string | number) => {
        const str = String(val || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      return `${escape(item.TITLE)},${escape(item.PRICE)},${escape(item.CONDITION)},${escape(item.DESCRIPTION || '')},${escape(item.CATEGORY || '')},${escape(item['OFFER SHIPPING'] || 'No')}`;
    }).join('\n');
    return header + rows;
  }, [data]);

  const sqlOutput = useMemo(() => {
    if (!data.length) return '';
    const lines = data.map(item => {
      const escape = (val: string | number) => String(val || '').replace(/'/g, "''");
      return `INSERT INTO marketplace_listings (title, price, condition, description, category, offer_shipping) VALUES ('${escape(item.TITLE)}', ${item.PRICE}, '${escape(item.CONDITION)}', '${escape(item.DESCRIPTION || '')}', '${escape(item.CATEGORY || '')}', '${escape(item['OFFER SHIPPING'] || 'No')}');`;
    });
    return `-- Marketplace Listings Export\n-- Generated: ${new Date().toISOString()}\n\n${lines.join('\n')}`;
  }, [data]);

  // Download handler
  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // XLSX download handler
  const handleDownloadXLSX = async () => {
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Listings');
      XLSX.writeFile(wb, `marketplace-listings-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('XLSX export failed:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  if (!data.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {(['text', 'json', 'csv', 'xlsx', 'sql'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            {tab === 'text' && <FileText size={16} />}
            {tab === 'json' && <FileJson size={16} />}
            {tab === 'csv' && <Table size={16} />}
            {tab === 'xlsx' && <FileSpreadsheet size={16} />}
            {tab === 'sql' && <Database size={16} />}
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* TEXT Tab */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tab-Delimited Text ({data.length} listings)
              </span>
              <button
                onClick={() => handleDownload(textOutput, `marketplace-listings-${Date.now()}.txt`, 'text/plain')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download size={14} /> Download .txt
              </button>
            </div>
            <textarea
              value={textOutput}
              readOnly
              className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* JSON Tab */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                JSON Output ({data.length} listings)
              </span>
              <button
                onClick={() => handleDownload(jsonOutput, `marketplace-listings-${Date.now()}.json`, 'application/json')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <Download size={14} /> Download .json
              </button>
            </div>
            <textarea
              value={jsonOutput}
              readOnly
              className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* CSV Tab */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                CSV Output ({data.length} listings)
              </span>
              <button
                onClick={() => handleDownload(csvOutput, `marketplace-listings-${Date.now()}.csv`, 'text/csv')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
              >
                <Download size={14} /> Download .csv
              </button>
            </div>
            <textarea
              value={csvOutput}
              readOnly
              className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* XLSX Tab */}
        {activeTab === 'xlsx' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Excel Preview ({data.length} listings)
              </span>
              <button
                onClick={handleDownloadXLSX}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <Download size={14} /> Download .xlsx
              </button>
            </div>
            <div className="overflow-auto max-h-96 border border-gray-300 dark:border-gray-600 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Condition</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{item.TITLE}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">${item.PRICE}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{item.CONDITION}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">{item.CATEGORY || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SQL Tab */}
        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                SQL Output ({data.length} INSERT statements)
              </span>
              <button
                onClick={() => handleDownload(sqlOutput, `marketplace-listings-${Date.now()}.sql`, 'text/plain')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download size={14} /> Download .sql
              </button>
            </div>
            <textarea
              value={sqlOutput}
              readOnly
              className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              💡 <strong>Tip:</strong> Login to save exports to the database and access backend export features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
