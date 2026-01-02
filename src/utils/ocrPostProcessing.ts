/**
 * OCR Post-Processing Utilities
 * Fix common OCR errors and improve text quality
 */

// Common OCR character confusions
const CHARACTER_CONFUSIONS: Record<string, string> = {
  // Numbers vs Letters
  '0': 'O',  // Zero vs O
  '1': 'I',  // One vs I/l
  '5': 'S',  // Five vs S
  '8': 'B',  // Eight vs B
  
  // Letters vs Numbers
  'O': '0',  // O vs Zero
  'I': '1',  // I vs One
  'l': '1',  // lowercase L vs One
  'S': '5',  // S vs Five
  'B': '8',  // B vs Eight
  
  // Common letter confusions
  'rn': 'm',  // rn vs m
  'vv': 'w',  // vv vs w
  'cl': 'd',  // cl vs d
  'li': 'h',  // li vs h
};

// Common word corrections for marketplace terms
const WORD_CORRECTIONS: Record<string, string> = {
  // Marketplace terms
  'titIe': 'title',
  'TITIE': 'TITLE',
  'prlce': 'price',
  'PRIGE': 'PRICE',
  'conditlon': 'condition',
  'GONDITION': 'CONDITION',
  'descriptlon': 'description',
  'DESGRIPTION': 'DESCRIPTION',
  'categOry': 'category',
  'GATEGORY': 'CATEGORY',
  'shlpping': 'shipping',
  'SHIPPING': 'SHIPPING',
  
  // Condition values
  'Llke': 'Like',
  'Goad': 'Good',
  'Falr': 'Fair',
  
  // Common words
  'tlie': 'the',
  'ancl': 'and',
  'witli': 'with',
  'frorn': 'from',
  'tliis': 'this',
  'tl1at': 'that',
  'wl1ich': 'which',
  'tl1ere': 'there',
  'tl1eir': 'their',
  'wl1ere': 'where',
  'wl1en': 'when',
  'wl1at': 'what',
  'wl1o': 'who',
  'l1ow': 'how',
  'l1ave': 'have',
  'l1as': 'has',
  'l1ad': 'had',
  'l1ere': 'here',
  'l1ome': 'home',
  'l1igh': 'high',
  'l1ouse': 'house',
  'l1our': 'hour',
  'l1and': 'hand',
  'l1ead': 'head',
  'l1eart': 'heart',
  'l1elp': 'help',
  'l1old': 'hold',
  'l1ope': 'hope',
  'l1ot': 'hot',
  'l1uman': 'human',
};

// Regex patterns for common OCR errors
const OCR_ERROR_PATTERNS: Array<[RegExp, string]> = [
  // Spacing errors
  [/\bfi le\b/gi, 'file'],
  [/\bfi les\b/gi, 'files'],
  [/\bCsV\b/g, 'CSV'],
  [/\bJsON\b/g, 'JSON'],
  [/\bXLsx\b/g, 'XLSX'],
  [/\bXLSx\b/g, 'XLSX'],
  
  // Split words
  [/\bCONDIT\s+ION\b/g, 'CONDITION'],
  [/\bDESCRIPT\s+ION\b/g, 'DESCRIPTION'],
  [/\bCATEG\s+ORY\b/g, 'CATEGORY'],
  [/\bSHIPP\s+ING\b/g, 'SHIPPING'],
  
  // Common character confusions in context
  [/\b0([A-Z][a-z]+)/g, 'O$1'],  // "0ption" → "Option"
  [/\bl([A-Z][a-z]+)/g, 'I$1'],  // "lnfo" → "Info"
  [/\b([A-Z][a-z]+)0\b/g, '$1O'], // "Hell0" → "Hello"
  
  // Price patterns - fix common errors
  [/\$\s+(\d)/g, '$$$1'],  // "$ 100" → "$100"
  [/(\d)\s+\.\s+(\d{2})/g, '$1.$2'],  // "100 . 00" → "100.00"
  [/\$([O0])(\d)/g, '$$$2'],  // "$O50" → "$50", "$050" → "$50"
  
  // Remove extra spaces
  [/\s{2,}/g, ' '],  // Multiple spaces → single space
  [/\s+([.,!?;:])/g, '$1'],  // Space before punctuation
  [/([.,!?;:])\s*([.,!?;:])/g, '$1'],  // Double punctuation
];

/**
 * Fix common OCR errors in text
 */
export function fixOCRErrors(text: string): string {
  let corrected = text;

  // Apply regex patterns
  for (const [pattern, replacement] of OCR_ERROR_PATTERNS) {
    corrected = corrected.replace(pattern, replacement);
  }

  // Fix whole word corrections
  const words = corrected.split(/\b/);
  const fixedWords = words.map(word => WORD_CORRECTIONS[word] || word);
  corrected = fixedWords.join('');

  return corrected.trim();
}

/**
 * Suggest corrections for a word based on common OCR errors
 */
export function suggestCorrections(word: string): string[] {
  const suggestions = new Set<string>();

  // Add exact match from dictionary
  if (WORD_CORRECTIONS[word]) {
    suggestions.add(WORD_CORRECTIONS[word]);
  }

  // Try character substitutions
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (CHARACTER_CONFUSIONS[char]) {
      const suggestion = word.substring(0, i) + CHARACTER_CONFUSIONS[char] + word.substring(i + 1);
      suggestions.add(suggestion);
    }
  }

  // Try removing/adding spaces
  if (word.includes(' ')) {
    suggestions.add(word.replace(/\s+/g, ''));
  }

  return Array.from(suggestions).slice(0, 5);
}

