import type { MarketplaceListing } from '../types';

export interface GroupedData {
  groupKey: string;
  groupValue: string;
  items: MarketplaceListing[];
  count: number;
  totalPrice: number;
  avgPrice: number;
}

/**
 * Group listings by field
 */
export function groupListings(
  listings: MarketplaceListing[],
  groupBy: keyof MarketplaceListing
): GroupedData[] {
  const groups = new Map<string, MarketplaceListing[]>();

  listings.forEach(listing => {
    const value = String(listing[groupBy] || '(Empty)');
    if (!groups.has(value)) {
      groups.set(value, []);
    }
    groups.get(value)!.push(listing);
  });

  return Array.from(groups.entries()).map(([value, items]) => {
    const prices = items.map(item => {
      const price = typeof item.PRICE === 'string' ? parseFloat(item.PRICE) : item.PRICE;
      return isNaN(price) ? 0 : price;
    });

    const totalPrice = prices.reduce((sum, p) => sum + p, 0);
    const avgPrice = prices.length > 0 ? totalPrice / prices.length : 0;

    return {
      groupKey: groupBy,
      groupValue: value,
      items,
      count: items.length,
      totalPrice,
      avgPrice,
    };
  }).sort((a, b) => a.groupValue.localeCompare(b.groupValue));
}

