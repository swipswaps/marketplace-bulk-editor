/**
 * OCR Results Viewer Component
 * View and edit OCR results with image preview and text editing
 */

import { useState } from 'react';
import { X, Image as ImageIcon, FileText, Download, CheckCircle, Edit3 } from 'lucide-react';
import { ImagePreprocessor } from './ImagePreprocessor';
import { OCRTextEditor } from './OCRTextEditor';
import { OCRScratchPad } from './OCRScratchPad';
import type { MarketplaceListing } from '../types';

interface OCRResultsViewerProps {
  imageUrl: string;
  ocrText: string;
  confidence: number;
  extractedProducts?: MarketplaceListing[];
  onClose: () => void;
  onProductsImport?: (products: MarketplaceListing[]) => void;
  onReprocess?: (processedImageUrl: string) => void;
}

type ViewMode = 'image' | 'text' | 'products' | 'scratch';

export function OCRResultsViewer({
  imageUrl,
  ocrText,
  confidence,
  extractedProducts = [],
  onClose,
  onProductsImport,
  onReprocess
}: OCRResultsViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [editedText, setEditedText] = useState(ocrText);

  const handleImportProducts = () => {
    if (extractedProducts.length > 0 && onProductsImport) {
      // extractedProducts is already in MarketplaceListing format
      onProductsImport(extractedProducts);
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
                <div className="space-y-3">
                  {extractedProducts.map((product, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Import {extractedProducts.length} Product{extractedProducts.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

