import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MarketplaceListing } from '../types';
import { groupListings } from '../utils/groupingUtils';

interface RowGroupingProps {
  data: MarketplaceListing[];
  groupBy: keyof MarketplaceListing | null;
  onGroupByChange: (field: keyof MarketplaceListing | null) => void;
  onItemClick?: (item: MarketplaceListing) => void;
}

export function RowGrouping({ data, groupBy, onGroupByChange, onItemClick }: RowGroupingProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const fields: (keyof MarketplaceListing)[] = [
    'CATEGORY',
    'CONDITION',
    'OFFER SHIPPING',
  ];

  const toggleGroup = (groupValue: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupValue)) {
      newExpanded.delete(groupValue);
    } else {
      newExpanded.add(groupValue);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    if (!groupBy) return;
    const groups = groupListings(data, groupBy);
    setExpandedGroups(new Set(groups.map(g => g.groupValue)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  if (!groupBy) {
    return (
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Group by:</label>
        <select
          value=""
          onChange={e => onGroupByChange(e.target.value as keyof MarketplaceListing || null)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
        >
          <option value="">None</option>
          {fields.map(field => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const groups = groupListings(data, groupBy);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group by:</label>
          <select
            value={groupBy}
            onChange={e => onGroupByChange(e.target.value as keyof MarketplaceListing || null)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            <option value="">None</option>
            {fields.map(field => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            Collapse All
          </button>
        </div>
      </div>

      {groups.map(group => {
        const isExpanded = expandedGroups.has(group.groupValue);

        return (
          <div key={group.groupValue} className="border border-gray-300 dark:border-gray-600 rounded">
            <button
              onClick={() => toggleGroup(group.groupValue)}
              className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium">{group.groupValue}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({group.count} items)
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total: ${group.totalPrice.toFixed(2)} | Avg: ${group.avgPrice.toFixed(2)}
              </div>
            </button>

            {isExpanded && (
              <div className="p-2 space-y-1">
                {group.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <div className="font-medium">{item.TITLE}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ${typeof item.PRICE === 'string' ? item.PRICE : item.PRICE.toFixed(2)} • {item.CONDITION}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

