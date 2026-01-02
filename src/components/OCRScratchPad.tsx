/**
 * OCR Scratch Pad Component
 * Editable textarea for composing/editing OCR text before converting to products
 */

import { useState, useEffect } from 'react';
import { Wand2, Save, Download, Trash2, ShoppingCart } from 'lucide-react';
import type { MarketplaceListing } from '../types';

interface OCRScratchPadProps {
  initialText: string;
  onProductsCreate?: (products: MarketplaceListing[]) => void;
}

export function OCRScratchPad({ initialText, onProductsCreate }: OCRScratchPadProps) {
  // Initialize text from localStorage or initialText
  const [text, setText] = useState(() => {
    if (initialText) return initialText;
    const saved = localStorage.getItem('ocr-scratch-pad-draft');
    return saved || '';
  });
  const [isSaved, setIsSaved] = useState(false);

  // Update text when initialText changes
  useEffect(() => {
    if (initialText) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(initialText);
    }
  }, [initialText]);

  // Auto-save indicator
  useEffect(() => {
    if (isSaved) {
      const timer = setTimeout(() => setIsSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaved]);

  const handleCleanText = () => {
    let cleaned = text;

    // Remove common UI noise patterns
    const noisePatterns = [
      /^(screenshot|archive|omni|dash|toolkit|internet|page|of|the|and|or|for|with|from|to|at|in|on|by)\s*$/gim,
      /^\d{4}-\d{2}-\d{2}.*$/gm, // Dates
      /^\d{2}:\d{2}.*$/gm, // Times
      /^[^\w\s]+$/gm, // Lines with only special characters
      /^\s*$/gm, // Empty lines
    ];

    noisePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Normalize whitespace
    cleaned = cleaned
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    setText(cleaned);
  };

  const handleParseAsProducts = () => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const products: MarketplaceListing[] = lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Try to extract price
      const pricePatterns = [
        /\$\s*(\d+(?:[.,]\d{2})?)/,
        /(\d+(?:[.,]\d{2}))\s*\$/,
        /\b(\d+\.\d{2})\b/,
      ];

      let price = 0;
      let name = trimmed;

      for (const pattern of pricePatterns) {
        const match = trimmed.match(pattern);
        if (match) {
          price = parseFloat(match[1].replace(',', '.'));
          name = trimmed.replace(match[0], '').trim();
          break;
        }
      }

      return {
        id: `scratch-${Date.now()}-${idx}`,
        TITLE: name || trimmed,
        PRICE: price,
        CONDITION: 'New' as const,
        DESCRIPTION: trimmed,
        CATEGORY: '',
        'OFFER SHIPPING': 'No' as const,
        PHOTOS: ''
      };
    });

    if (onProductsCreate && products.length > 0) {
      onProductsCreate(products);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem('ocr-scratch-pad-draft', text);
    setIsSaved(true);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scratch-pad-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear scratch pad? This will remove all text.')) {
      setText('');
      localStorage.removeItem('ocr-scratch-pad-draft');
    }
  };

  const lineCount = text.split('\n').length;
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCleanText}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            title="Remove UI noise and normalize whitespace"
          >
            <Wand2 size={16} />
            Clean Text
          </button>
          <button
            onClick={handleParseAsProducts}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            title="Convert text to products and add to table"
          >
            <ShoppingCart size={16} />
            Parse as Products
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            title="Save draft to browser storage"
          >
            <Save size={16} />
            {isSaved ? 'Saved!' : 'Save Draft'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            title="Download as text file"
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            title="Clear all text"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <span>{lineCount} lines</span>
        <span>•</span>
        <span>{wordCount} words</span>
        <span>•</span>
        <span>{charCount} characters</span>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        placeholder="Paste or edit OCR text here...&#10;&#10;Each line will become a product when you click 'Parse as Products'.&#10;&#10;Use 'Clean Text' to remove UI noise like 'Screenshot', 'Archive', dates, etc."
        spellCheck={false}
      />

      {/* Help text */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How to use:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• <strong>Clean Text</strong> - Removes UI noise (screenshot, archive, dates, etc.)</li>
          <li>• <strong>Parse as Products</strong> - Converts each line to a product listing</li>
          <li>• <strong>Save Draft</strong> - Saves to browser storage (persists across sessions)</li>
          <li>• <strong>Download</strong> - Downloads as .txt file</li>
          <li>• <strong>Clear</strong> - Removes all text from scratch pad</li>
        </ul>
      </div>
    </div>
  );
}

