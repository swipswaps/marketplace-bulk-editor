import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Upload, X, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { TemplateMetadata } from '../types';

interface TemplateUploadProps {
  onTemplateLoad: (template: TemplateMetadata) => void;
  currentTemplate: TemplateMetadata | null;
}

export function TemplateUpload({ onTemplateLoad, currentTemplate }: TemplateUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findHeaderRow = (worksheet: XLSX.WorkSheet): number => {
    // Look for the row containing "TITLE" and "PRICE" columns
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? String(cell.v) : '');
      }
      
      // Check if this row contains the expected column headers
      const rowText = rowData.join('|').toUpperCase();
      if (rowText.includes('TITLE') && rowText.includes('PRICE') && rowText.includes('DESCRIPTION')) {
        return row;
      }
    }
    
    // Default to row 0 if not found
    return 0;
  };

  const processTemplate = useCallback((file: File) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Find the header row
        const headerRowIndex = findHeaderRow(worksheet);
        
        // Extract all rows before the header row
        const headerRows: string[][] = [];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        
        for (let row = range.s.r; row < headerRowIndex; row++) {
          const rowData: string[] = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            rowData.push(cell ? String(cell.v) : '');
          }
          headerRows.push(rowData);
        }

        // Extract column headers
        const columnHeaders: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
          const cell = worksheet[cellAddress];
          columnHeaders.push(cell ? String(cell.v) : '');
        }

        const template: TemplateMetadata = {
          sheetName,
          headerRowIndex,
          headerRows,
          columnHeaders
        };

        onTemplateLoad(template);
        setIsProcessing(false);
      } catch (err) {
        setError(`Failed to process template: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  }, [onTemplateLoad]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processTemplate(acceptedFiles[0]);
    }
  }, [processTemplate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Facebook Template (Optional)
        </h3>
        {currentTemplate && (
          <button
            onClick={() => onTemplateLoad(null as unknown as TemplateMetadata)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
          >
            <X size={14} />
            Clear Template
          </button>
        )}
      </div>

      {currentTemplate ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Template Loaded
              </p>
              <div className="mt-2 text-xs text-green-700 dark:text-green-300 space-y-1">
                <p>Sheet: <span className="font-mono">{currentTemplate.sheetName}</span></p>
                <p>Header rows: {currentTemplate.headerRows.length}</p>
                <p>Columns: {currentTemplate.columnHeaders.filter(h => h).join(', ')}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isProcessing ? (
              <>
                <Upload className="text-blue-500 animate-bounce" size={32} />
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing template...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="text-gray-400 dark:text-gray-500" size={32} />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isDragActive ? 'Drop template here' : 'Upload Facebook template (optional)'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload the official Facebook Marketplace template to preserve its structure
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}

