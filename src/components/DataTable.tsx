import { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { CONDITIONS } from '../types';

interface DataTableProps {
  data: MarketplaceListing[];
  onUpdate: (data: MarketplaceListing[]) => void;
}

type SortField = keyof MarketplaceListing | null;
type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, onUpdate }: DataTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof MarketplaceListing } | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    TITLE: 250,
    PRICE: 100,
    CONDITION: 150,
    DESCRIPTION: 300,
    CATEGORY: 180,
    'OFFER SHIPPING': 120,
  });
  const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);

  // Extract unique categories from all listings for autocomplete
  const uniqueCategories = Array.from(
    new Set(data.map(item => item.CATEGORY).filter(cat => cat && cat.trim() !== ''))
  ).sort();

  // Handle column resizing
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        e.preventDefault();
        const delta = e.clientX - resizing.startX;
        const newWidth = Math.max(80, resizing.startWidth + delta);
        setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [resizing]);

  const handleSort = (field: keyof MarketplaceListing) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
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
        <table className="min-w-full bg-white border border-gray-300 text-sm" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-100">
            <tr>
              {[
                { field: 'TITLE' as keyof MarketplaceListing, label: 'Title' },
                { field: 'PRICE' as keyof MarketplaceListing, label: 'Price' },
                { field: 'CONDITION' as keyof MarketplaceListing, label: 'Condition' },
                { field: 'DESCRIPTION' as keyof MarketplaceListing, label: 'Description' },
                { field: 'CATEGORY' as keyof MarketplaceListing, label: 'Category' },
                { field: 'OFFER SHIPPING' as keyof MarketplaceListing, label: 'Shipping' },
              ].map(({ field, label }) => (
                <th
                  key={field}
                  className="px-4 py-2 border-b text-left font-medium text-gray-700 relative select-none group"
                  style={{ width: columnWidths[field], position: 'relative' }}
                >
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 pr-2"
                    onClick={() => handleSort(field)}
                  >
                    <span>{label}</span>
                    {sortField === field ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp size={14} className="text-blue-600" />
                      ) : (
                        <ArrowDown size={14} className="text-blue-600" />
                      )
                    ) : (
                      <ArrowUpDown size={14} className="text-gray-400" />
                    )}
                  </div>
                  {/* Resize handle - wider hit area */}
                  <div
                    className="absolute top-0 right-0 h-full cursor-col-resize group-hover:bg-blue-100"
                    style={{
                      width: '8px',
                      marginRight: '-4px',
                      background: resizing?.column === field ? '#3b82f6' : 'transparent',
                      zIndex: 20,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setResizing({
                        column: field,
                        startX: e.clientX,
                        startWidth: columnWidths[field],
                      });
                    }}
                  >
                    {/* Visual indicator line */}
                    <div
                      className="absolute right-0 top-0 h-full w-0.5 bg-gray-300 group-hover:bg-blue-500"
                      style={{
                        background: resizing?.column === field ? '#3b82f6' : undefined,
                      }}
                    />
                  </div>
                </th>
              ))}
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700" style={{ width: 100 }}>
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
                      value={listing.TITLE}
                      onChange={(e) => handleCellUpdate(listing.id, 'TITLE', e.target.value)}
                      onBlur={() => setEditingCell(null)}
                      maxLength={150}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <textarea
                      value={listing.DESCRIPTION}
                      onChange={(e) => handleCellUpdate(listing.id, 'DESCRIPTION', e.target.value)}
                      onBlur={() => setEditingCell(null)}
                      maxLength={5000}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <div className="truncate" title={listing.DESCRIPTION}>{listing.DESCRIPTION || <span className="text-gray-400">Click to edit</span>}</div>
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

      {/* Datalist for category autocomplete */}
      <datalist id="category-suggestions">
        {uniqueCategories.map((category, index) => (
          <option key={index} value={category} />
        ))}
      </datalist>
    </div>
  );
}

