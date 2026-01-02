export interface MarketplaceListing {
  id: string;
  TITLE: string;
  PRICE: number | string;
  CONDITION: string;
  DESCRIPTION: string;
  CATEGORY: string;
  'OFFER SHIPPING': string;
  PHOTOS?: string; // Semicolon-separated photo URLs or file paths
  _autoFilled?: AutoFilledField[]; // Track which fields were auto-filled during import
}

export interface AutoFilledField {
  field: keyof MarketplaceListing;
  originalValue: string | number | null | undefined; // The original value from import (null, undefined, empty string)
  defaultValue: string | number; // The default value we filled in
  reason: string; // Human-readable reason (e.g., "Field was empty in imported file")
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
  sampleData?: MarketplaceListing[]; // Optional sample data from the template
}

export interface ImportValidationResult {
  valid: MarketplaceListing[]; // Rows with all required fields
  autoFilled: MarketplaceListing[]; // Rows with auto-filled fields (needs review)
  rejected: MarketplaceListing[]; // Rows missing TITLE (cannot import)
  totalRows: number;
  validCount: number;
  autoFilledCount: number;
  rejectedCount: number;
}
