/**
 * Editor Tab - Main editing interface with DataTable and controls
 */
import { DataTable } from './DataTable';
import { ExportButton } from './ExportButton';
import { SyncStatus } from './SyncStatus';
import AutoSaveIndicator from './AutoSaveIndicator';
import type { MarketplaceListing, TemplateMetadata } from '../types';

interface EditorTabProps {
  listings: MarketplaceListing[];
  setListings: (listings: MarketplaceListing[]) => void;
  sortField: keyof MarketplaceListing | null;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (field: keyof MarketplaceListing) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkEdit: (ids: string[], field: keyof MarketplaceListing, value: string) => void;
  template: TemplateMetadata | null;
  marketplace: 'facebook' | 'ebay' | 'amazon';
  isSyncing: boolean;
  autoSaveState?: {
    isSaving: boolean;
    lastSaved?: Date;
    error?: string | null;
  };
}

export default function EditorTab({
  listings,
  setListings,
  sortField,
  sortDirection,
  onSort,
  onDelete,
  onDuplicate,
  onBulkDelete,
  onBulkEdit,
  template,
  marketplace,
  isSyncing,
  autoSaveState,
}: EditorTabProps) {
  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </span>
          {isSyncing && <SyncStatus />}
          {autoSaveState && (
            <AutoSaveIndicator
              isSaving={autoSaveState.isSaving}
              lastSaved={autoSaveState.lastSaved}
              error={autoSaveState.error}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={listings}
            template={template}
            sortField={sortField}
            sortDirection={sortDirection}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={listings}
        onUpdate={setListings}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          if (field) onSort(field);
        }}
      />

      {/* Empty State */}
      {listings.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">No listings yet</p>
          <p className="text-sm">
            Upload a file, use OCR, or search sites to get started
          </p>
        </div>
      )}
    </div>
  );
}

