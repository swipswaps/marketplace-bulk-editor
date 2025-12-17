import { useState } from 'react';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { CONDITIONS, CATEGORIES } from '../types';

interface DataTableProps {
  data: MarketplaceListing[];
  onUpdate: (data: MarketplaceListing[]) => void;
}

export function DataTable({ data, onUpdate }: DataTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MarketplaceListing | null>(null);

  const handleEdit = (listing: MarketplaceListing) => {
    setEditingId(listing.id);
    setEditForm({ ...listing });
  };

  const handleSave = () => {
    if (editForm) {
      const updatedData = data.map(item => 
        item.id === editingId ? editForm : item
      );
      onUpdate(updatedData);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
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
      CATEGORY: 'Electronics',
      'OFFER SHIPPING': 'No'
    };
    onUpdate([...data, newListing]);
  };

  const updateField = (field: keyof MarketplaceListing, value: any) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          <Plus size={18} />
          Add New Listing
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full bg-white text-xs sm:text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Title</th>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Price</th>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Condition</th>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Description</th>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Category</th>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Shipping</th>
              <th className="px-3 sm:px-4 py-3 border-b border-gray-200 text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((listing, index) => (
              <tr key={listing.id} className={`transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              } hover:bg-blue-50/50`}>
                {editingId === listing.id && editForm ? (
                  <>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={editForm.TITLE}
                        onChange={(e) => updateField('TITLE', e.target.value)}
                        maxLength={150}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                        placeholder="Product title"
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <input
                        type="number"
                        value={editForm.PRICE}
                        onChange={(e) => updateField('PRICE', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <select
                        value={editForm.CONDITION}
                        onChange={(e) => updateField('CONDITION', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                      >
                        {CONDITIONS.map(cond => (
                          <option key={cond} value={cond}>{cond}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <textarea
                        value={editForm.DESCRIPTION}
                        onChange={(e) => updateField('DESCRIPTION', e.target.value)}
                        maxLength={5000}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                        rows={2}
                        placeholder="Product description"
                      />
                    </td>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <select
                        value={editForm.CATEGORY}
                        onChange={(e) => updateField('CATEGORY', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <select
                        value={editForm['OFFER SHIPPING']}
                        onChange={(e) => updateField('OFFER SHIPPING', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="px-3 sm:px-4 py-2 border-b border-gray-200">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={handleSave}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200 max-w-xs">
                      <div className="truncate font-medium text-gray-900" title={listing.TITLE}>
                        {listing.TITLE || <span className="text-gray-400 italic">No title</span>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200">
                      <span className="font-semibold text-green-600">${listing.PRICE}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {listing.CONDITION}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200 max-w-xs">
                      <div className="truncate text-gray-600" title={listing.DESCRIPTION}>
                        {listing.DESCRIPTION || <span className="text-gray-400 italic">No description</span>}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200">
                      <span className="text-gray-700">{listing.CATEGORY}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        listing['OFFER SHIPPING'] === 'Yes'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing['OFFER SHIPPING']}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 border-b border-gray-200">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(listing)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

