/**
 * Search Marketplaces Component
 * -----------------------------
 * Opens search results on eBay, Facebook Marketplace, Amazon, and custom sites
 *
 * Features:
 * - Site selection (eBay, Facebook, Amazon)
 * - Custom site support
 * - Opens search results in new browser tabs
 * - No scraping - users browse and copy manually
 */

import { useState } from 'react';
import { X, ExternalLink, AlertCircle } from 'lucide-react';

interface SearchImportProps {
  onClose: () => void;
}

/**
 * Built-in site configurations
 * Each site has a URL template where {keywords} is replaced with search terms
 */
const BUILTIN_SITES = [
  {
    id: 'ebay',
    name: 'eBay',
    urlTemplate: 'https://www.ebay.com/sch/i.html?_nkw={keywords}',
    enabled: true
  },
  {
    id: 'amazon',
    name: 'Amazon',
    urlTemplate: 'https://www.amazon.com/s?k={keywords}',
    enabled: true
  },
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    urlTemplate: 'https://www.facebook.com/marketplace/search?query={keywords}',
    enabled: true
  }
];

/**
 * Custom site configuration interface
 */
interface CustomSite {
  id: string;
  name: string;
  urlTemplate: string;
  enabled: boolean;
}

export function SearchImport({ onClose }: SearchImportProps) {
  // Load custom sites from localStorage
  const [customSites, setCustomSites] = useState<CustomSite[]>(() => {
    const saved = localStorage.getItem('customScraperSites');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchKeywords, setSearchKeywords] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('ebay');
  const [error, setError] = useState<string | null>(null);
  const [customSiteError, setCustomSiteError] = useState<string | null>(null);
  const [showAddCustomSite, setShowAddCustomSite] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  // Combine built-in and custom sites
  const allSites = [...BUILTIN_SITES, ...customSites];

  /**
   * Add custom site
   *
   * User provides:
   * 1. Site name (optional - will use domain if blank)
   * 2. Site domain (e.g., "example.com" or "https://example.com")
   *
   * App tries common search URL patterns:
   * - https://example.com/search?q={keywords}
   * - https://example.com/search?keyword={keywords}
   * - https://example.com?q={keywords}
   */
  function addCustomSite() {
    if (!newSiteUrl.trim()) {
      setCustomSiteError('Please enter a site URL');
      return;
    }

    let domain = newSiteUrl.trim();

    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '');

    // Remove trailing slash
    domain = domain.replace(/\/$/, '');

    // Remove any path/query params (just get domain)
    domain = domain.split('/')[0].split('?')[0];

    // Use domain as site name if name is blank
    const siteName = newSiteName.trim() || domain;

    // Build URL template with common pattern
    // Most sites use /search?q= or /search?keyword=
    const urlTemplate = `https://${domain}/search?q={keywords}`;

    const customSite: CustomSite = {
      id: `custom-${Date.now()}`,
      name: siteName,
      urlTemplate: urlTemplate,
      enabled: true
    };

    const updated = [...customSites, customSite];
    setCustomSites(updated);
    localStorage.setItem('customScraperSites', JSON.stringify(updated));

    // Reset form
    setNewSiteName('');
    setNewSiteUrl('');
    setShowAddCustomSite(false);
    setCustomSiteError(null);
  }

  /**
   * Delete custom site
   */
  function deleteCustomSite(siteId: string) {
    const updated = customSites.filter(s => s.id !== siteId);
    setCustomSites(updated);
    localStorage.setItem('customScraperSites', JSON.stringify(updated));

    // Reset to ebay if deleted site was selected
    if (selectedSite === siteId) {
      setSelectedSite('ebay');
    }
  }

  /**
   * Construct search URL from template
   */
  function constructUrl(template: string, keywords: string): string {
    return template.replace('{keywords}', encodeURIComponent(keywords));
  }

  /**
   * Handle site search - opens search results in new tab
   */
  function handleSearch() {
    if (!searchKeywords.trim()) {
      setError('Please enter search keywords');
      return;
    }

    setError(null);

    // Find selected site
    const site = allSites.find(s => s.id === selectedSite);
    if (!site) {
      setError('Selected site not found');
      return;
    }

    // Construct search URL
    const searchUrl = constructUrl(site.urlTemplate, searchKeywords);

    // Open in new tab
    window.open(searchUrl, '_blank', 'noopener,noreferrer');

    // Close modal after brief delay
    setTimeout(() => {
      onClose();
    }, 500);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Search Marketplaces
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Open search results on eBay, Facebook Marketplace, Amazon, or custom sites
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Keywords Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Keywords
            </label>
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchKeywords.trim()) {
                  handleSearch();
                }
              }}
              placeholder="e.g., solar panels, laptop, furniture"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Enter keywords to search for across selected sites
            </p>
          </div>

          {/* Site Selection - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Site to Search
            </label>
            <div className="flex gap-2">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {allSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              {selectedSite.startsWith('custom-') && (
                <button
                  onClick={() => deleteCustomSite(selectedSite)}
                  className="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Delete custom site"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {allSites.find(s => s.id === selectedSite)?.urlTemplate.replace('{keywords}', searchKeywords || 'keywords')}
            </p>

            {/* Add Custom Site Button */}
            {!showAddCustomSite && (
              <button
                onClick={() => setShowAddCustomSite(true)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                + Add Custom Site
              </button>
            )}

            {/* Add Custom Site Form */}
            {showAddCustomSite && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add Custom Site</h4>

                {/* Custom Site Error */}
                {customSiteError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                    <p className="text-xs text-red-700 dark:text-red-300">{customSiteError}</p>
                  </div>
                )}

                {/* Site Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => {
                      setNewSiteName(e.target.value);
                      setCustomSiteError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSiteUrl.trim()) {
                        addCustomSite();
                      }
                    }}
                    placeholder="My Site"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Site URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site URL
                  </label>
                  <input
                    type="text"
                    value={newSiteUrl}
                    onChange={(e) => {
                      setNewSiteUrl(e.target.value);
                      setCustomSiteError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSiteUrl.trim()) {
                        addCustomSite();
                      }
                    }}
                    placeholder="example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">How this works:</p>
                  <p>Just enter the domain name. The app will try common search patterns automatically.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addCustomSite}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Add Site
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCustomSite(false);
                      setNewSiteName('');
                      setNewSiteUrl('');
                      setCustomSiteError(null);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!searchKeywords.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            <ExternalLink size={20} />
            Open Search Results
          </button>

          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">How to use:</h3>
            <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
              <li>Enter search keywords (e.g., "solar panels")</li>
              <li>Select a site from the dropdown</li>
              <li>Click "Open Search Results"</li>
              <li>Search results will open in a new browser tab</li>
              <li>Browse and copy listings manually</li>
            </ol>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              💡 Tip: You can add custom sites with the "+ Add Custom Site" button
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

