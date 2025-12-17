import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { ExportButton } from './components/ExportButton';
import { Moon, Sun } from 'lucide-react';
import type { MarketplaceListing } from './types';
import { FileSpreadsheet, Trash2 } from 'lucide-react';

type SortField = keyof MarketplaceListing | null;
type SortDirection = 'asc' | 'desc' | null;

function App() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg text-white">
              <FileSpreadsheet size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Marketplace Bulk Editor
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {listings.length > 0 && (
              <>
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
                <ExportButton data={listings} sortField={sortField} sortDirection={sortDirection} />
              </>
            )}
          </div>
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
                  <DataTable
                    data={listings}
                    onUpdate={setListings}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={(field, direction) => {
                      setSortField(field);
                      setSortDirection(direction);
                    }}
                  />
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
