import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Copy, Eye, EyeOff } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { CONDITIONS } from '../types';

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
  const [visibleColumns, setVisibleColumns] = useState<Record<keyof MarketplaceListing, boolean>>({
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
    new Set(data.map(item => {
      const price = typeof item.PRICE === 'number' ? item.PRICE : parseFloat(item.PRICE);
      return !isNaN(price) && price > 0 ? price : null;
    }).filter(price => price !== null))
  ).sort((a, b) => (a as number) - (b as number));

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

  const handleCellUpdate = (id: string, field: keyof MarketplaceListing, value: any) => {
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
    if (selectedRows.size === sortedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedData.map(item => item.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return;

    if (confirm(`Delete ${selectedRows.size} selected listing(s)?`)) {
      const updatedData = data.filter(item => !selectedRows.has(item.id));
      onUpdate(updatedData);
      setSelectedRows(new Set());

      // Show save indicator
      setLastSaved(new Date().toLocaleTimeString());
      setTimeout(() => setLastSaved(null), 2000);
    }
  };

  const handleBulkEdit = (field: keyof MarketplaceListing, value: any) => {
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

  // Sort data
  // Filter data based on search query
  const filteredData = data.filter((listing) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      listing.TITLE.toLowerCase().includes(query) ||
      listing.DESCRIPTION.toLowerCase().includes(query) ||
      listing.CATEGORY.toLowerCase().includes(query) ||
      listing.CONDITION.toLowerCase().includes(query) ||
      String(listing.PRICE).includes(query) ||
      listing['OFFER SHIPPING'].toLowerCase().includes(query)
    );
  });

  // Sort filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

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
    <div className="overflow-x-auto">
      {/* Search and Actions Bar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add New Listing
          </button>

          {/* Bulk Actions */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {selectedRows.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
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
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Column visibility toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
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
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredData.length} of {data.length} listings
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
                      className={`flex items-center gap-2 cursor-pointer px-4 py-2 ${
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
            {sortedData.map((listing) => (
              <tr key={listing.id} className="hover:bg-blue-50 dark:hover:bg-gray-700 hover:shadow-sm transition-colors">
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
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {listing.TITLE.length}/150 characters
                      </div>
                    </div>
                  ) : (
                    <div className="truncate" title={listing.TITLE}>{listing.TITLE || <span className="text-gray-400 dark:text-gray-500">Click to edit</span>}</div>
                  )}
                </td>}

                {/* Price */}
                {visibleColumns.PRICE && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'PRICE' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'PRICE' });
                    setEditingCell({ id: listing.id, field: 'PRICE' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'PRICE' ? (
                    <input
                      type="text"
                      list="price-suggestions"
                      value={listing.PRICE}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Remove leading zeros while typing (except for "0" or "0.")
                        const cleanedValue = value.replace(/^0+(?=\d)/, '');
                        // Parse to number, or keep as string if it's a partial input like "1."
                        const numValue = cleanedValue === '' ? 0 : (cleanedValue.endsWith('.') ? cleanedValue : (parseFloat(cleanedValue) || 0));
                        handleCellUpdate(listing.id, 'PRICE', numValue);
                      }}
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingCell(null);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div>${typeof listing.PRICE === 'number' ? listing.PRICE.toFixed(2) : listing.PRICE}</div>
                  )}
                </td>}

                {/* Condition */}
                {visibleColumns.CONDITION && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-pointer text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'CONDITION' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
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
                    <div>{listing.CONDITION}</div>
                  )}
                </td>}

                {/* Description */}
                {visibleColumns.DESCRIPTION && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'DESCRIPTION' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                  onClick={() => {
                    setFocusedCell({ id: listing.id, field: 'DESCRIPTION' });
                    setEditingCell({ id: listing.id, field: 'DESCRIPTION' });
                  }}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'DESCRIPTION' ? (
                    <>
                      <textarea
                        list="description-suggestions"
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
                    <div className="whitespace-pre-wrap" title={listing.DESCRIPTION}>{listing.DESCRIPTION || <span className="text-gray-400 dark:text-gray-500">Click to edit</span>}</div>
                  )}
                </td>}

                {/* Category */}
                {visibleColumns.CATEGORY && <td
                  className={`px-4 py-2 border-b dark:border-gray-700 cursor-text text-gray-900 dark:text-gray-100 ${
                    focusedCell?.id === listing.id && focusedCell?.field === 'CATEGORY' ? 'ring-2 ring-blue-500 ring-inset' : ''
                  }`}
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
                  }`}
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
                    <div>{listing['OFFER SHIPPING']}</div>
                  )}
                </td>}

                {/* Actions */}
                <td className="px-4 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(listing.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
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

      <datalist id="price-suggestions">
        {uniquePrices.map((price, index) => (
          <option key={index} value={price as number} />
        ))}
      </datalist>
    </div>
  );
}

