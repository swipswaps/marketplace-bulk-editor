/**
 * Column Filter Component
 * Provides dropdown filters for table columns with unique value selection
 */

import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';
import type { MarketplaceListing } from '../types';

interface ColumnFilterProps {
  column: keyof MarketplaceListing;
  data: MarketplaceListing[];
  activeFilters: Record<string, Set<string>>;
  onFilterChange: (column: keyof MarketplaceListing, values: Set<string>) => void;
}

export function ColumnFilter({ column, data, activeFilters, onFilterChange }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique values for this column
  const uniqueValues = Array.from(
    new Set(
      data
        .map(item => String(item[column] || ''))
        .filter(val => val.trim() !== '')
    )
  ).sort();

  const currentFilter = activeFilters[column] || new Set<string>();
  const hasActiveFilter = currentFilter.size > 0;

  // Filter unique values based on search
  const filteredValues = uniqueValues.filter(value =>
    value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleValue = (value: string) => {
    const newFilter = new Set(currentFilter);
    if (newFilter.has(value)) {
      newFilter.delete(value);
    } else {
      newFilter.add(value);
    }
    onFilterChange(column, newFilter);
  };

  const selectAll = () => {
    onFilterChange(column, new Set(filteredValues));
  };

  const clearAll = () => {
    onFilterChange(column, new Set());
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
          hasActiveFilter ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
        }`}
        aria-label={`Filter ${column}`}
        title={`Filter ${column}`}
      >
        <Filter size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50">
          {/* Search box */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search values..."
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={selectAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear
            </button>
          </div>

          {/* Values list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredValues.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No values found
              </div>
            ) : (
              filteredValues.map((value) => {
                const isSelected = currentFilter.has(value);
                const count = data.filter(item => String(item[column]) === value).length;

                return (
                  <label
                    key={value}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleValue(value)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                      {value}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({count})
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

