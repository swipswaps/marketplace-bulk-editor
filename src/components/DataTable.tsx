import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Copy, Eye, MoreVertical, X, ExternalLink } from 'lucide-react';
import type { MarketplaceListing } from '../types';

// Helper to generate search URLs for price comparison
const generateSearchUrls = (title: string) => {
  // Clean up title for search query - remove special chars, limit length
  const cleanTitle = title
    .replace(/[^\w\s]/g, ' ')  // Remove special characters
    .replace(/\s+/g, ' ')       // Collapse multiple spaces
    .trim()
    .slice(0, 80);              // Limit length for URL

  const encoded = encodeURIComponent(cleanTitle);

  return {
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encoded}&_sop=12`,  // Sort by price + shipping
    amazon: `https://www.amazon.com/s?k=${encoded}&s=price-asc-rank`, // Sort by price low to high
  };
};
import { CONDITIONS } from '../types';
import { validateListing } from '../utils/validation';

// Helper to check if a field was auto-filled during import
const isFieldAutoFilled = (listing: MarketplaceListing, fieldName: keyof MarketplaceListing): boolean => {
  return listing._autoFilled?.some(f => f.field === fieldName) || false;
};

// Helper to get auto-fill reason
const getAutoFillReason = (listing: MarketplaceListing, fieldName: keyof MarketplaceListing): string | undefined => {
  return listing._autoFilled?.find(f => f.field === fieldName)?.reason;
};

type SortField = keyof MarketplaceListing | null;
type SortDirection = 'asc' | 'desc' | null;

