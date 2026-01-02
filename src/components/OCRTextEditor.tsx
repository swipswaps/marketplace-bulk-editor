/**
 * OCR Text Editor Component
 * Edit OCR-extracted text with confidence highlighting and error suggestions
 */

import { useState, useEffect } from 'react';
import { Wand2, Copy, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import { fixOCRErrors, suggestCorrections } from '../utils/ocrPostProcessing';

interface OCRTextEditorProps {
  initialText: string;
  confidence?: number;
  onTextChange?: (text: string) => void;
  onApply?: (text: string) => void;
}

export function OCRTextEditor({
  initialText,
  confidence = 0.8,
  onTextChange,
  onApply
}: OCRTextEditorProps) {
  const [text, setText] = useState(initialText);
  const [originalText] = useState(initialText);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const handleAutoFix = () => {
    const fixed = fixOCRErrors(text);
    setText(fixed);
    onTextChange?.(fixed);
  };

  const handleReset = () => {
    setText(originalText);
    onTextChange?.(originalText);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-text-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTextSelect = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    if (start !== end) {
      const selected = text.substring(start, end);
      setSelectedWord(selected.trim());
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!selectedWord) return;

    const newText = text.replace(selectedWord, suggestion);
    setText(newText);
    onTextChange?.(newText);
    setShowSuggestions(false);
  };

  const suggestions = selectedWord ? suggestCorrections(selectedWord) : [];
  const hasChanges = text !== originalText;
  const isLowConfidence = confidence < 0.7;

  return (
    <div className="space-y-3">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            OCR Text
          </h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${
              confidence >= 0.9 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {(confidence * 100).toFixed(0)}% confidence
            </span>
            {isLowConfidence && (
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                <AlertTriangle size={12} />
                <span>Low confidence - review carefully</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoFix}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
            title="Auto-fix common OCR errors"
          >
            <Wand2 size={14} />
            Auto-Fix
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Reset to original"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Download as text file"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Text editor */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTextChange?.(e.target.value);
          }}
          onMouseUp={handleTextSelect}
          className={`w-full h-64 px-3 py-2 font-mono text-sm border rounded-lg resize-y ${
            isLowConfidence 
              ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-900/10' 
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="OCR text will appear here..."
        />

        {/* Suggestions popup */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px]">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggestions for "{selectedWord}":
            </div>
            <div className="space-y-1">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span>{text.length} characters</span>
        <span>{text.split(/\s+/).filter(w => w).length} words</span>
        <span>{text.split('\n').length} lines</span>
        {hasChanges && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Modified
          </span>
        )}
      </div>

      {/* Apply button */}
      {onApply && (
        <div className="flex justify-end">
          <button
            onClick={() => onApply(text)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
}

