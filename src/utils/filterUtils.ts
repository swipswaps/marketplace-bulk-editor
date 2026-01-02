import type { MarketplaceListing } from '../types';

export interface FilterCondition {
  id: string;
  field: keyof MarketplaceListing;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: string;
  logic: 'AND' | 'OR';
}

/**
 * Apply filter conditions to listings
 */
export function applyFilterConditions(
  listings: MarketplaceListing[],
  conditions: FilterCondition[]
): MarketplaceListing[] {
  if (conditions.length === 0) return listings;

  return listings.filter(listing => {
    let result = true;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const fieldValue = String(listing[condition.field] || '').toLowerCase();
      const filterValue = condition.value.toLowerCase();

      let matches = false;

      switch (condition.operator) {
        case 'equals':
          matches = fieldValue === filterValue;
          break;
        case 'contains':
          matches = fieldValue.includes(filterValue);
          break;
        case 'startsWith':
          matches = fieldValue.startsWith(filterValue);
          break;
        case 'endsWith':
          matches = fieldValue.endsWith(filterValue);
          break;
        case 'greaterThan':
          matches = parseFloat(fieldValue) > parseFloat(filterValue);
          break;
        case 'lessThan':
          matches = parseFloat(fieldValue) < parseFloat(filterValue);
          break;
        case 'isEmpty':
          matches = !fieldValue || fieldValue.trim() === '';
          break;
        case 'isNotEmpty':
          matches = Boolean(fieldValue && fieldValue.trim() !== '');
          break;
      }

      if (i === 0) {
        result = matches;
      } else {
        if (condition.logic === 'AND') {
          result = result && matches;
        } else {
          result = result || matches;
        }
      }
    }

    return result;
  });
}