interface DataTableProps {
  data: MarketplaceListing[];
  onUpdate: (data: MarketplaceListing[]) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

export function DataTable({ data, onUpdate, sortField, sortDirection, onSortChange }: DataTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof MarketplaceListing } | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [priceDropdownPosition, setPriceDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [compareDropdown, setCompareDropdown] = useState<string | null>(null); // Track which listing has compare dropdown open
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    TITLE: true,
    PRICE: true,
    CONDITION: true,
    DESCRIPTION: true,
    CATEGORY: true,
    'OFFER SHIPPING': true,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ id: string; field: keyof MarketplaceListing } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [columnActionMenu, setColumnActionMenu] = useState<keyof MarketplaceListing | null>(null);
  const [bulkEditModal, setBulkEditModal] = useState<{
    show: boolean;
    field: keyof MarketplaceListing | null;
    scope: 'all' | 'selected';
    value: string;
  }>({ show: false, field: null, scope: 'all', value: '' });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    TITLE: 250,
    PRICE: 100,
    CONDITION: 150,
    DESCRIPTION: 300,
    CATEGORY: 180,
    'OFFER SHIPPING': 120,
  });
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number; colIndex: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPriceDropdown && priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setShowPriceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPriceDropdown]);

  // Extract unique values from all listings for autocomplete
  const uniqueCategories = Array.from(
    new Set(data.map(item => item.CATEGORY).filter(cat => cat && cat.trim() !== ''))
  ).sort();

  const uniqueTitles = Array.from(
    new Set(data.map(item => item.TITLE).filter(title => title && title.trim() !== ''))
  ).sort();

  const uniqueDescriptions = Array.from(
    new Set(data.map(item => item.DESCRIPTION).filter(desc => desc && desc.trim() !== ''))
  ).sort();

  const uniquePrices = Array.from(
    new Set(data.map(item => String(item.PRICE)).filter(price => price && price.trim() !== ''))
  ).sort((a, b) => Number(a) - Number(b));



  // Handle column resizing with mouse events
  useEffect(() => {
    if (!resizing) return;

    console.log('Starting resize for column:', resizing.column);

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(100, resizing.startWidth + delta); // Increased minimum from 80 to 100

      console.log('Resizing:', { delta, newWidth, clientX: e.clientX, startX: resizing.startX });

      setColumnWidths(prev => ({
        ...prev,
        [resizing.column]: newWidth
      }));

      // Also directly update the DOM for immediate visual feedback
      if (tableRef.current) {
        const colgroup = tableRef.current.querySelector('colgroup');
        if (colgroup) {
          const col = colgroup.children[resizing.colIndex] as HTMLElement;
          if (col) {
            col.style.width = `${newWidth}px`;
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Resize ended');
      setResizing(null);
    };

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    // Add listeners to document for better drag tracking
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [resizing]);

  const handleSort = (field: keyof MarketplaceListing) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        onSortChange(field, 'desc');
      } else if (sortDirection === 'desc') {
        onSortChange(null, null);
      }
    } else {
      onSortChange(field, 'asc');
    }
  };

  const handleCellUpdate = (id: string, field: keyof MarketplaceListing, value: string | number) => {
    const updatedData = data.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdate(updatedData);

    // Show save indicator
    setLastSaved(new Date().toLocaleTimeString());
    setTimeout(() => setLastSaved(null), 2000); // Hide after 2 seconds
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      onUpdate(data.filter(item => item.id !== id));
    }
  };

  const handleDuplicate = (id: string) => {
    const listingToDuplicate = data.find(item => item.id === id);
    if (listingToDuplicate) {
      const duplicatedListing: MarketplaceListing = {
        ...listingToDuplicate,
        id: crypto.randomUUID(),
      };
      onUpdate([...data, duplicatedListing]);

      // Show save indicator
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setLastSaved(null), 2000);
    }
  };

  const handleSelectAll = () => {
    console.log('☑️ Select All checkbox clicked');
    console.log(`📊 sortedData.length: ${sortedData.length}`);
    console.log(`📊 selectedRows.size: ${selectedRows.size}`);

    if (selectedRows.size === sortedData.length) {
      console.log('✅ Deselecting all rows');
      setSelectedRows(new Set());
    } else {
      const allIds = sortedData.map(item => item.id);
      console.log(`✅ Selecting all ${allIds.length} rows`);
      console.log(`📋 IDs: ${allIds.join(', ')}`);
      setSelectedRows(new Set(allIds));
    }
  };

  const handleBulkDelete = () => {
    console.log('🗑️ Bulk Delete button clicked');
    console.log(`📊 selectedRows.size: ${selectedRows.size}`);
    console.log(`📊 data.length: ${data.length}`);
    console.log(`📊 sortedData.length: ${sortedData.length}`);
    console.log(`📊 filteredData.length: ${filteredData.length}`);

    if (selectedRows.size === 0) {
      console.log('❌ No rows selected, returning');
      return;
    }

    console.log(`📋 Selected IDs: ${Array.from(selectedRows).join(', ')}`);

    // Check positioning of selected rows
    const selectedArray = Array.from(selectedRows);
    console.log('📍 Position analysis:');
    selectedArray.forEach(id => {
      const dataIndex = data.findIndex(item => item.id === id);
      const sortedIndex = sortedData.findIndex(item => item.id === id);
      const filteredIndex = filteredData.findIndex(item => item.id === id);
      console.log(`   ID ${id}: data[${dataIndex}], sortedData[${sortedIndex}], filteredData[${filteredIndex}]`);
    });

    const userConfirmed = confirm(`Delete ${selectedRows.size} selected listing(s)?`);
    console.log(`❓ User confirmed: ${userConfirmed}`);

    if (userConfirmed) {
      const updatedData = data.filter(item => !selectedRows.has(item.id));
      console.log(`✅ Filtered data: ${data.length} → ${updatedData.length} (deleted ${data.length - updatedData.length})`);

      onUpdate(updatedData);
      setSelectedRows(new Set());

      // Show save indicator
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setLastSaved(null), 2000);

      console.log('✅ Bulk delete completed');
    } else {
      console.log('❌ Bulk delete cancelled by user');
    }
  };

  const handleBulkEdit = (field: keyof MarketplaceListing, value: string | number) => {
    if (selectedRows.size === 0) return;

    const updatedData = data.map(item =>
      selectedRows.has(item.id) ? { ...item, [field]: value } : item
    );
    onUpdate(updatedData);

    // Show save indicator
    setLastSaved(new Date().toLocaleTimeString());
    setTimeout(() => setLastSaved(null), 2000);
  };

  const handleAdd = () => {
    const newListing: MarketplaceListing = {
      id: crypto.randomUUID(),
      TITLE: '',
      PRICE: 0,
      CONDITION: 'New',
      DESCRIPTION: '',
      CATEGORY: '',
      'OFFER SHIPPING': 'No'
    };
    onUpdate([...data, newListing]);
  };

  const handleRemoveEmptyRows = () => {
    const validListings = data.filter(listing => {
      const validation = validateListing(listing);
      // Keep listings that have at least TITLE, PRICE, and CONDITION filled
      return !validation.emptyTitle && !validation.zeroPrice && !validation.emptyCondition;
    });

    const removedCount = data.length - validListings.length;
    if (removedCount > 0) {
      if (confirm(`Remove ${removedCount} empty/invalid row(s)?`)) {
        onUpdate(validListings);
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setLastSaved(null), 2000);
      }
    } else {
      alert('No empty rows to remove!');
    }
  };

  const handleColumnBulkEdit = (field: keyof MarketplaceListing, scope: 'all' | 'selected') => {
    // Open modal for text/number fields
    if (field === 'TITLE' || field === 'DESCRIPTION' || field === 'CATEGORY' || field === 'PRICE') {
      setBulkEditModal({ show: true, field, scope, value: '' });
    }
    setColumnActionMenu(null);
  };

  const handleApplyBulkEdit = () => {
    if (!bulkEditModal.field) return;

    const { field, scope, value } = bulkEditModal;

    let updatedData: MarketplaceListing[];
    if (scope === 'all') {
      updatedData = data.map(item => ({ ...item, [field]: field === 'PRICE' ? Number(value) || 0 : value }));
    } else {
      updatedData = data.map(item =>
        selectedRows.has(item.id) ? { ...item, [field]: field === 'PRICE' ? Number(value) || 0 : value } : item
      );
    }

    onUpdate(updatedData);
    setBulkEditModal({ show: false, field: null, scope: 'all', value: '' });

    // Show save indicator
    setLastSaved(new Date().toLocaleTimeString());
    setTimeout(() => setLastSaved(null), 2000);
  };

  const handleClearColumn = (field: keyof MarketplaceListing, scope: 'all' | 'selected') => {
    const defaultValue = field === 'PRICE' ? 0 : '';

    let updatedData: MarketplaceListing[];
    if (scope === 'all') {
      if (confirm(`Clear all values in ${field} column?`)) {
        updatedData = data.map(item => ({ ...item, [field]: defaultValue }));
        onUpdate(updatedData);
      }
    } else {
      if (selectedRows.size === 0) {
        alert('No rows selected');
        return;
      }
      if (confirm(`Clear ${field} for ${selectedRows.size} selected row(s)?`)) {
        updatedData = data.map(item =>
          selectedRows.has(item.id) ? { ...item, [field]: defaultValue } : item
        );
        onUpdate(updatedData);
      }
    }

    setColumnActionMenu(null);
    setLastSaved(new Date().toLocaleTimeString());
    setTimeout(() => setLastSaved(null), 2000);
  };

  // Sort data
  // Filter data based on search query with fuzzy matching
  const filteredData = data.filter((listing) => {
    if (!searchQuery.trim()) return true;

    // Split search query into individual words
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);

    // Combine all searchable fields into one string
    const searchableText = [
      listing.TITLE || '',
      listing.DESCRIPTION || '',
      listing.CATEGORY || '',
      listing.CONDITION || '',
      String(listing.PRICE || ''),
      listing['OFFER SHIPPING'] || ''
    ].join(' ').toLowerCase();

    // Check if ALL search terms are found (word portions match)
    return searchTerms.every(term => searchableText.includes(term));
  });

  // Sort filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Close column action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (_e: MouseEvent) => {
      if (columnActionMenu) {
        setColumnActionMenu(null);
      }
    };

    if (columnActionMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [columnActionMenu]);

  // Close compare dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (_e: MouseEvent) => {
      if (compareDropdown) {
        setCompareDropdown(null);
      }
    };

    if (compareDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [compareDropdown]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation when not editing
      if (editingCell || !focusedCell || data.length === 0) return;

      const visibleFields = Object.keys(visibleColumns).filter(
        (field) => visibleColumns[field as keyof MarketplaceListing]
      ) as (keyof MarketplaceListing)[];

      const currentRowIndex = sortedData.findIndex((item) => item.id === focusedCell.id);
      const currentColIndex = visibleFields.indexOf(focusedCell.field);

      let newRowIndex = currentRowIndex;
      let newColIndex = currentColIndex;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRowIndex = Math.max(0, currentRowIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRowIndex = Math.min(sortedData.length - 1, currentRowIndex + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newColIndex = Math.max(0, currentColIndex - 1);
          break;
        case 'ArrowRight':
        case 'Tab':
          e.preventDefault();
          newColIndex = Math.min(visibleFields.length - 1, currentColIndex + 1);
          break;
        case 'Enter':
          e.preventDefault();
          setEditingCell(focusedCell);
          return;
        default:
          return;
      }

      const newRow = sortedData[newRowIndex];
      const newField = visibleFields[newColIndex];

      if (newRow && newField) {
        setFocusedCell({ id: newRow.id, field: newField });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, focusedCell, data, visibleColumns, sortedData]);

  return (
    <div id="data-table" className="overflow-x-auto">
      {/* Screen reader announcements for dynamic content */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {data.length} listing{data.length !== 1 ? 's' : ''} in table. {selectedRows.size > 0 ? `${selectedRows.size} selected.` : ''}
      </div>

      {/* Search and Actions Bar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm select-text"
          >
            <Plus size={16} />
            Add New Listing
          </button>

          <button
            onClick={handleRemoveEmptyRows}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shadow-sm select-text"
            title="Remove rows with missing required fields (TITLE, PRICE, CONDITION)"
          >
            <Trash2 size={16} />
            Remove Empty Rows
          </button>

          {/* Bulk Actions */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium select-text">
                {selectedRows.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors select-text"
              >
                <Trash2 size={14} />
                Delete
              </button>
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'New' || value === 'Used - Like New' || value === 'Used - Good' || value === 'Used - Fair') {
                    handleBulkEdit('CONDITION', value);
                  } else if (value === 'Yes' || value === 'No') {
                    handleBulkEdit('OFFER SHIPPING', value);
                  }
                  e.target.value = '';
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Bulk Edit...</option>
                <optgroup label="Condition">
                  <option value="New">Set to New</option>
                  <option value="Used - Like New">Set to Used - Like New</option>
                  <option value="Used - Good">Set to Used - Good</option>
                  <option value="Used - Fair">Set to Used - Fair</option>
                </optgroup>
                <optgroup label="Shipping">
                  <option value="Yes">Offer Shipping: Yes</option>
                  <option value="No">Offer Shipping: No</option>
                </optgroup>
              </select>
            </div>
          )}

          {/* Search box */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search listings... (supports multiple words)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search listings by title, description, category, condition, price, or shipping"
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors select-text"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Column visibility toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors select-text"
            >
              <Eye size={16} />
              Columns
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                <div className="p-2">
                  {Object.keys(visibleColumns).map((col) => {
                    const column = col as keyof MarketplaceListing;
                    return (
                      <label key={column} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[column]}
                          onChange={(e) => {
                            setVisibleColumns(prev => ({
                              ...prev,
                              [column]: e.target.checked
                            }));
                          }}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{column}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Results count */}
          {searchQuery && (
            <div className={`text-sm font-medium ${
              filteredData.length === 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {filteredData.length === 0
                ? 'No results found'
                : `${filteredData.length} of ${data.length} listings`
              }
            </div>
          )}
        </div>

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-green-600 animate-fade-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Saved at {lastSaved}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table ref={tableRef} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
          <caption className="sr-only">Marketplace listings table with {sortedData.length} items</caption>
          <colgroup>
            <col style={{ width: '50px' }} />
            {[
              { field: 'TITLE' as keyof MarketplaceListing },
              { field: 'PRICE' as keyof MarketplaceListing },
              { field: 'CONDITION' as keyof MarketplaceListing },
              { field: 'DESCRIPTION' as keyof MarketplaceListing },
              { field: 'CATEGORY' as keyof MarketplaceListing },
              { field: 'OFFER SHIPPING' as keyof MarketplaceListing },
            ].filter(({ field }) => visibleColumns[field]).map(({ field }) => (
              <col key={field} style={{ width: `${columnWidths[field]}px` }} />
            ))}
            <col style={{ width: '100px' }} />
          </colgroup>
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100 border-b dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {[
                { field: 'TITLE' as keyof MarketplaceListing, label: 'Title' },
                { field: 'PRICE' as keyof MarketplaceListing, label: 'Price' },
                { field: 'CONDITION' as keyof MarketplaceListing, label: 'Condition' },
                { field: 'DESCRIPTION' as keyof MarketplaceListing, label: 'Description' },
                { field: 'CATEGORY' as keyof MarketplaceListing, label: 'Category' },
                { field: 'OFFER SHIPPING' as keyof MarketplaceListing, label: 'Shipping' },
              ].filter(({ field }) => visibleColumns[field]).map(({ field, label }, colIndex) => (
                <th
                  key={field}
                  className={`border-b dark:border-gray-600 text-left font-medium select-none ${
                    sortField === field ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  style={{ position: 'relative', padding: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Sortable header content */}
                    <div
                      className={`flex items-center gap-1 cursor-pointer px-4 py-2 ${
                        sortField === field ? 'font-semibold' : 'hover:text-blue-600'
                      }`}
                      style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
                      onClick={() => handleSort(field)}
                    >
                      <span className="truncate">{label}</span>
                      {sortField === field ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp size={14} className="text-blue-600 flex-shrink-0" />
                        ) : (
                          <ArrowDown size={14} className="text-blue-600 flex-shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="text-gray-400 flex-shrink-0" />
                      )}
                    </div>

                    {/* Column Action Menu Button */}
                    <div className="relative flex items-center px-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setColumnActionMenu(columnActionMenu === field ? null : field);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors select-text"
                        aria-label={`Column actions for ${field}`}
                        aria-expanded={columnActionMenu === field}
                        aria-haspopup="menu"
                      >
                        <MoreVertical size={14} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
                      </button>

                      {/* Dropdown Menu */}
                      {columnActionMenu === field && (
                        <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                          <div className="py-1">
                            {/* Edit All Rows */}
                            {(field === 'TITLE' || field === 'DESCRIPTION' || field === 'CATEGORY' || field === 'PRICE') && (
                              <button
                                onClick={() => handleColumnBulkEdit(field, 'all')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 select-text"
                              >
                                Edit all rows...
                              </button>
                            )}

                            {/* Edit Selected Rows */}
                            {(field === 'TITLE' || field === 'DESCRIPTION' || field === 'CATEGORY' || field === 'PRICE') && (
                              <button
                                onClick={() => handleColumnBulkEdit(field, 'selected')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 select-text"
                                disabled={selectedRows.size === 0}
                              >
                                Edit selected rows... {selectedRows.size > 0 && `(${selectedRows.size})`}
                              </button>
                            )}

                            {/* Divider */}
                            {(field === 'TITLE' || field === 'DESCRIPTION' || field === 'CATEGORY' || field === 'PRICE') && (
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            )}

                            {/* Clear All */}
                            <button
                              onClick={() => handleClearColumn(field, 'all')}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 select-text"
                            >
                              Clear all values
                            </button>

                            {/* Clear Selected */}
                            <button
                              onClick={() => handleClearColumn(field, 'selected')}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 select-text"
                              disabled={selectedRows.size === 0}
                            >
                              Clear selected {selectedRows.size > 0 && `(${selectedRows.size})`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resize handle - separate from sort area */}
                    <div
                      className="cursor-col-resize hover:bg-blue-300"
                      style={{
                        width: '16px',
                        background: resizing?.column === field ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                        borderLeft: '2px solid #3b82f6',
                        flexShrink: 0,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🎯 Resize handle mousedown', field, 'colIndex:', colIndex);
                        setResizing({
                          column: field,
                          startX: e.clientX,
                          startWidth: columnWidths[field],
                          colIndex: colIndex,
                        });
                      }}
                      title="Drag to resize column"
                    />
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="px-4 py-12 text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? (
                      <div>
                        <p className="text-lg font-medium mb-2">No results found</p>
                        <p className="text-sm">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium mb-2">No listings yet</p>
                        <p className="text-sm">Click "Add Row" to create your first listing</p>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : sortedData.map((listing) => (
              <tr key={listing.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-150">
                {/* Checkbox */}
                <td className="px-4 py-2 border-b dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(listing.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedRows);
                      if (e.target.checked) {
                        newSelected.add(listing.id);
                      } else {
                        newSelected.delete(listing.id);
                      }
                      setSelectedRows(newSelected);
                    }}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </td>

                {/* Title */}
                {visibleColumns.TITLE && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'TITLE' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  } ${
                    validateListing(listing).emptyTitle ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500' : ''
                  }`}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'TITLE' });
                    setEditingCell({ id: listing.id, field: 'TITLE' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'TITLE' ? (
                    <div>
                      <input
                        type="text"
                        list="title-suggestions"
                        value={listing.TITLE}
                        onChange={(e) => handleCellUpdate(listing.id, 'TITLE', e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingCell(null);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        maxLength={150}
                        className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                        autoFocus
                      />
                      <div className={`text-xs mt-1 ${
                        listing.TITLE.length > 140
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : listing.TITLE.length > 120
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {listing.TITLE.length}/150 characters
                      </div>
                    </div>
                  ) : (
                    <div className="line-clamp-2" title={listing.TITLE}>{listing.TITLE || <span className="text-gray-400 dark:text-gray-500">Click to edit</span>}</div>
                  )}
                </td>}

                {/* Price */}
                {visibleColumns.PRICE && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'PRICE' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  } ${
                    validateListing(listing).zeroPrice ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500' : ''
                  } ${
                    isFieldAutoFilled(listing, 'PRICE') ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500' : ''
                  }`}
                  title={isFieldAutoFilled(listing, 'PRICE') ? `⚠️ Auto-filled: ${getAutoFillReason(listing, 'PRICE')}` : undefined}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'PRICE' });
                    setEditingCell({ id: listing.id, field: 'PRICE' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'PRICE' ? (
                    <div className="relative" ref={priceDropdownRef}>
                      <input
                        ref={priceInputRef}
                        type="text"
                        value={listing.PRICE}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow positive integers (digits only)
                          const digitsOnly = value.replace(/\D/g, '');
                          // Remove leading zeros (e.g., "01" becomes "1", "002" becomes "2")
                          const cleanedValue = digitsOnly.replace(/^0+(?=\d)/, '');
                          handleCellUpdate(listing.id, 'PRICE', cleanedValue || '0');
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPriceDropdownPosition({
                            top: rect.bottom + window.scrollY,
                            left: rect.left + window.scrollX,
                            width: rect.width
                          });
                          setShowPriceDropdown(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setShowPriceDropdown(false);
                            setEditingCell(null);
                          } else if (e.key === 'Escape') {
                            setShowPriceDropdown(false);
                            setEditingCell(null);
                          }
                        }}
                        className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                        autoFocus
                      />
                      {/* Dropdown appears right below the input */}
                      {showPriceDropdown && uniquePrices.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded shadow-2xl max-h-48 overflow-y-auto z-50">
                          {uniquePrices.map((price, index) => (
                            <div
                              key={index}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleCellUpdate(listing.id, 'PRICE', price);
                                setShowPriceDropdown(false);
                              }}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 last:border-b-0"
                            >
                              {price}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="font-medium">${Number(listing.PRICE || 0).toFixed(2)}</div>
                  )}
                </td>}

                {/* Condition */}
                {visibleColumns.CONDITION && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'CONDITION' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  } ${
                    validateListing(listing).emptyCondition || validateListing(listing).invalidCondition ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-500' : ''
                  } ${
                    isFieldAutoFilled(listing, 'CONDITION') ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500' : ''
                  }`}
                  title={isFieldAutoFilled(listing, 'CONDITION') ? `⚠️ Auto-filled: ${getAutoFillReason(listing, 'CONDITION')}` : undefined}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'CONDITION' });
                    setEditingCell({ id: listing.id, field: 'CONDITION' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'CONDITION' ? (
                    <select
                      value={listing.CONDITION}
                      onChange={(e) => {
                        handleCellUpdate(listing.id, 'CONDITION', e.target.value);
                        setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                      className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    >
                      {CONDITIONS.map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      listing.CONDITION === 'New'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : listing.CONDITION === 'Used - Like New'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : listing.CONDITION === 'Used - Good'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    }`}>
                      {listing.CONDITION}
                    </div>
                  )}
                </td>}

                {/* Description */}
                {visibleColumns.DESCRIPTION && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'DESCRIPTION' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  } ${
                    isFieldAutoFilled(listing, 'DESCRIPTION') ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500' : ''
                  }`}
                  title={isFieldAutoFilled(listing, 'DESCRIPTION') ? `⚠️ Auto-filled: ${getAutoFillReason(listing, 'DESCRIPTION')}` : undefined}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'DESCRIPTION' });
                    setEditingCell({ id: listing.id, field: 'DESCRIPTION' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'DESCRIPTION' ? (
                    <>
                      <textarea
                        value={listing.DESCRIPTION}
                        onChange={(e) => {
                          handleCellUpdate(listing.id, 'DESCRIPTION', e.target.value);
                          // Auto-resize textarea
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setEditingCell(null);
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        maxLength={5000}
                        className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
                        style={{ minHeight: '60px' }}
                        autoComplete="off"
                        autoFocus
                        onFocus={(e) => {
                          // Auto-resize on focus
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                      />
                      <datalist id="description-suggestions">
                        {uniqueDescriptions.map((desc, index) => (
                          <option key={index} value={desc} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <div className="line-clamp-3 whitespace-pre-wrap" title={listing.DESCRIPTION}>{listing.DESCRIPTION || <span className="text-gray-400 dark:text-gray-500">Click to edit</span>}</div>
                  )}
                </td>}

                {/* Category */}
                {visibleColumns.CATEGORY && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'CATEGORY' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  } ${
                    isFieldAutoFilled(listing, 'CATEGORY') ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500' : ''
                  }`}
                  title={isFieldAutoFilled(listing, 'CATEGORY') ? `⚠️ Auto-filled: ${getAutoFillReason(listing, 'CATEGORY')}` : undefined}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'CATEGORY' });
                    setEditingCell({ id: listing.id, field: 'CATEGORY' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'CATEGORY' ? (
                    <input
                      type="text"
                      list="category-suggestions"
                      value={listing.CATEGORY}
                      onChange={(e) => handleCellUpdate(listing.id, 'CATEGORY', e.target.value)}
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingCell(null);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Home & Garden"
                      autoComplete="off"
                      autoFocus
                    />
                  ) : (
                    <div className="truncate" title={listing.CATEGORY}>{listing.CATEGORY || <span className="text-gray-400 dark:text-gray-500">Click to edit</span>}</div>
                  )}
                </td>}

                {/* Offer Shipping */}
                {visibleColumns['OFFER SHIPPING'] && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'OFFER SHIPPING' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  } ${
                    isFieldAutoFilled(listing, 'OFFER SHIPPING') ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500' : ''
                  }`}
                  title={isFieldAutoFilled(listing, 'OFFER SHIPPING') ? `⚠️ Auto-filled: ${getAutoFillReason(listing, 'OFFER SHIPPING')}` : undefined}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'OFFER SHIPPING' });
                    setEditingCell({ id: listing.id, field: 'OFFER SHIPPING' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'OFFER SHIPPING' ? (
                    <select
                      value={listing['OFFER SHIPPING']}
                      onChange={(e) => {
                        handleCellUpdate(listing.id, 'OFFER SHIPPING', e.target.value);
                        setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                      className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      listing['OFFER SHIPPING'] === 'Yes'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {listing['OFFER SHIPPING']}
                    </div>
                  )}
                </td>}

                {/* Actions */}
                <td className="px-4 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(listing.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded select-text"
                      title="Duplicate"
                      aria-label={`Duplicate listing: ${listing.TITLE}`}
                    >
                      <Copy size={18} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded select-text"
                      title="Delete"
                      aria-label={`Delete listing: ${listing.TITLE}`}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                    {/* Compare Prices Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setCompareDropdown(compareDropdown === listing.id ? null : listing.id)}
                        className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded select-text"
                        title="Compare Prices on eBay & Amazon"
                        aria-label={`Compare prices for: ${listing.TITLE}`}
                        aria-expanded={compareDropdown === listing.id}
                        aria-haspopup="menu"
                      >
                        <ExternalLink size={18} aria-hidden="true" />
                      </button>
                      {compareDropdown === listing.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                          <div className="py-1">
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                              Compare Prices
                            </div>
                            <a
                              href={generateSearchUrls(listing.TITLE || '').ebay}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCompareDropdown(null)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <span className="w-5 h-5 flex items-center justify-center bg-yellow-400 text-black font-bold text-xs rounded">e</span>
                              Search on eBay
                            </a>
                            <a
                              href={generateSearchUrls(listing.TITLE || '').amazon}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setCompareDropdown(null)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <span className="w-5 h-5 flex items-center justify-center bg-orange-500 text-white font-bold text-xs rounded">a</span>
                              Search on Amazon
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Datalists for autocomplete */}
      <datalist id="title-suggestions">
        {uniqueTitles.map((title, index) => (
          <option key={index} value={title} />
        ))}
      </datalist>

      <datalist id="category-suggestions">
        {uniqueCategories.map((category, index) => (
          <option key={index} value={category} />
        ))}
      </datalist>



      {/* Bulk Edit Modal */}
      {bulkEditModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Bulk Edit: {bulkEditModal.field}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {bulkEditModal.scope === 'all'
                  ? `This will update all ${data.length} rows`
                  : `This will update ${selectedRows.size} selected row(s)`
                }
              </p>

              {bulkEditModal.field === 'PRICE' ? (
                <input
                  type="number"
                  value={bulkEditModal.value}
                  onChange={(e) => setBulkEditModal({ ...bulkEditModal, value: e.target.value })}
                  placeholder="Enter price"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : bulkEditModal.field === 'DESCRIPTION' ? (
                <textarea
                  value={bulkEditModal.value}
                  onChange={(e) => setBulkEditModal({ ...bulkEditModal, value: e.target.value })}
                  placeholder={`Enter ${bulkEditModal.field?.toLowerCase()}`}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={bulkEditModal.value}
                  onChange={(e) => setBulkEditModal({ ...bulkEditModal, value: e.target.value })}
                  placeholder={`Enter ${bulkEditModal.field?.toLowerCase()}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleApplyBulkEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium select-text"
                >
                  Apply
                </button>
                <button
                  onClick={() => setBulkEditModal({ show: false, field: null, scope: 'all', value: '' })}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium select-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <div className="mt-4 border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 select-text"
        >
          {showDebugPanel ? '▼' : '▶'} Debug Logs
        </button>

        {showDebugPanel && (
          <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <textarea
              readOnly
              value={`=== DEBUG LOGS ===

ALL PRICES:
${JSON.stringify(data.map(item => item.PRICE), null, 2)}

FILTERED PRICES (after String conversion and trim):
${JSON.stringify(data.map(item => String(item.PRICE)).filter(price => price && price.trim() !== ''), null, 2)}

UNIQUE PRICES (should appear in dropdown):
${JSON.stringify(uniquePrices, null, 2)}

UNIQUE CATEGORIES:
${JSON.stringify(uniqueCategories, null, 2)}

DATALIST OPTIONS BEING RENDERED:
${uniquePrices.map((price, index) => `<option key="${index}" value="${price}" />`).join('\n')}

DATA SAMPLE (first 3 items):
${JSON.stringify(data.slice(0, 3).map(item => ({ id: item.id, PRICE: item.PRICE, CATEGORY: item.CATEGORY, priceType: typeof item.PRICE })), null, 2)}

CUSTOM DROPDOWN STATE:
showPriceDropdown: ${showPriceDropdown}
priceDropdownPosition: ${JSON.stringify(priceDropdownPosition, null, 2)}
uniquePrices.length: ${uniquePrices.length}
Should show dropdown: ${showPriceDropdown && priceDropdownPosition && uniquePrices.length > 0}
`}
              className="w-full h-96 p-2 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border dark:border-gray-600 rounded"
            />
          </div>
        )}
      </div>


    </div>
  );
}

