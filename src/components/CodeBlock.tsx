/**
 * Code Block Component with Copy-to-Clipboard
 * Used in documentation to show code examples with copy functionality
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Extract language from className (e.g., "language-bash" -> "bash")
  const language = className?.replace('language-', '') || '';
  
  // Get code content as string
  const codeContent = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Inline code (single backticks) - no copy button
  if (inline) {
    return (
      <code className="text-sm px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400">
        {children}
      </code>
    );
  }

  // Code block (triple backticks) - with copy button
  return (
    <div className="relative group">
      {/* Language label */}
      {language && (
        <div className="absolute top-2 left-3 text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">
          {language}
        </div>
      )}
      
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <Check size={16} className="text-green-600 dark:text-green-400" />
        ) : (
          <Copy size={16} className="text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {/* Code content */}
      <pre className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className={`${className} text-gray-900 dark:text-gray-100`}>
          {children}
        </code>
      </pre>
    </div>
  );
}

