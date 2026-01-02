/**
 * File history types matching backend FileHistory model
 */

export type FileType = 'import' | 'export' | 'ocr' | 'template';
export type FileFormat = 'xlsx' | 'csv' | 'json' | 'txt' | 'sql' | 'image';
export type FileOperation = 'upload' | 'download' | 'scan';
export type FileStatus = 'success' | 'failed' | 'processing';

export interface FileHistoryMetadata {
  template?: string;
  engine?: string;
  confidence?: number;
  error_details?: string;
  [key: string]: unknown;
}

export interface FileHistory {
  id: string;
  user_id: string;
  file_name: string;
  file_type: FileType;
  file_format: FileFormat;
  file_size?: number;
  row_count?: number;
  operation: FileOperation;
  status: FileStatus;
  error_message?: string;
  metadata?: FileHistoryMetadata;
  created_at: string;
  updated_at: string;
}

export interface FileHistoryResponse {
  file_history: FileHistory[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateFileHistoryRequest {
  file_name: string;
  file_type: FileType;
  file_format: FileFormat;
  file_size?: number;
  row_count?: number;
  operation: FileOperation;
  status: FileStatus;
  error_message?: string;
  metadata?: FileHistoryMetadata;
}

