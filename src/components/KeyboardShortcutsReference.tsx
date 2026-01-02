/**
 * Keyboard Shortcuts Reference Component
 * Shows all available keyboard shortcuts in the application
 */

import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Editing
  { keys: ['Ctrl', 'Z'], description: 'Undo last change', category: 'Editing' },
  { keys: ['Ctrl', 'Y'], description: 'Redo last undone change', category: 'Editing' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)', category: 'Editing' },
  
  // Table Navigation
  { keys: ['↑'], description: 'Move to cell above', category: 'Table Navigation' },
  { keys: ['↓'], description: 'Move to cell below', category: 'Table Navigation' },
  { keys: ['←'], description: 'Move to cell on left', category: 'Table Navigation' },
  { keys: ['→'], description: 'Move to cell on right', category: 'Table Navigation' },
  { keys: ['Tab'], description: 'Move to next cell', category: 'Table Navigation' },
  { keys: ['Enter'], description: 'Start editing focused cell', category: 'Table Navigation' },
  { keys: ['Escape'], description: 'Cancel editing', category: 'Table Navigation' },
  
  // Chart Navigation
  { keys: ['←'], description: 'Previous chart', category: 'Chart Navigation' },
  { keys: ['→'], description: 'Next chart', category: 'Chart Navigation' },
  
  // General
  { keys: ['Escape'], description: 'Close modal/dialog', category: 'General' },
];

// Group shortcuts by category
const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = [];
  }
  acc[shortcut.category].push(shortcut);
  return acc;
}, {} as Record<string, Shortcut[]>);

export function KeyboardShortcutsReference() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard size={20} className="text-gray-700 dark:text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category}>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {category}
            </h4>
            <div className="space-y-2">
              {categoryShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description}
                  </span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex}>
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                          {key === 'Ctrl' && navigator.platform.includes('Mac') ? '⌘' : key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="mx-1 text-gray-500 dark:text-gray-400">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-xs text-gray-700 dark:text-gray-300">
          <strong>Tip:</strong> On Mac, <kbd className="px-1 py-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Ctrl</kbd> is replaced with <kbd className="px-1 py-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">⌘ Cmd</kbd>
        </p>
      </div>
    </div>
  );
}

