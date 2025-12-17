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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileSpreadsheet size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Marketplace Bulk Editor
            </h1>
          </div>

          {listings.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              <ExportButton data={listings} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* File Upload Section */}
          <div className="mb-8">
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>

          {/* Data Table Section */}
          {listings.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Listings</h2>
                  <p className="text-sm text-gray-500">Manage your marketplace inventory ({listings.length} items)</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6">
                  <DataTable data={listings} onUpdate={setListings} />
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {listings.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No listings yet
              </h3>
              <p className="text-sm text-gray-500">
                Upload Excel files to get started
              </p>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Supports Facebook Marketplace bulk upload format • Max 50 listings per file
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
