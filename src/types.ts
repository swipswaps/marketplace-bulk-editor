export interface MarketplaceListing {
  id: string;
  TITLE: string;
  PRICE: number | string;
  CONDITION: string;
  DESCRIPTION: string;
  CATEGORY: string;
  'OFFER SHIPPING': string;
}

export const REQUIRED_COLUMNS = [
  'TITLE',
  'PRICE',
  'CONDITION',
  'DESCRIPTION',
  'CATEGORY',
  'OFFER SHIPPING'
] as const;

export const CONDITIONS = [
  'New',
  'Used - Like New',
  'Used - Good',
  'Used - Fair'
] as const;
