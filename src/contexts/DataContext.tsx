/**
 * Data Sync Context
 * Manages synchronization between localStorage and database
 * Implements offline-first with progressive enhancement
 */

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, type Dispatch, type SetStateAction } from 'react';
import { apiClient, type ApiError } from '../utils/api';
import { useAuth } from './AuthContext';
import type { MarketplaceListing } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

// Backend listing format (lowercase keys, used for API communication)
interface BackendListing {
  id?: string;
  title: string;
  price: string;
  condition: string;
  description: string;
  category: string;
  offer_shipping: string;
  source: string;
}

// Invalid listing data for debugging
interface InvalidListingData {
  index: number;
  title: string;
  price: number | string;
  condition: string;
}

// Generic debug data type - intentionally broad for debug logging
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DebugData = Record<string, any> | string | number | boolean | null | undefined;

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  data?: DebugData;
}

interface DataContextType {
  listings: MarketplaceListing[];
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
  isSyncing: boolean;
  debugLogs: DebugLog[];
  setListings: Dispatch<SetStateAction<MarketplaceListing[]>>;
  saveToDatabase: (listingsToSave: MarketplaceListing[]) => Promise<void>;
  loadFromDatabase: () => Promise<MarketplaceListing[]>;
  syncWithDatabase: () => Promise<void>;
  cleanupDuplicates: () => Promise<{ removed: number; remaining: number }>;
  clearError: () => void;
  clearDebugLogs: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper function to load and migrate listings from localStorage
function loadListingsFromStorage(): MarketplaceListing[] {
  const stored = localStorage.getItem('listings');
  if (!stored) return [];

  try {
    const listings = JSON.parse(stored);

    // MIGRATION: Filter out invalid listings and listings with lowercase fields
    // (from old syncWithDatabase bug before transformation was added)
    const validListings = listings.filter((listing: Partial<MarketplaceListing> & Record<string, unknown>) => {
      // Check if listing has lowercase fields (incorrect format from old syncWithDatabase)
      const hasLowercase = 'title' in listing && !('TITLE' in listing);
      if (hasLowercase) {
        console.warn('Removing listing with lowercase fields (old syncWithDatabase bug):', listing);
        return false;
      }

      // Check if listing is valid (has non-empty TITLE, PRICE > 0, CONDITION)
      const hasTitle = listing.TITLE && String(listing.TITLE).trim() !== '';
      const hasPrice = listing.PRICE && Number(listing.PRICE) > 0;
      const hasCondition = listing.CONDITION && String(listing.CONDITION).trim() !== '';
      const isValid = hasTitle && hasPrice && hasCondition;

      if (!isValid) {
        console.warn('Removing invalid listing:', {
          id: listing.id,
          TITLE: listing.TITLE,
          PRICE: listing.PRICE,
          CONDITION: listing.CONDITION,
          reason: !hasTitle ? 'empty TITLE' : !hasPrice ? 'zero/missing PRICE' : 'empty CONDITION'
        });
        return false;
      }

      return true;
    });

    if (validListings.length !== listings.length) {
      localStorage.setItem('listings', JSON.stringify(validListings));
    }

    return validListings;
  } catch (err) {
    console.error('Failed to parse stored listings:', err);
    return [];
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  // Use lazy initializer to load from localStorage - avoids setState in useEffect
  const [listings, setListingsState] = useState<MarketplaceListing[]>(loadListingsFromStorage);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);

  const addDebugLog = (level: DebugLog['level'], message: string, data?: DebugData) => {
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

  // Save to localStorage whenever listings change
  // Support both direct value and functional updates
  const setListings = useCallback((newListings: SetStateAction<MarketplaceListing[]>) => {
    setListingsState(prevListings => {
      const nextListings = typeof newListings === 'function' ? newListings(prevListings) : newListings;
      localStorage.setItem('listings', JSON.stringify(nextListings));
      return nextListings;
    });
  }, []);

  // Wrap syncWithDatabase in useCallback to fix dependency issue
  const syncWithDatabase = useCallback(async () => {
    if (!isAuthenticated) {
      setSyncStatus('offline');
      return;
    }

    // Silent sync - don't show loading state
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
      // AND filter out invalid listings (same logic as loadFromDatabase)
      const dbListings: MarketplaceListing[] = response.listings
        .map(listing => ({
          id: listing.id,
          TITLE: listing.title,
          PRICE: parseFloat(listing.price),
          CONDITION: listing.condition,
          DESCRIPTION: listing.description || '',
          CATEGORY: listing.category || '',
          'OFFER SHIPPING': listing.offer_shipping || 'No',
        }))
        .filter(listing => {
          // Filter out invalid listings (must have non-empty TITLE, PRICE > 0, CONDITION)
          const hasTitle = listing.TITLE && String(listing.TITLE).trim() !== '';
          const hasPrice = listing.PRICE && Number(listing.PRICE) > 0;
          const hasCondition = listing.CONDITION && String(listing.CONDITION).trim() !== '';
          return hasTitle && hasPrice && hasCondition;
        });

      // Only update if database has newer data
      if (dbListings.length > 0) {
        // Use functional update to avoid stale closure (Bug #2 fix)
        setListings((prevListings: MarketplaceListing[]) => {
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

      const invalidListings: InvalidListingData[] = [];
      const backendListings = listingsToSave
        .filter((listing, idx) => {
          // Filter out invalid listings
          const isValid = listing.TITLE && listing.PRICE && listing.CONDITION;
          if (!isValid) {
            const invalidData: InvalidListingData = {
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
        .map((listing): BackendListing => {
          // Bug #1 fix: Include id field for upsert logic
          const backendListing: BackendListing = {
            id: listing.id || undefined,
            title: listing.TITLE,
            price: listing.PRICE.toString(),
            condition: listing.CONDITION,
            description: listing.DESCRIPTION || '',
            category: listing.CATEGORY || '',
            offer_shipping: listing['OFFER SHIPPING'] || 'No',
            source: 'manual',
          };

          return backendListing;
        });

      addDebugLog('info', 'saveToDatabase: Valid listings to send', backendListings.length);
      if (invalidListings.length > 0) {
        addDebugLog('warn', `saveToDatabase: Skipped ${invalidListings.length} invalid listings`, invalidListings);
      }

      // Send all listings to backend
      addDebugLog('info', 'saveToDatabase: Sending to backend', { count: backendListings.length });
      const response = await apiClient.post('/api/listings/bulk', { listings: backendListings });

      addDebugLog('success', 'saveToDatabase: Success!', response as DebugData);
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
      // AND filter out invalid listings (same logic as saveToDatabase)
      const dbListings: MarketplaceListing[] = response.listings
        .map(listing => ({
          id: listing.id,
          TITLE: listing.title,
          PRICE: parseFloat(listing.price),
          CONDITION: listing.condition,
          DESCRIPTION: listing.description || '',
          CATEGORY: listing.category || '',
          'OFFER SHIPPING': listing.offer_shipping || 'No',
        }))
        .filter(listing => {
          // Filter out invalid listings (must have non-empty TITLE, PRICE > 0, CONDITION)
          const hasTitle = listing.TITLE && String(listing.TITLE).trim() !== '';
          const hasPrice = listing.PRICE && Number(listing.PRICE) > 0;
          const hasCondition = listing.CONDITION && String(listing.CONDITION).trim() !== '';
          const isValid = hasTitle && hasPrice && hasCondition;

          if (!isValid) {
            addDebugLog('warn', `loadFromDatabase: Skipping invalid listing from database`, {
              id: listing.id,
              title: listing.TITLE,
              price: listing.PRICE,
              condition: listing.CONDITION,
              reason: !hasTitle ? 'empty TITLE' : !hasPrice ? 'zero/missing PRICE' : 'empty CONDITION'
            });
          }
          return isValid;
        });

      addDebugLog('info', `loadFromDatabase: Loaded ${dbListings.length} valid listings from database`);

      // Check for conflicts with local data
      // Bug #2 fix: Use functional update to avoid stale closure
      if (dbListings.length > 0) {
        setListings((prevListings: MarketplaceListing[]) => {
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
      }>('/api/admin/cleanup/duplicates', {});

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

// eslint-disable-next-line react-refresh/only-export-components
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

