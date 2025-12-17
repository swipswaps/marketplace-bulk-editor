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
          
          // Transform data to MarketplaceListing format
          const listings: MarketplaceListing[] = jsonData.map((row) => ({
            id: crypto.randomUUID(),
            TITLE: row.TITLE || '',
            PRICE: row.PRICE || 0,
            CONDITION: row.CONDITION || 'New',
            DESCRIPTION: row.DESCRIPTION || '',
            CATEGORY: row.CATEGORY || 'Electronics',
            'OFFER SHIPPING': row['OFFER SHIPPING'] || 'No'
          }));
          
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
      className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-xl'
          : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg hover:scale-102'
      }`}
    >
      <input {...getInputProps()} />
      <div className={`transition-all duration-300 ${isDragActive ? 'scale-110' : ''}`}>
        <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
          <Upload className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors ${
            isDragActive ? 'text-blue-600' : 'text-blue-500'
          }`} />
        </div>
        {isDragActive ? (
          <div>
            <p className="text-lg sm:text-xl font-semibold text-blue-600 mb-2">
              Drop the files here! 🎯
            </p>
            <p className="text-sm text-blue-500">
              Release to upload
            </p>
          </div>
        ) : (
          <div>
            <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
              📁 Drag & drop Excel files here
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-3">
              or click to browse your files
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                .xlsx
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                .xls
              </span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                .csv
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              💡 You can upload multiple files at once
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

