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

export interface TemplateMetadata {
  sheetName: string;
  headerRowIndex: number; // 0-based index of the row containing column headers
  headerRows: string[][]; // All rows before the column header row (e.g., title, instructions)
  columnHeaders: string[]; // The actual column headers (TITLE, PRICE, etc.)
}
