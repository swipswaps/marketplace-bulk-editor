/**
 * File history service for tracking imports, exports, and OCR operations
 */
import { apiClient } from '../utils/api';
import type {
  FileHistory,
  FileHistoryResponse,
  CreateFileHistoryRequest,
} from '../types/fileHistory';

/**
 * Get file history for current user
 */
export const getFileHistory = async (
  page: number = 1,
  perPage: number = 20,
  fileType?: string
): Promise<FileHistoryResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (fileType) {
    params.append('file_type', fileType);
  }

  return apiClient.get<FileHistoryResponse>(`/api/file-history?${params.toString()}`);
};

/**
 * Get single file history record
 */
export const getFileHistoryById = async (id: string): Promise<FileHistory> => {
  return apiClient.get<FileHistory>(`/api/file-history/${id}`);
};

/**
 * Create file history record
 */
export const createFileHistory = async (
  data: CreateFileHistoryRequest
): Promise<FileHistory> => {
  return apiClient.post<FileHistory>('/api/file-history', data);
};

/**
 * Log import operation
 */
export const logImport = async (
  fileName: string,
  fileFormat: 'xlsx' | 'csv' | 'json',
  fileSize: number,
  rowCount: number,
  status: 'success' | 'failed' = 'success',
  errorMessage?: string,
  metadata?: Record<string, unknown>
): Promise<FileHistory> => {
  return createFileHistory({
    file_name: fileName,
    file_type: 'import',
    file_format: fileFormat,
    file_size: fileSize,
    row_count: rowCount,
    operation: 'upload',
    status,
    error_message: errorMessage,
    metadata,
  });
};

/**
 * Log export operation
 */
export const logExport = async (
  fileName: string,
  fileFormat: 'xlsx' | 'csv' | 'json' | 'sql',
  rowCount: number,
  status: 'success' | 'failed' = 'success',
  errorMessage?: string,
  metadata?: Record<string, unknown>
): Promise<FileHistory> => {
  return createFileHistory({
    file_name: fileName,
    file_type: 'export',
    file_format: fileFormat,
    row_count: rowCount,
    operation: 'download',
    status,
    error_message: errorMessage,
    metadata,
  });
};

/**
 * Log OCR operation
 */
export const logOCR = async (
  fileName: string,
  fileSize: number,
  status: 'success' | 'failed' | 'processing' = 'processing',
  errorMessage?: string,
  metadata?: Record<string, unknown>
): Promise<FileHistory> => {
  return createFileHistory({
    file_name: fileName,
    file_type: 'ocr',
    file_format: 'image',
    file_size: fileSize,
    operation: 'scan',
    status,
    error_message: errorMessage,
    metadata,
  });
};

/**
 * Update file history record (for updating status after processing)
 */
export const updateFileHistory = async (
  id: string,
  updates: Partial<CreateFileHistoryRequest>
): Promise<FileHistory> => {
  return apiClient.put<FileHistory>(`/api/file-history/${id}`, updates);
};

/**
 * Delete file history record
 */
export const deleteFileHistory = async (id: string): Promise<void> => {
  return apiClient.delete<void>(`/api/file-history/${id}`);
};

