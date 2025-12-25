/**
 * Debug Console Component
 * Displays live console output (log, error, warn, info) in the UI
 * Prevents need for users to open browser console (F12)
 */

import { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { consoleCapture, type ConsoleEntry } from '../utils/consoleCapture';

export function DebugConsole() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (entry: ConsoleEntry) => {
      setEntries(prev => [...prev, entry]);
    };

    consoleCapture.addListener(listener);

    return () => {
      consoleCapture.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  const handleClear = () => {
    setEntries([]);
  };

  const handleCopy = () => {
    const text = entries.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `[${time}] [${entry.level.toUpperCase()}] ${entry.message}`;
    }).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert('Console output copied to clipboard!');
    });
  };

  const getLevelColor = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getLevelIcon = (level: ConsoleEntry['level']) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔵';
    }
  };

  const errorCount = entries.filter(e => e.level === 'error').length;
  const warnCount = entries.filter(e => e.level === 'warn').length;

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Terminal className="text-gray-600 dark:text-gray-400" size={20} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Console
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
              {entries.length} entries
            </span>
            {errorCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-400">
                {errorCount} errors
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 rounded text-yellow-700 dark:text-yellow-400">
                {warnCount} warnings
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoScroll(!autoScroll);
                }}
                className={`text-xs px-2 py-1 rounded ${
                  autoScroll 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Auto-scroll to bottom"
              >
                Auto-scroll
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                title="Copy all to clipboard"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
                title="Clear console"
              >
                <Trash2 size={14} />
                Clear
              </button>
            </>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Console Output */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-h-96 overflow-y-auto font-mono text-xs bg-black text-green-400 p-4 rounded">
            {entries.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-600 italic">
                No console output yet. All console.log, console.error, console.warn, and console.info calls will appear here.
              </div>
            ) : (
              entries.map((entry, idx) => (
                <div key={idx} className={`mb-1 ${getLevelColor(entry.level)}`}>
                  <span className="text-gray-500 dark:text-gray-600">
                    [{new Date(entry.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span className="font-semibold">
                    {getLevelIcon(entry.level)} [{entry.level.toUpperCase()}]
                  </span>{' '}
                  <span className="whitespace-pre-wrap break-all">
                    {entry.message}
                  </span>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

