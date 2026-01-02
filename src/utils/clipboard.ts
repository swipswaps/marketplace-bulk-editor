import type { MarketplaceListing } from '../types';

/**
 * Parse tab-separated values from clipboard (Excel format)
 */
export function parseClipboardData(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => line.split('\t'));
}

/**
 * Convert clipboard data to MarketplaceListing objects
 */
export function clipboardToListings(
  clipboardData: string[][]
): MarketplaceListing[] {
  const listings: MarketplaceListing[] = [];

  // Skip first row if it matches headers
  const startRow = clipboardData[0]?.join('\t').toLowerCase().includes('title') ? 1 : 0;

  for (let i = startRow; i < clipboardData.length; i++) {
    const row = clipboardData[i];
    if (row.length === 0 || row.every(cell => !cell.trim())) continue;

    const listing: MarketplaceListing = {
      id: crypto.randomUUID(),
      TITLE: row[0] || '',
      PRICE: parseFloat(row[1]) || 0,
      CONDITION: row[2] || 'New',
      DESCRIPTION: row[3] || '',
      CATEGORY: row[4] || '',
      'OFFER SHIPPING': row[5] || 'No',
      PHOTOS: row[6] || '',
    };

    listings.push(listing);
  }

  return listings;
}

/**
 * Convert listings to clipboard format (tab-separated)
 */
export function listingsToClipboard(listings: MarketplaceListing[]): string {
  const headers = ['TITLE', 'PRICE', 'CONDITION', 'DESCRIPTION', 'CATEGORY', 'OFFER SHIPPING', 'PHOTOS'];
  const rows = [headers.join('\t')];

  listings.forEach(listing => {
    const row = [
      listing.TITLE,
      listing.PRICE.toString(),
      listing.CONDITION,
      listing.DESCRIPTION,
      listing.CATEGORY,
      listing['OFFER SHIPPING'],
      listing.PHOTOS || '',
    ];
    rows.push(row.join('\t'));
  });

  return rows.join('\n');
}

/**
 * Copy listings to clipboard
 */
export async function copyToClipboard(listings: MarketplaceListing[]): Promise<boolean> {
  try {
    const text = listingsToClipboard(listings);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Paste from clipboard and parse as listings
 */
export async function pasteFromClipboard(): Promise<MarketplaceListing[] | null> {
  try {
    const text = await navigator.clipboard.readText();
    const data = parseClipboardData(text);
    const listings = clipboardToListings(data);
    return listings;
  } catch (error) {
    console.error('Failed to paste from clipboard:', error);
    return null;
  }
}

/**
 * Handle paste event on table
 */
export function handleTablePaste(
  event: ClipboardEvent,
  currentListings: MarketplaceListing[],
  focusedCell: { id: string; field: keyof MarketplaceListing } | null
): MarketplaceListing[] | null {
  const text = event.clipboardData?.getData('text/plain');
  if (!text) return null;

  const data = parseClipboardData(text);
  
  // If single cell, just paste the value
  if (data.length === 1 && data[0].length === 1 && focusedCell) {
    const updatedListings = currentListings.map(listing => {
      if (listing.id === focusedCell.id) {
        return { ...listing, [focusedCell.field]: data[0][0] };
      }
      return listing;
    });
    return updatedListings;
  }

  // Multi-cell paste: convert to new listings
  const newListings = clipboardToListings(data);
  return [...currentListings, ...newListings];
}

