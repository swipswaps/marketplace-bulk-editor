/**
 * Auto-save hook - Automatically saves data to localStorage
 */
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions {
  key: string;
  delay?: number; // milliseconds
  enabled?: boolean;
}

interface UseAutoSaveReturn<T> {
  isSaving: boolean;
  lastSaved: Date | undefined;
  error: string | null;
  save: (data: T) => void;
  clearSaved: () => void;
  getSaved: () => T | null;
}

export function useAutoSave<T>({
  key,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn<T> {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T | null>(null);

  const save = useCallback((data: T) => {
    if (!enabled) return;

    dataRef.current = data;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      setError(null);

      try {
        localStorage.setItem(key, JSON.stringify(data));
        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      } finally {
        setIsSaving(false);
      }
    }, delay);
  }, [key, delay, enabled]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setLastSaved(undefined);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear saved data');
    }
  }, [key]);

  const getSaved = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      return JSON.parse(saved) as T;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved data');
      return null;
    }
  }, [key]);

  // Load last saved timestamp on mount
  useEffect(() => {
    const saved = getSaved();
    if (saved) {
      // Check if there's a timestamp in localStorage
      const timestampKey = `${key}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      if (timestamp) {
        setLastSaved(new Date(timestamp));
      }
    }
  }, [key, getSaved]);

  // Save timestamp when data is saved
  useEffect(() => {
    if (lastSaved) {
      const timestampKey = `${key}_timestamp`;
      localStorage.setItem(timestampKey, lastSaved.toISOString());
    }
  }, [key, lastSaved]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    save,
    clearSaved,
    getSaved,
  };
}

