import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { ExportButton } from './components/ExportButton';
import { TemplateUpload } from './components/TemplateUpload';
import { Moon, Sun } from 'lucide-react';
import type { MarketplaceListing, TemplateMetadata } from './types';
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
  const [template, setTemplate] = useState<TemplateMetadata | null>(() => {
    const saved = localStorage.getItem('fbTemplate');
    return saved ? JSON.parse(saved) : null;
  });

  // Undo/Redo state
  const [history, setHistory] = useState<MarketplaceListing[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save template to localStorage
  useEffect(() => {
    if (template) {
      localStorage.setItem('fbTemplate', JSON.stringify(template));
    } else {
      localStorage.removeItem('fbTemplate');
    }
  }, [template]);

  const handleTemplateLoad = (newTemplate: TemplateMetadata) => {
    setTemplate(newTemplate);
  };

  const handleDataLoaded = (newData: MarketplaceListing[]) => {
    // Merge with existing data
    const updatedListings = [...listings, ...newData];
    console.log(`📊 Data loaded: ${newData.length} new listings + ${listings.length} existing = ${updatedListings.length} total`);
    updateListingsWithHistory(updatedListings);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all listings?')) {
      updateListingsWithHistory([]);
    }
  };

  // Update listings and add to history
  const updateListingsWithHistory = (newListings: MarketplaceListing[]) => {
    // Truncate history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);

    // Add new state to history (keep last 50 states)
    newHistory.push(newListings);
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setListings(newListings);
  };

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setListings(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setListings(history[newIndex]);
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, handleUndo, handleRedo]);

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
            {/* Undo/Redo Buttons */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6"/>
                  <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                </svg>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6"/>
                  <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
                </svg>
              </button>
            </div>

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
                <ExportButton data={listings} sortField={sortField} sortDirection={sortDirection} template={template} />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Template Upload Section */}
          <div className="mb-6">
            <TemplateUpload onTemplateLoad={handleTemplateLoad} currentTemplate={template} />
          </div>

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
                    onUpdate={updateListingsWithHistory}
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
