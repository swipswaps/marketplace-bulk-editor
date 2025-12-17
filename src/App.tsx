import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { ExportButton } from './components/ExportButton';
import type { MarketplaceListing } from './types';
import { FileSpreadsheet, Trash2 } from 'lucide-react';

function App() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);

  const handleDataLoaded = (newData: MarketplaceListing[]) => {
    // Merge with existing data
    setListings(prev => [...prev, ...newData]);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all listings?')) {
      setListings([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Facebook Marketplace Bulk Editor
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Upload, edit, and combine Facebook Marketplace bulk upload spreadsheets with ease
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-6 sm:mb-8">
          <FileUpload onDataLoaded={handleDataLoaded} />
        </div>

        {/* Data Table Section */}
        {listings.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-white">
                    📋 Listings ({listings.length})
                  </h2>
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all text-sm sm:text-base"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Clear All</span>
                      <span className="sm:hidden">Clear</span>
                    </button>
                    <ExportButton data={listings} />
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <DataTable data={listings} onUpdate={setListings} />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {listings.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 flex items-center justify-center">
              <FileSpreadsheet className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No listings yet
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Upload Excel files to get started
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm">
              <span>💡</span>
              <span>Drag & drop files above or click to browse</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-lg border border-gray-200">
            <span className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Facebook Marketplace format
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="flex items-center gap-2">
              <span className="text-blue-600">📊</span>
              Max 50 listings per file
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="flex items-center gap-2">
              <span className="text-purple-600">📱</span>
              Mobile friendly
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
