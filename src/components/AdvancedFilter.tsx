import { useState } from 'react';
import { X, Plus, Filter } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import type { FilterCondition } from '../utils/filterUtils';

// Re-export for convenience
export type { FilterCondition };
// eslint-disable-next-line react-refresh/only-export-components
export { applyFilterConditions } from '../utils/filterUtils';

interface AdvancedFilterProps {
  onApplyFilters: (conditions: FilterCondition[]) => void;
  onClose: () => void;
}

export function AdvancedFilter({ onApplyFilters, onClose }: AdvancedFilterProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([
    {
      id: crypto.randomUUID(),
      field: 'TITLE',
      operator: 'contains',
      value: '',
      logic: 'AND',
    },
  ]);

  const fields: (keyof MarketplaceListing)[] = [
    'TITLE',
    'PRICE',
    'CONDITION',
    'DESCRIPTION',
    'CATEGORY',
    'OFFER SHIPPING',
    'PHOTOS',
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ];

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: crypto.randomUUID(),
        field: 'TITLE',
        operator: 'contains',
        value: '',
        logic: 'AND',
      },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleApply = () => {
    onApplyFilters(conditions.filter(c => c.value || c.operator === 'isEmpty' || c.operator === 'isNotEmpty'));
  };

  const handleClear = () => {
    setConditions([
      {
        id: crypto.randomUUID(),
        field: 'TITLE',
        operator: 'contains',
        value: '',
        logic: 'AND',
      },
    ]);
    onApplyFilters([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="space-y-2">
              {index > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={condition.logic}
                    onChange={e => updateCondition(condition.id, { logic: e.target.value as 'AND' | 'OR' })}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <select
                  value={condition.field}
                  onChange={e => updateCondition(condition.id, { field: e.target.value as keyof MarketplaceListing })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  {fields.map(field => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={e => updateCondition(condition.id, { operator: e.target.value as FilterCondition['operator'] })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {condition.operator !== 'isEmpty' && condition.operator !== 'isNotEmpty' && (
                  <input
                    type="text"
                    value={condition.value}
                    onChange={e => updateCondition(condition.id, { value: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApply();
                      }
                    }}
                    placeholder="Value..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                )}

                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  disabled={conditions.length === 1}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCondition}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            <Plus className="w-4 h-4" />
            Add Condition
          </button>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

