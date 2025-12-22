/**
 * Data Sync Context
 * Manages synchronization between localStorage and database
 * Implements offline-first with progressive enhancement
 */

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { apiClient, type ApiError } from '../utils/api';
import { useAuth } from './AuthContext';
import type { MarketplaceListing } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: any;
}

interface DataContextType {
  listings: MarketplaceListing[];
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
  isSyncing: boolean;
  debugLogs: DebugLog[];
  setListings: (listings: MarketplaceListing[]) => void;
  saveToDatabase: (listingsToSave: MarketplaceListing[]) => Promise<void>;
  loadFromDatabase: () => Promise<MarketplaceListing[]>;
  syncWithDatabase: () => Promise<void>;
  cleanupDuplicates: () => Promise<{ removed: number; remaining: number }>;
  clearError: () => void;
  clearDebugLogs: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [listings, setListingsState] = useState<MarketplaceListing[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (level: DebugLog['level'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    setDebugLogs(prev => [...prev, log]);

    // Also log to console
    const emoji = { info: '🔵', warn: '⚠️', error: '❌', success: '✅' }[level];
    if (data) {
      console.log(`${emoji} [${message}]`, data);
    } else {
      console.log(`${emoji} [${message}]`);
    }
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('listings');
    if (stored) {
      try {
        setListingsState(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse stored listings:', err);
      }
    }
  }, []);

  // Save to localStorage whenever listings change
  const setListings = useCallback((newListings: MarketplaceListing[]) => {
    setListingsState(newListings);
    localStorage.setItem('listings', JSON.stringify(newListings));
  }, []);

  // Wrap syncWithDatabase in useCallback to fix dependency issue
  const syncWithDatabase = useCallback(async () => {
    if (!isAuthenticated) {
      setSyncStatus('offline');
      return;
    }

    // Silent sync - don't show loading state
    try {
      const response = await apiClient.get<{ listings: MarketplaceListing[] }>('/api/listings');
      const dbListings = response.listings;

      // Only update if database has newer data
      if (dbListings.length > 0) {
        // Use functional update to avoid stale closure (Bug #2 fix)
        setListings(prevListings => {
          const merged = mergeListings(prevListings, dbListings);
          // Optimize comparison - check length first (Bug #3 fix)
          if (merged.length !== prevListings.length || JSON.stringify(merged) !== JSON.stringify(prevListings)) {
            return merged;
          }
          return prevListings;
        });
      }

      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch {
      setSyncStatus('offline');
    }
  }, [isAuthenticated, setListings]);

  // Auto-sync every 30 seconds if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      syncWithDatabase();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, syncWithDatabase]);

  const saveToDatabase = async (listingsToSave: MarketplaceListing[]) => {
    addDebugLog('info', 'saveToDatabase: Starting save operation');
    addDebugLog('info', 'saveToDatabase: isAuthenticated', isAuthenticated);
    addDebugLog('info', 'saveToDatabase: listingsToSave.length', listingsToSave.length);

    if (!isAuthenticated) {
      addDebugLog('error', 'saveToDatabase: Not authenticated');
      setError('Please login to save to database');
      return;
    }

    setSyncStatus('syncing');
    setError(null);

    try {
      // Transform frontend format (UPPERCASE) to backend format (lowercase)
      addDebugLog('info', 'saveToDatabase: Transforming listings');

      const invalidListings: any[] = [];
      const backendListings = listingsToSave
        .filter((listing, idx) => {
          // Filter out invalid listings
          const isValid = listing.TITLE && listing.PRICE && listing.CONDITION;
          if (!isValid) {
            const invalidData = {
              index: idx,
              title: listing.TITLE,
              price: listing.PRICE,
              condition: listing.CONDITION,
            };
            invalidListings.push(invalidData);
            addDebugLog('warn', `saveToDatabase: Skipping invalid listing ${idx}`, invalidData);
          }
          return isValid;
        })
        .map((listing) => {
          // Bug #1 fix: Include id field for upsert logic
          const backendListing: any = {
            title: listing.TITLE,
            price: listing.PRICE.toString(),
            condition: listing.CONDITION,
            description: listing.DESCRIPTION || '',
            category: listing.CATEGORY || '',
            offer_shipping: listing['OFFER SHIPPING'] || 'No',
            source: 'manual',
          };

          // Include id if it exists (for update), omit if new (for create)
          if (listing.id) {
            backendListing.id = listing.id;
          }

          return backendListing;
        });

      addDebugLog('info', 'saveToDatabase: Valid listings to send', backendListings.length);
      if (invalidListings.length > 0) {
        addDebugLog('warn', `saveToDatabase: Skipped ${invalidListings.length} invalid listings`, invalidListings);
      }

      // Send all listings to backend
      addDebugLog('info', 'saveToDatabase: Sending to backend', { count: backendListings.length });
      const response = await apiClient.post('/api/listings/bulk', { listings: backendListings });

      addDebugLog('success', 'saveToDatabase: Success!', response);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (err) {
      const apiError = err as ApiError;
      addDebugLog('error', 'saveToDatabase: Error caught', {
        message: apiError.message,
        error: err,
      });
      setError(apiError.message || 'Failed to save to database');
      setSyncStatus('error');
      throw err;
    }
  };

  const loadFromDatabase = async (): Promise<MarketplaceListing[]> => {
    if (!isAuthenticated) {
      setError('Please login to load from database');
      return [];
    }

    setSyncStatus('syncing');
    setError(null);

    try {
      // Backend returns lowercase field names, need to transform to frontend format
      interface BackendListing {
        id: string;
        title: string;
        price: string;
        condition: string;
        description?: string;
        category?: string;
        offer_shipping?: string;
      }

      const response = await apiClient.get<{ listings: BackendListing[] }>('/api/listings');

      // Transform backend format (lowercase) to frontend format (UPPERCASE)
      const dbListings: MarketplaceListing[] = response.listings.map(listing => ({
        id: listing.id,
        TITLE: listing.title,
        PRICE: parseFloat(listing.price),
        CONDITION: listing.condition,
        DESCRIPTION: listing.description || '',
        CATEGORY: listing.category || '',
        'OFFER SHIPPING': listing.offer_shipping || 'No',
      }));

      // Check for conflicts with local data
      // Bug #2 fix: Use functional update to avoid stale closure
      if (dbListings.length > 0) {
        setListings(prevListings => {
          if (prevListings.length > 0) {
            // Merge both (keep all unique listings)
            return mergeListings(prevListings, dbListings);
          } else {
            // No local listings, just use database listings
            return dbListings;
          }
        });
        setSyncStatus('synced');
        setLastSyncTime(new Date());
        return dbListings;
      }

      setSyncStatus('synced');
      setLastSyncTime(new Date());
      return [];
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load from database');
      setSyncStatus('error');
      throw err;
    }
  };



  const cleanupDuplicates = async (): Promise<{ removed: number; remaining: number }> => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to cleanup duplicates');
    }

    addDebugLog('info', 'cleanupDuplicates: Starting cleanup');
    setSyncStatus('syncing');

    try {
      const response = await apiClient.post<{
        message: string;
        removed: number;
        remaining: number;
      }>('/api/admin/cleanup/duplicates');

      addDebugLog('success', `cleanupDuplicates: ${response.message}`, {
        removed: response.removed,
        remaining: response.remaining
      });

      // CRITICAL: Clear local state BEFORE reloading from database
      // This prevents merging clean database with dirty localStorage
      setListings([]);

      // Reload listings from database after cleanup
      // This will now REPLACE (not merge) because local state is empty
      await loadFromDatabase();

      setSyncStatus('synced');
      setLastSyncTime(new Date());

      return {
        removed: response.removed,
        remaining: response.remaining
      };
    } catch (err) {
      const apiError = err as ApiError;
      const errorMsg = apiError.message || 'Failed to cleanup duplicates';
      setError(errorMsg);
      setSyncStatus('error');
      addDebugLog('error', `cleanupDuplicates: ${errorMsg}`, apiError);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: DataContextType = {
    listings,
    syncStatus,
    lastSyncTime,
    error,
    isSyncing: syncStatus === 'syncing',
    debugLogs,
    setListings,
    saveToDatabase,
    loadFromDatabase,
    syncWithDatabase,
    cleanupDuplicates,
    clearError,
    clearDebugLogs,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Helper function to merge listings (keep unique by ID)
function mergeListings(
  local: MarketplaceListing[],
  remote: MarketplaceListing[]
): MarketplaceListing[] {
  const map = new Map<string, MarketplaceListing>();

  // Add local listings
  local.forEach(listing => {
    if (listing.id) {
      map.set(listing.id, listing);
    }
  });

  // Add/update with remote listings (remote takes precedence)
  remote.forEach(listing => {
    if (listing.id) {
      map.set(listing.id, listing);
    }
  });

  return Array.from(map.values());
}

