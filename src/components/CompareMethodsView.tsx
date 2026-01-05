/**
 * Compare Methods View Component
 * Compare OCR results from different preprocessing methods with live method switching
 */

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { ComparisonResult } from '../types';
import 'img-comparison-slider';

interface CompareMethodsViewProps {
  comparisonHistory: ComparisonResult[];
  originalImageUrl: string;
  onImportResult?: (result: ComparisonResult) => void;
}

export function CompareMethodsView({ comparisonHistory, originalImageUrl, onImportResult }: CompareMethodsViewProps) {
  const [leftMethodIndex, setLeftMethodIndex] = useState(0);
  const [rightMethodIndex, setRightMethodIndex] = useState(Math.min(1, comparisonHistory.length - 1));

  if (comparisonHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No preprocessing methods have been applied yet.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Go to the Image tab and select preprocessing methods to compare.
        </p>
      </div>
    );
  }

  if (comparisonHistory.length === 1) {
    const result = comparisonHistory[0];
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Only one preprocessing method has been applied. Apply more methods to enable comparison.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {result.method}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <span className="ml-2 font-medium">{(result.confidence * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Products:</span>
              <span className="ml-2 font-medium">{result.productCount}</span>
            </div>
          </div>
          <div className="mt-4">
            <img 
              src={originalImageUrl} 
              alt="Processed result" 
              className="w-full rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      </div>
    );
  }

  const leftResult = comparisonHistory[leftMethodIndex];
  const rightResult = comparisonHistory[rightMethodIndex];

  return (
    <div className="space-y-4">
      {/* Method Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Left Method
          </label>
          <select
            value={leftMethodIndex}
            onChange={(e) => setLeftMethodIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {comparisonHistory.map((result, idx) => (
              <option key={idx} value={idx}>
                {result.method} ({(result.confidence * 100).toFixed(0)}% confidence, {result.productCount} products)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Right Method
          </label>
          <select
            value={rightMethodIndex}
            onChange={(e) => setRightMethodIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {comparisonHistory.map((result, idx) => (
              <option key={idx} value={idx}>
                {result.method} ({(result.confidence * 100).toFixed(0)}% confidence, {result.productCount} products)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Comparison Slider */}
      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <img-comparison-slider>
          <img slot="first" src={originalImageUrl} alt={leftResult.method} />
          <img slot="second" src={originalImageUrl} alt={rightResult.method} />
        </img-comparison-slider>
      </div>

      {/* Results Comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">{leftResult.method}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <span className="font-medium">{(leftResult.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Products:</span>
              <span className="font-medium">{leftResult.productCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Processed:</span>
              <span className="font-medium">{new Date(leftResult.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">{rightResult.method}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <span className="font-medium">{(rightResult.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Products:</span>
              <span className="font-medium">{rightResult.productCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Processed:</span>
              <span className="font-medium">{rightResult.timestamp ? new Date(rightResult.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Import Best Result Button */}
      {onImportResult && (
        <div className="mt-4">
          <button
            onClick={() => {
              // Find result with most products
              const bestResult = comparisonHistory.reduce((best, current) =>
                current.productCount > best.productCount ? current : best
              );
              onImportResult(bestResult);
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <CheckCircle size={16} />
            Import Best Result ({comparisonHistory.reduce((best, r) => r.productCount > best.productCount ? r : best).method} - {comparisonHistory.reduce((best, r) => r.productCount > best.productCount ? r : best).productCount} products)
          </button>
        </div>
      )}
    </div>
  );
}

