import { useState } from 'react';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { CONDITIONS } from '../types';

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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add New Listing
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Title</th>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Price</th>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Condition</th>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Description</th>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Category</th>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Shipping</th>
              <th className="px-4 py-2 border-b text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50">
                {editingId === listing.id && editForm ? (
                  <>
                    <td className="px-4 py-2 border-b">
                      <input
                        type="text"
                        value={editForm.TITLE}
                        onChange={(e) => updateField('TITLE', e.target.value)}
                        maxLength={150}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <input
                        type="number"
                        value={editForm.PRICE}
                        onChange={(e) => updateField('PRICE', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <select
                        value={editForm.CONDITION}
                        onChange={(e) => updateField('CONDITION', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {CONDITIONS.map(cond => (
                          <option key={cond} value={cond}>{cond}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 border-b">
                      <textarea
                        value={editForm.DESCRIPTION}
                        onChange={(e) => updateField('DESCRIPTION', e.target.value)}
                        maxLength={5000}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <input
                        type="text"
                        value={editForm.CATEGORY}
                        onChange={(e) => updateField('CATEGORY', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Home & Garden"
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <select
                        value={editForm['OFFER SHIPPING']}
                        onChange={(e) => updateField('OFFER SHIPPING', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Save"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 border-b max-w-xs truncate" title={listing.TITLE}>
                      {listing.TITLE}
                    </td>
                    <td className="px-4 py-2 border-b">${listing.PRICE}</td>
                    <td className="px-4 py-2 border-b">{listing.CONDITION}</td>
                    <td className="px-4 py-2 border-b max-w-xs truncate" title={listing.DESCRIPTION}>
                      {listing.DESCRIPTION}
                    </td>
                    <td className="px-4 py-2 border-b">{listing.CATEGORY}</td>
                    <td className="px-4 py-2 border-b">{listing['OFFER SHIPPING']}</td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(listing)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={18} />
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

