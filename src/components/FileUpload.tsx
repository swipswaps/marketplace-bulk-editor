import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: MarketplaceListing[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          // Validation warnings
          const warnings: string[] = [];
          let emptyTitles = 0;
          let invalidPrices = 0;
          let emptyDescriptions = 0;

          // Transform data to MarketplaceListing format
          const listings: MarketplaceListing[] = jsonData.map((row) => {
            // Check for validation issues
            if (!row.TITLE || row.TITLE.trim() === '') {
              emptyTitles++;
            }
            if (!row.PRICE || isNaN(Number(row.PRICE)) || Number(row.PRICE) <= 0) {
              invalidPrices++;
            }
            if (!row.DESCRIPTION || row.DESCRIPTION.trim() === '') {
              emptyDescriptions++;
            }

            return {
              id: crypto.randomUUID(),
              TITLE: row.TITLE || '',
              PRICE: row.PRICE || 0,
              CONDITION: row.CONDITION || 'New',
              DESCRIPTION: row.DESCRIPTION || '',
              CATEGORY: row.CATEGORY || 'Electronics',
              'OFFER SHIPPING': row['OFFER SHIPPING'] || 'No'
            };
          });

          // Build warning message
          if (emptyTitles > 0) warnings.push(`${emptyTitles} listing(s) with empty titles`);
          if (invalidPrices > 0) warnings.push(`${invalidPrices} listing(s) with invalid prices`);
          if (emptyDescriptions > 0) warnings.push(`${emptyDescriptions} listing(s) with empty descriptions`);

          // Show warnings if any
          if (warnings.length > 0) {
            const warningMsg = `⚠️ Import completed with warnings:\n\n${warnings.join('\n')}\n\nPlease review and fix these issues before exporting.`;
            alert(warningMsg);
          }

          onDataLoaded(listings);
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Error parsing file. Please make sure it\'s a valid Excel file.');
        }
      };

      reader.readAsBinaryString(file);
    });
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
      {isDragActive ? (
        <p className="text-lg text-blue-600 dark:text-blue-400">Drop the files here...</p>
      ) : (
        <div>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
            Drag & drop Excel files here, or click to select
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports .xlsx, .xls, and .csv files
          </p>
        </div>
      )}
    </div>
  );
}

