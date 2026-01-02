/**
 * Auto-save indicator - Shows save status
 */
import { useEffect, useState, useRef } from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date;
  error?: string | null;
}

export default function AutoSaveIndicator({ isSaving, lastSaved, error }: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Show "Saved" message when not saving and no error
    if (!isSaving && lastSaved && !error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSaved(true);
      timerRef.current = setTimeout(() => setShowSaved(false), 3000);
    } else {
      setShowSaved(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isSaving, lastSaved, error]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <span className="animate-pulse">⚠️</span>
        <span>Save failed: {error}</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Saving...</span>
      </div>
    );
  }

  if (showSaved && lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <span>✓</span>
        <span>Saved {formatTime(lastSaved)}</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Last saved {formatTime(lastSaved)}</span>
      </div>
    );
  }

  return null;
}

