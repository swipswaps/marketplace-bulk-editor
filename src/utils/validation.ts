import type { MarketplaceListing } from '../types';

// Prohibited keywords based on Facebook Commerce Policies
const PROHIBITED_KEYWORDS = {
  alcohol: ['alcohol', 'beer', 'wine', 'liquor', 'vodka', 'whiskey', 'rum', 'tequila', 'champagne', 'sake'],
  tobacco: ['tobacco', 'cigarette', 'cigar', 'vape', 'vaping', 'e-cig', 'juul', 'smoking'],
  drugs: ['marijuana', 'cannabis', 'weed', 'cbd oil', 'thc', 'drug', 'prescription'],
  weapons: ['gun', 'firearm', 'rifle', 'pistol', 'weapon', 'ammunition', 'ammo', 'explosive', 'grenade', 'knife', 'sword', 'taser'],
  adult: ['adult', 'xxx', 'porn', 'sex toy', 'vibrator', 'escort', 'massage'],
  animals: ['puppy', 'kitten', 'dog for sale', 'cat for sale', 'pet for sale', 'animal for sale'],
  healthcare: ['prescription', 'rx', 'medical device', 'contact lens', 'insulin'],
  counterfeit: ['replica', 'fake', 'counterfeit', 'knockoff', 'imitation', 'copy'],
  recalled: ['recalled', 'defective'],
  services: ['service', 'consulting', 'repair service', 'cleaning service'],
};

export interface ValidationWarning {
  type: 'error' | 'warning';
  category: string;
  message: string;
  itemIndices: number[];
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  emptyTitles: number;
  emptyDescriptions: number;
  zeroPrices: number;
  prohibitedItems: number;
}

/**
 * Check if text contains prohibited keywords
 */
function containsProhibitedKeywords(text: string): { found: boolean; category: string; keyword: string } | null {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(PROHIBITED_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return { found: true, category, keyword };
      }
    }
  }
  
  return null;
}

/**
 * Validate a single listing
 */
export function validateListing(listing: MarketplaceListing): {
  emptyTitle: boolean;
  emptyDescription: boolean;
  emptyCondition: boolean;
  zeroPrice: boolean;
  invalidCondition: boolean;
  prohibited: { category: string; keyword: string } | null;
} {
  const title = String(listing.TITLE || '').trim();
  const description = String(listing.DESCRIPTION || '').trim();
  const condition = String(listing.CONDITION || '').trim();
  const price = Number(listing.PRICE || 0);

  const emptyTitle = title === '';
  const emptyDescription = description === '';
  const emptyCondition = condition === '';
  const zeroPrice = price === 0;

  // Validate condition against Facebook Marketplace allowed values
  const validConditions = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];
  const invalidCondition = condition !== '' && !validConditions.includes(condition);

  // Check for prohibited keywords in title and description
  const titleCheck = containsProhibitedKeywords(title);
  const descCheck = containsProhibitedKeywords(description);
  const prohibited = titleCheck || descCheck;

  return {
    emptyTitle,
    emptyDescription,
    emptyCondition,
    zeroPrice,
    invalidCondition,
    prohibited,
  };
}

/**
 * Validate all listings and return comprehensive results
 */
export function validateListings(listings: MarketplaceListing[]): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const emptyTitleIndices: number[] = [];
  const emptyDescIndices: number[] = [];
  const emptyConditionIndices: number[] = [];
  const invalidConditionIndices: number[] = [];
  const zeroPriceIndices: number[] = [];
  const prohibitedIndices: number[] = [];
  const prohibitedByCategory: Record<string, { indices: number[]; keywords: Set<string> }> = {};

  listings.forEach((listing, index) => {
    const validation = validateListing(listing);

    if (validation.emptyTitle) {
      emptyTitleIndices.push(index);
    }

    if (validation.emptyDescription) {
      emptyDescIndices.push(index);
    }

    if (validation.emptyCondition) {
      emptyConditionIndices.push(index);
    }

    if (validation.invalidCondition) {
      invalidConditionIndices.push(index);
    }

    if (validation.zeroPrice) {
      zeroPriceIndices.push(index);
    }

    if (validation.prohibited) {
      prohibitedIndices.push(index);
      const { category, keyword } = validation.prohibited;

      if (!prohibitedByCategory[category]) {
        prohibitedByCategory[category] = { indices: [], keywords: new Set() };
      }
      prohibitedByCategory[category].indices.push(index);
      prohibitedByCategory[category].keywords.add(keyword);
    }
  });

  // Add warnings for empty fields
  if (emptyTitleIndices.length > 0) {
    warnings.push({
      type: 'error',
      category: 'Required Field',
      message: `${emptyTitleIndices.length} listing(s) missing TITLE (required by Facebook)`,
      itemIndices: emptyTitleIndices,
    });
  }

  if (emptyDescIndices.length > 0) {
    warnings.push({
      type: 'error',
      category: 'Required Field',
      message: `${emptyDescIndices.length} listing(s) missing DESCRIPTION (required by Facebook)`,
      itemIndices: emptyDescIndices,
    });
  }

  if (emptyConditionIndices.length > 0) {
    warnings.push({
      type: 'error',
      category: 'Required Field',
      message: `${emptyConditionIndices.length} listing(s) missing CONDITION (required by Facebook)`,
      itemIndices: emptyConditionIndices,
    });
  }

  if (invalidConditionIndices.length > 0) {
    warnings.push({
      type: 'error',
      category: 'Invalid Value',
      message: `${invalidConditionIndices.length} listing(s) have invalid CONDITION (must be: New, Used - Like New, Used - Good, Used - Fair)`,
      itemIndices: invalidConditionIndices,
    });
  }

  if (zeroPriceIndices.length > 0) {
    warnings.push({
      type: 'warning',
      category: 'Pricing',
      message: `${zeroPriceIndices.length} listing(s) have PRICE = $0 (may be rejected)`,
      itemIndices: zeroPriceIndices,
    });
  }

  // Add warnings for prohibited items
  for (const [category, data] of Object.entries(prohibitedByCategory)) {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const keywordList = Array.from(data.keywords).join(', ');

    warnings.push({
      type: 'error',
      category: 'Prohibited Item',
      message: `${data.indices.length} listing(s) may contain prohibited ${categoryName} items (keywords: ${keywordList})`,
      itemIndices: data.indices,
    });
  }

  return {
    isValid: warnings.filter(w => w.type === 'error').length === 0,
    warnings,
    emptyTitles: emptyTitleIndices.length,
    emptyDescriptions: emptyDescIndices.length,
    zeroPrices: zeroPriceIndices.length,
    prohibitedItems: prohibitedIndices.length,
  };
}

