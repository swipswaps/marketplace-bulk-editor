import { useState, useEffect, useRef } from 'react';
import { Download, Upload, AlertTriangle, Info } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { ProgressToast } from './ProgressToast';
import type { ToastType } from './ProgressToast';
import { apiClient } from '../utils/api';

interface BackupInfo {
  supported: boolean;
  database_type: string;
  database_name: string;
  backup_format: string;
  restore_format: string;
}

export function BackupManager() {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    type: ToastType;
    title: string;
    message?: string;
  }>({ isOpen: false, type: 'info', title: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: ToastType, title: string, message?: string) => {
    setToast({ isOpen: true, type, title, message });
  };

  const loadBackupInfo = async () => {
    try {
      const response = await apiClient.get<BackupInfo>('/api/backup/info');
      setBackupInfo(response);
    } catch (error: unknown) {
      console.error('Failed to load backup info:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', 'Failed to load backup information', errorMessage);
    }
  };

  // Load backup info on mount
  useEffect(() => {
    loadBackupInfo(); // eslint-disable-line react-hooks/set-state-in-effect
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const closeToast = () => {
    setToast({ ...toast, isOpen: false });
  };

  const handleCreateBackup = async () => {
    try {
      showToast('loading', 'Creating backup...', 'This may take a few moments');

      const response = await apiClient.post<{ data: Blob; headers: Headers }>('/api/backup/create', {}, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `marketplace_backup_${new Date().toISOString().split('T')[0]}.sql`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('success', 'Backup created successfully', `Downloaded: ${filename}`);
    } catch (error: unknown) {
      console.error('Backup creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create backup';
      showToast('error', 'Backup failed', errorMessage);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        showToast('error', 'Invalid file type', 'Please select a .sql backup file');
        return;
      }
      setSelectedFile(file);
      setShowRestoreConfirm(true);
    }
  };

  const handleRestoreConfirm = async () => {
    setShowRestoreConfirm(false);

    if (!selectedFile) return;

    try {
      showToast('loading', 'Restoring backup...', 'This may take a few moments');

      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiClient.post('/api/backup/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast('success', 'Backup restored successfully', 'Database has been restored. Please refresh the page.');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);

      // Reload page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: unknown) {
      console.error('Restore failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
      showToast('error', 'Restore failed', errorMessage);
      setSelectedFile(null);
    }
  };

  const handleRestoreCancel = () => {
    setShowRestoreConfirm(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!backupInfo) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">Loading backup information...</p>
      </div>
    );
  }

  if (!backupInfo.supported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
              Backup Not Supported
            </h3>
            <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
              Database backup/restore is only supported for PostgreSQL databases.
              Current database: {backupInfo.database_type}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Info Panel */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-200">Database Backup</p>
              <p className="mt-1 text-blue-800 dark:text-blue-300">
                Database: {backupInfo.database_name} ({backupInfo.database_type})
              </p>
              <p className="mt-1 text-blue-800 dark:text-blue-300">
                Format: {backupInfo.backup_format}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Backup */}
          <button
            onClick={handleCreateBackup}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Create Backup
          </button>

          {/* Restore Backup */}
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium cursor-pointer">
            <Upload className="w-5 h-5" />
            Restore Backup
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Warning */}
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-300">
              <strong>Warning:</strong> Restoring a backup will replace all current data. Make sure to create a backup before restoring.
            </p>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreConfirm}
        title="Restore Database Backup?"
        message={`Are you sure you want to restore from "${selectedFile?.name}"?\n\nThis will replace ALL current data in the database. This action cannot be undone.\n\nMake sure you have created a backup of your current data before proceeding.`}
        confirmText="Restore Backup"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
      />

      {/* Toast Notifications */}
      <ProgressToast
        isOpen={toast.isOpen}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        autoClose={toast.type !== 'loading'}
        onClose={closeToast}
      />
    </>
  );
}

