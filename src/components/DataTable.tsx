import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      onUpdate(data.filter(item => item.id !== id));
    }
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
  const sortedData = [...data].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === bVal) return 0;

    const comparison = aVal < bVal ? -1 : 1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add New Listing
        </button>
      </div>

      <div className="overflow-x-auto">
        <table ref={tableRef} className="bg-white border border-gray-300 text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            {[
              { field: 'TITLE' as keyof MarketplaceListing },
              { field: 'PRICE' as keyof MarketplaceListing },
              { field: 'CONDITION' as keyof MarketplaceListing },
              { field: 'DESCRIPTION' as keyof MarketplaceListing },
              { field: 'CATEGORY' as keyof MarketplaceListing },
              { field: 'OFFER SHIPPING' as keyof MarketplaceListing },
            ].map(({ field }) => (
              <col key={field} style={{ width: `${columnWidths[field]}px` }} />
            ))}
            <col style={{ width: '100px' }} />
          </colgroup>
          <thead className="bg-gray-100">
            <tr>
              {[
                { field: 'TITLE' as keyof MarketplaceListing, label: 'Title' },
                { field: 'PRICE' as keyof MarketplaceListing, label: 'Price' },
                { field: 'CONDITION' as keyof MarketplaceListing, label: 'Condition' },
                { field: 'DESCRIPTION' as keyof MarketplaceListing, label: 'Description' },
                { field: 'CATEGORY' as keyof MarketplaceListing, label: 'Category' },
                { field: 'OFFER SHIPPING' as keyof MarketplaceListing, label: 'Shipping' },
              ].map(({ field, label }, colIndex) => (
                <th
                  key={field}
                  className="border-b text-left font-medium text-gray-700 select-none"
                  style={{ position: 'relative', padding: 0 }}
                >
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Sortable header content */}
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:text-blue-600 px-4 py-2"
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
              <tr key={listing.id} className="hover:bg-gray-50">
                {/* Title */}
                <td
                  className="px-4 py-2 border-b cursor-text"
                  onClick={() => setEditingCell({ id: listing.id, field: 'TITLE' })}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'TITLE' ? (
                    <input
                      type="text"
                      list="title-suggestions"
                      value={listing.TITLE}
                      onChange={(e) => handleCellUpdate(listing.id, 'TITLE', e.target.value)}
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingCell(null);
                        }
                      }}
                      maxLength={150}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoComplete="off"
                      autoFocus
                    />
                  ) : (
                    <div className="truncate" title={listing.TITLE}>{listing.TITLE || <span className="text-gray-400">Click to edit</span>}</div>
                  )}
                </td>

                {/* Price */}
                <td
                  className="px-4 py-2 border-b cursor-text"
                  onClick={() => setEditingCell({ id: listing.id, field: 'PRICE' })}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'PRICE' ? (
                    <input
                      type="number"
                      value={listing.PRICE}
                      onChange={(e) => handleCellUpdate(listing.id, 'PRICE', parseFloat(e.target.value) || 0)}
                      onBlur={() => setEditingCell(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingCell(null);
                        }
                      }}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div>${typeof listing.PRICE === 'number' ? listing.PRICE.toFixed(2) : listing.PRICE}</div>
                  )}
                </td>

                {/* Condition */}
                <td
                  className="px-4 py-2 border-b cursor-pointer"
                  onClick={() => setEditingCell({ id: listing.id, field: 'CONDITION' })}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'CONDITION' ? (
                    <select
                      value={listing.CONDITION}
                      onChange={(e) => {
                        handleCellUpdate(listing.id, 'CONDITION', e.target.value);
                        setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    >
                      {CONDITIONS.map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                  ) : (
                    <div>{listing.CONDITION}</div>
                  )}
                </td>

                {/* Description */}
                <td
                  className="px-4 py-2 border-b cursor-text"
                  onClick={() => setEditingCell({ id: listing.id, field: 'DESCRIPTION' })}
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
                          }
                        }}
                        maxLength={5000}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
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
                    <div className="whitespace-pre-wrap" title={listing.DESCRIPTION}>{listing.DESCRIPTION || <span className="text-gray-400">Click to edit</span>}</div>
                  )}
                </td>

                {/* Category */}
                <td
                  className="px-4 py-2 border-b cursor-text"
                  onClick={() => setEditingCell({ id: listing.id, field: 'CATEGORY' })}
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
                        }
                      }}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. Home & Garden"
                      autoComplete="off"
                      autoFocus
                    />
                  ) : (
                    <div className="truncate" title={listing.CATEGORY}>{listing.CATEGORY || <span className="text-gray-400">Click to edit</span>}</div>
                  )}
                </td>

                {/* Offer Shipping */}
                <td
                  className="px-4 py-2 border-b cursor-pointer"
                  onClick={() => setEditingCell({ id: listing.id, field: 'OFFER SHIPPING' })}
                >
                  {editingCell?.id === listing.id && editingCell?.field === 'OFFER SHIPPING' ? (
                    <select
                      value={listing['OFFER SHIPPING']}
                      onChange={(e) => {
                        handleCellUpdate(listing.id, 'OFFER SHIPPING', e.target.value);
                        setEditingCell(null);
                      }}
                      onBlur={() => setEditingCell(null)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <div>{listing['OFFER SHIPPING']}</div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
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
    </div>
  );
}

