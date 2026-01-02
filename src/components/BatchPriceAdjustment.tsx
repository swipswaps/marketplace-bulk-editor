/**
 * Batch Price Adjustment Component
 * Allows bulk price increases/decreases by percentage or fixed amount
 */

import { useState } from 'react';
import { DollarSign, Percent, Plus, Minus, X } from 'lucide-react';
import type { MarketplaceListing } from '../types';

interface BatchPriceAdjustmentProps {
  selectedRows: Set<string>;
  data: MarketplaceListing[];
  onApply: (updatedData: MarketplaceListing[]) => void;
  onClose: () => void;
}

export function BatchPriceAdjustment({ selectedRows, data, onApply, onClose }: BatchPriceAdjustmentProps) {
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  const [value, setValue] = useState<string>('');
  const [roundTo, setRoundTo] = useState<'none' | 'nearest' | 'up' | 'down'>('nearest');

  const selectedCount = selectedRows.size;
  const affectedListings = data.filter(item => selectedRows.has(item.id));

  const calculateNewPrice = (currentPrice: number): number => {
    const numValue = parseFloat(value) || 0;
    let newPrice: number;

    if (adjustmentType === 'percentage') {
      const multiplier = operation === 'increase' ? (1 + numValue / 100) : (1 - numValue / 100);
      newPrice = currentPrice * multiplier;
    } else {
      newPrice = operation === 'increase' ? currentPrice + numValue : currentPrice - numValue;
    }

    // Apply rounding
    switch (roundTo) {
      case 'nearest':
        newPrice = Math.round(newPrice);
        break;
      case 'up':
        newPrice = Math.ceil(newPrice);
        break;
      case 'down':
        newPrice = Math.floor(newPrice);
        break;
      default:
        newPrice = Math.round(newPrice * 100) / 100; // Round to 2 decimals
    }

    // Ensure price is not negative
    return Math.max(0.01, newPrice);
  };

  const handleApply = () => {
    const updatedData = data.map(item => {
      if (selectedRows.has(item.id)) {
        const currentPrice = typeof item.PRICE === 'string' ? parseFloat(item.PRICE) : item.PRICE;
        const newPrice = calculateNewPrice(currentPrice);
        return { ...item, PRICE: newPrice };
      }
      return item;
    });

    onApply(updatedData);
    onClose();
  };

  const previewChanges = affectedListings.slice(0, 5).map(item => {
    const currentPrice = typeof item.PRICE === 'string' ? parseFloat(item.PRICE) : item.PRICE;
    const newPrice = calculateNewPrice(currentPrice);
    return { title: item.TITLE, currentPrice, newPrice };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Batch Price Adjustment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Selection info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>{selectedCount}</strong> listing{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Adjustment type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adjustment Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setAdjustmentType('percentage')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  adjustmentType === 'percentage'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Percent size={16} />
                Percentage
              </button>
              <button
                onClick={() => setAdjustmentType('fixed')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  adjustmentType === 'fixed'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <DollarSign size={16} />
                Fixed Amount
              </button>
            </div>
          </div>

          {/* Operation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operation
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setOperation('increase')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  operation === 'increase'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Plus size={16} />
                Increase
              </button>
              <button
                onClick={() => setOperation('decrease')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  operation === 'decrease'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Minus size={16} />
                Decrease
              </button>
            </div>
          </div>

          {/* Value input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {adjustmentType === 'percentage' ? 'Percentage' : 'Amount'} ({adjustmentType === 'percentage' ? '%' : '$'})
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="0"
              step={adjustmentType === 'percentage' ? '1' : '0.01'}
              placeholder={adjustmentType === 'percentage' ? 'e.g., 10' : 'e.g., 5.00'}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Rounding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Round Result
            </label>
            <select
              value={roundTo}
              onChange={(e) => setRoundTo(e.target.value as typeof roundTo)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">No rounding (2 decimals)</option>
              <option value="nearest">Round to nearest dollar</option>
              <option value="up">Round up</option>
              <option value="down">Round down</option>
            </select>
          </div>

          {/* Preview */}
          {value && parseFloat(value) > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview (first 5 items)
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Item</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Current</th>
                      <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">→</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">New</th>
                      <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewChanges.map((item, idx) => {
                      const change = item.newPrice - item.currentPrice;
                      const changePercent = (change / item.currentPrice) * 100;
                      return (
                        <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-[200px]">
                            {item.title}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                            ${item.currentPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                            →
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                            ${item.newPrice.toFixed(2)}
                          </td>
                          <td className={`px-3 py-2 text-right text-sm ${
                            change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {affectedListings.length > 5 && (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 text-center">
                    ... and {affectedListings.length - 5} more items
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!value || parseFloat(value) <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply to {selectedCount} Item{selectedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

