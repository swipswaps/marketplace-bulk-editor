/**
 * Debug Console Component
 * Displays live console output (log, error, warn, info) in the UI
 * Prevents need for users to open browser console (F12)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Terminal, Copy, Trash2, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { consoleCapture, type ConsoleEntry } from '../utils/consoleCapture';

interface GroupedEntry {
  message: string;
  level: ConsoleEntry['level'];
  count: number;
  firstTimestamp: number;
  lastTimestamp: number;
  entries: ConsoleEntry[];
}

export function DebugConsole() {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info' | 'log'>('all');
  const [showFilters, setShowFilters] = useState(false);
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

  // Group consecutive identical messages (Chrome DevTools pattern)
  const groupedEntries = useMemo(() => {
    const groups: GroupedEntry[] = [];

    entries.forEach(entry => {
      const lastGroup = groups[groups.length - 1];

      // Check if this entry can be grouped with the last one
      if (lastGroup &&
          lastGroup.message === entry.message &&
          lastGroup.level === entry.level) {
        // Update existing group
        lastGroup.count++;
        lastGroup.lastTimestamp = new Date(entry.timestamp).getTime();
        lastGroup.entries.push(entry);
      } else {
        // Create new group
        groups.push({
          message: entry.message,
          level: entry.level,
          count: 1,
          firstTimestamp: new Date(entry.timestamp).getTime(),
          lastTimestamp: new Date(entry.timestamp).getTime(),
          entries: [entry],
        });
      }
    });

    return groups;
  }, [entries]);

  // Filter by level
  const filteredGroups = useMemo(() => {
    if (filterLevel === 'all') return groupedEntries;
    return groupedEntries.filter(group => group.level === filterLevel);
  }, [groupedEntries, filterLevel]);

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  const handleClear = () => {
    setEntries([]);
  };

  const handleCopy = () => {
    const text = filteredGroups.map(group => {
      const time = new Date(group.firstTimestamp).toLocaleTimeString();
      const countSuffix = group.count > 1 ? ` (× ${group.count})` : '';
      return `[${time}] [${group.level.toUpperCase()}] ${group.message}${countSuffix}`;
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
  const infoCount = entries.filter(e => e.level === 'info').length;
  const logCount = entries.filter(e => e.level === 'log').length;

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
                  setShowFilters(!showFilters);
                }}
                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                  showFilters || filterLevel !== 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Filter by level"
              >
                <Filter size={14} />
                Filter
              </button>
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

      {/* Filter Bar */}
      {isExpanded && showFilters && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600 dark:text-gray-400">Show:</span>
            <button
              onClick={() => setFilterLevel('all')}
              className={`text-xs px-2 py-1 rounded ${
                filterLevel === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({entries.length})
            </button>
            <button
              onClick={() => setFilterLevel('error')}
              className={`text-xs px-2 py-1 rounded ${
                filterLevel === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              ❌ Errors ({errorCount})
            </button>
            <button
              onClick={() => setFilterLevel('warn')}
              className={`text-xs px-2 py-1 rounded ${
                filterLevel === 'warn'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              ⚠️ Warnings ({warnCount})
            </button>
            <button
              onClick={() => setFilterLevel('info')}
              className={`text-xs px-2 py-1 rounded ${
                filterLevel === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              ℹ️ Info ({infoCount})
            </button>
            <button
              onClick={() => setFilterLevel('log')}
              className={`text-xs px-2 py-1 rounded ${
                filterLevel === 'log'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🔵 Logs ({logCount})
            </button>
          </div>
        </div>
      )}

      {/* Console Output */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-h-96 overflow-y-auto font-mono text-xs bg-black text-green-400 p-4 rounded">
            {filteredGroups.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-600 italic">
                {filterLevel === 'all'
                  ? 'No console output yet. All console.log, console.error, console.warn, and console.info calls will appear here.'
                  : `No ${filterLevel} messages.`
                }
              </div>
            ) : (
              filteredGroups.map((group, idx) => (
                <div key={idx} className={`mb-1 ${getLevelColor(group.level)}`}>
                  <span className="text-gray-500 dark:text-gray-600">
                    [{new Date(group.firstTimestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span className="font-semibold">
                    {getLevelIcon(group.level)} [{group.level.toUpperCase()}]
                  </span>{' '}
                  {group.count > 1 && (
                    <span className="inline-block px-1.5 py-0.5 bg-gray-700 text-yellow-400 rounded text-xs font-bold mr-2">
                      × {group.count}
                    </span>
                  )}
                  <span className="whitespace-pre-wrap break-all">
                    {group.message}
                  </span>
                  {group.count > 1 && (
                    <span className="text-gray-600 dark:text-gray-500 ml-2 text-xs">
                      (last: {new Date(group.lastTimestamp).toLocaleTimeString()})
                    </span>
                  )}
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

