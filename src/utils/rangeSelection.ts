import type { MarketplaceListing } from '../types';

export interface CellPosition {
  rowId: string;
  field: keyof MarketplaceListing;
}

export interface CellRange {
  start: CellPosition;
  end: CellPosition;
}

export interface SelectionState {
  anchor: CellPosition | null;
  focus: CellPosition | null;
  isSelecting: boolean;
}

/**
 * Get all cells in a range
 */
export function getCellsInRange(
  range: CellRange,
  listings: MarketplaceListing[],
  fields: (keyof MarketplaceListing)[]
): CellPosition[] {
  const cells: CellPosition[] = [];

  const startRowIndex = listings.findIndex(l => l.id === range.start.rowId);
  const endRowIndex = listings.findIndex(l => l.id === range.end.rowId);
  const startFieldIndex = fields.indexOf(range.start.field);
  const endFieldIndex = fields.indexOf(range.end.field);

  const minRow = Math.min(startRowIndex, endRowIndex);
  const maxRow = Math.max(startRowIndex, endRowIndex);
  const minField = Math.min(startFieldIndex, endFieldIndex);
  const maxField = Math.max(startFieldIndex, endFieldIndex);

  for (let r = minRow; r <= maxRow; r++) {
    for (let f = minField; f <= maxField; f++) {
      cells.push({
        rowId: listings[r].id,
        field: fields[f],
      });
    }
  }

  return cells;
}

/**
 * Check if a cell is in the current selection
 */
export function isCellInSelection(
  cell: CellPosition,
  selection: SelectionState,
  listings: MarketplaceListing[],
  fields: (keyof MarketplaceListing)[]
): boolean {
  if (!selection.anchor || !selection.focus) return false;

  const range: CellRange = {
    start: selection.anchor,
    end: selection.focus,
  };

  const cellsInRange = getCellsInRange(range, listings, fields);
  return cellsInRange.some(c => c.rowId === cell.rowId && c.field === cell.field);
}

/**
 * Get selected cells as 2D array of values
 */
export function getSelectedValues(
  selection: SelectionState,
  listings: MarketplaceListing[],
  fields: (keyof MarketplaceListing)[]
): string[][] {
  if (!selection.anchor || !selection.focus) return [];

  const range: CellRange = {
    start: selection.anchor,
    end: selection.focus,
  };

  const startRowIndex = listings.findIndex(l => l.id === range.start.rowId);
  const endRowIndex = listings.findIndex(l => l.id === range.end.rowId);
  const startFieldIndex = fields.indexOf(range.start.field);
  const endFieldIndex = fields.indexOf(range.end.field);

  const minRow = Math.min(startRowIndex, endRowIndex);
  const maxRow = Math.max(startRowIndex, endRowIndex);
  const minField = Math.min(startFieldIndex, endFieldIndex);
  const maxField = Math.max(startFieldIndex, endFieldIndex);

  const values: string[][] = [];

  for (let r = minRow; r <= maxRow; r++) {
    const row: string[] = [];
    for (let f = minField; f <= maxField; f++) {
      const value = listings[r][fields[f]];
      row.push(String(value || ''));
    }
    values.push(row);
  }

  return values;
}

/**
 * Apply bulk edit to selected cells
 */
export function applyBulkEdit(
  selection: SelectionState,
  listings: MarketplaceListing[],
  fields: (keyof MarketplaceListing)[],
  value: string | number
): MarketplaceListing[] {
  if (!selection.anchor || !selection.focus) return listings;

  const range: CellRange = {
    start: selection.anchor,
    end: selection.focus,
  };

  const cellsInRange = getCellsInRange(range, listings, fields);
  const updatedListings = listings.map(listing => {
    const cellsForThisRow = cellsInRange.filter(c => c.rowId === listing.id);
    if (cellsForThisRow.length === 0) return listing;

    const updates: Partial<MarketplaceListing> = {};
    cellsForThisRow.forEach(cell => {
      (updates[cell.field] as string | number) = value;
    });

    return { ...listing, ...updates };
  });

  return updatedListings;
}

/**
 * Delete selected rows
 */
export function deleteSelectedRows(
  selection: SelectionState,
  listings: MarketplaceListing[]
): MarketplaceListing[] {
  if (!selection.anchor || !selection.focus) return listings;

  const selectedRowIds = new Set<string>();
  selectedRowIds.add(selection.anchor.rowId);
  selectedRowIds.add(selection.focus.rowId);

  return listings.filter(listing => !selectedRowIds.has(listing.id));
}

