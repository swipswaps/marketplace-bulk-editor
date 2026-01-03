/**
 * OCR Results Viewer Component
 * View and edit OCR results with image preview and text editing
 */

import { useState } from 'react';
import { X, Image as ImageIcon, FileText, Download, CheckCircle, Edit3, Plus, RefreshCw, ArrowDown } from 'lucide-react';
import { ImagePreprocessor } from './ImagePreprocessor';
import { OCRTextEditor } from './OCRTextEditor';
import { OCRScratchPad } from './OCRScratchPad';
import type { MarketplaceListing } from '../types';

export interface ImportOptions {
  mode: 'append' | 'replace' | 'insert';
  insertAtRow?: number;
}

interface OCRResultsViewerProps {
  imageUrl: string;
  ocrText: string;
  confidence: number;
  extractedProducts?: MarketplaceListing[];
  onClose: () => void;
  onProductsImport?: (products: MarketplaceListing[], options?: ImportOptions) => void;
  onReprocess?: (processedImageUrl: string) => void;
  currentRowCount?: number;
}

type ViewMode = 'image' | 'text' | 'products' | 'scratch';

export function OCRResultsViewer({
  imageUrl,
  ocrText,
  confidence,
  extractedProducts = [],
  onClose,
  onProductsImport,
  onReprocess,
  currentRowCount = 0
}: OCRResultsViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [editedText, setEditedText] = useState(ocrText);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set(extractedProducts.map((_, idx) => idx)) // Select all by default
  );
  const [importMode, setImportMode] = useState<'append' | 'replace' | 'insert'>('append');
  const [insertAtRow, setInsertAtRow] = useState(1);

  const toggleProductSelection = (idx: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === extractedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(extractedProducts.map((_, idx) => idx)));
    }
  };

  const handleImportProducts = () => {
    if (selectedProducts.size > 0 && onProductsImport) {
      const productsToImport = extractedProducts.filter((_, idx) => selectedProducts.has(idx));
      const options: ImportOptions = {
        mode: importMode,
        insertAtRow: importMode === 'insert' ? insertAtRow : undefined
      };
      onProductsImport(productsToImport, options);
      onClose();
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-results-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              OCR Results
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {extractedProducts.length} products extracted • {(confidence * 100).toFixed(0)}% confidence
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode('products')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              viewMode === 'products'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t border-l border-r border-gray-200 dark:border-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle size={16} />
            Products ({extractedProducts.length})
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              viewMode === 'text'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t border-l border-r border-gray-200 dark:border-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText size={16} />
            Raw Text
          </button>
          <button
            onClick={() => setViewMode('image')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              viewMode === 'image'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t border-l border-r border-gray-200 dark:border-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon size={16} />
            Image
          </button>
          <button
            onClick={() => setViewMode('scratch')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              viewMode === 'scratch'
                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-t border-l border-r border-gray-200 dark:border-gray-700'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Edit3 size={16} />
            Scratch Pad
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'products' && (
            <div className="space-y-4">
              {extractedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    No products extracted. Try adjusting the image or editing the raw text.
                  </p>
                </div>
              ) : (
                <>
                  {/* Selection and Import Controls */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={selectedProducts.size === extractedProducts.length}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          Select All ({selectedProducts.size}/{extractedProducts.length})
                        </label>
                      </div>
                    </div>

                    {/* Import Mode Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Import Mode:
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="radio"
                            name="importMode"
                            value="append"
                            checked={importMode === 'append'}
                            onChange={(e) => setImportMode(e.target.value as 'append')}
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <Plus size={16} className="inline" />
                          Append to end
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="radio"
                            name="importMode"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={(e) => setImportMode(e.target.value as 'replace')}
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <RefreshCw size={16} className="inline" />
                          Replace all data
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <input
                            type="radio"
                            name="importMode"
                            value="insert"
                            checked={importMode === 'insert'}
                            onChange={(e) => setImportMode(e.target.value as 'insert')}
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <ArrowDown size={16} className="inline" />
                          Insert at row
                        </label>
                        {importMode === 'insert' && (
                          <input
                            type="number"
                            min="1"
                            max={currentRowCount + 1}
                            value={insertAtRow}
                            onChange={(e) => setInsertAtRow(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        )}
                      </div>
                      {importMode === 'replace' && (
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ This will delete all existing data and replace with selected products
                        </p>
                      )}
                      {importMode === 'insert' && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Selected products will be inserted at row {insertAtRow} (current rows: {currentRowCount})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Products List with Checkboxes */}
                  <div className="space-y-3">
                    {extractedProducts.map((product, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-4 transition-colors ${
                          selectedProducts.has(idx)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(idx)}
                            onChange={() => toggleProductSelection(idx)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {product.TITLE || 'Untitled Product'}
                            </h3>
                            {product.DESCRIPTION && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {product.DESCRIPTION}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              {product.PRICE && (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  ${typeof product.PRICE === 'number' ? product.PRICE.toFixed(2) : product.PRICE}
                                </span>
                              )}
                              {product.CONDITION && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  {product.CONDITION}
                                </span>
                              )}
                              {product.CATEGORY && (
                                <span className="text-gray-600 dark:text-gray-400">
                                  {product.CATEGORY}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {viewMode === 'text' && (
            <OCRTextEditor
              initialText={ocrText}
              confidence={confidence}
              onTextChange={setEditedText}
            />
          )}

          {viewMode === 'image' && (
            <ImagePreprocessor
              imageUrl={imageUrl}
              onImageProcessed={onReprocess}
            />
          )}

          {viewMode === 'scratch' && (
            <OCRScratchPad
              initialText={ocrText}
              onProductsCreate={onProductsImport}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleDownloadText}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Download size={16} />
            Download Text
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
            {extractedProducts.length > 0 && onProductsImport && (
              <button
                onClick={handleImportProducts}
                disabled={selectedProducts.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Import {selectedProducts.size} Selected Product{selectedProducts.size !== 1 ? 's' : ''}
                {importMode === 'append' && ' (Append)'}
                {importMode === 'replace' && ' (Replace All)'}
                {importMode === 'insert' && ` (Insert at Row ${insertAtRow})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

