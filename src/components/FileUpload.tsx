import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Table, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing, TemplateMetadata } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: MarketplaceListing[]) => void;
  onTemplateDetected?: (template: TemplateMetadata, sampleData: MarketplaceListing[]) => void;
}

interface TemplateDetectionModal {
  show: boolean;
  fileName: string;
  template: TemplateMetadata | null;
  sampleData: MarketplaceListing[];
}

export function FileUpload({ onDataLoaded, onTemplateDetected }: FileUploadProps) {
  const [templateModal, setTemplateModal] = useState<TemplateDetectionModal>({
    show: false,
    fileName: '',
    template: null,
    sampleData: []
  });

  const isTemplateFile = (fileName: string, headerRows: string[][], dataRowCount: number): boolean => {
    // Check if file name suggests it's a template
    const nameIsTemplate = /template/i.test(fileName);

    // Check if there are header rows before the data (like "Facebook Marketplace Bulk Upload Template")
    const hasHeaderRows = headerRows.length > 0 && headerRows.some(row =>
      row.some(cell => /template|facebook|marketplace|bulk.*upload/i.test(cell))
    );

    // Check if there are very few data rows (templates usually have 1-5 sample rows)
    const hasFewRows = dataRowCount > 0 && dataRowCount <= 5;

    return nameIsTemplate || (hasHeaderRows && hasFewRows);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Find the header row by looking for TITLE, PRICE, DESCRIPTION columns
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          let headerRowIndex = 0;

          for (let row = range.s.r; row <= Math.min(range.s.r + 10, range.e.r); row++) {
            const rowData: string[] = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
              const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
              const cell = worksheet[cellAddress];
              rowData.push(cell ? String(cell.v).toUpperCase() : '');
            }

            const rowText = rowData.join('|');
            if (rowText.includes('TITLE') && rowText.includes('PRICE') && rowText.includes('DESCRIPTION')) {
              headerRowIndex = row;
              break;
            }
          }

          // Extract header rows (rows before the column headers)
          const headerRows: string[][] = [];
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

          // Parse data starting from the header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            range: headerRowIndex,
            defval: ''
          }) as Record<string, string | number>[];

          // Validation warnings
          const warnings: string[] = [];
          let emptyTitles = 0;
          let invalidPrices = 0;
          let emptyDescriptions = 0;

          // Transform data to MarketplaceListing format
          const listings: MarketplaceListing[] = jsonData.map((row) => {
            // Check for validation issues
            const title = String(row.TITLE || '');
            const description = String(row.DESCRIPTION || '');

            if (!title || title.trim() === '') {
              emptyTitles++;
            }
            if (!row.PRICE || isNaN(Number(row.PRICE)) || Number(row.PRICE) <= 0) {
              invalidPrices++;
            }
            if (!description || description.trim() === '') {
              emptyDescriptions++;
            }

            return {
              id: crypto.randomUUID(),
              TITLE: title,
              PRICE: row.PRICE || 0,
              CONDITION: String(row.CONDITION || 'New'),
              DESCRIPTION: description,
              CATEGORY: String(row.CATEGORY || 'Electronics'),
              'OFFER SHIPPING': String(row['OFFER SHIPPING'] || 'No')
            };
          });

          // Build warning message
          if (emptyTitles > 0) warnings.push(`${emptyTitles} listing(s) with empty titles`);
          if (invalidPrices > 0) warnings.push(`${invalidPrices} listing(s) with invalid prices`);
          if (emptyDescriptions > 0) warnings.push(`${emptyDescriptions} listing(s) with empty descriptions`);

          // Check if this looks like a template file
          if (onTemplateDetected && isTemplateFile(file.name, headerRows, listings.length)) {
            // This looks like a template - show modal to ask user what they want to do
            const template: TemplateMetadata = {
              sheetName,
              headerRowIndex,
              headerRows,
              columnHeaders
            };

            setTemplateModal({
              show: true,
              fileName: file.name,
              template,
              sampleData: listings
            });
          } else {
            // Regular data file - load normally
            // Show warnings if any
            if (warnings.length > 0) {
              const warningMsg = `⚠️ Import completed with warnings:\n\n${warnings.join('\n')}\n\nAdded ${listings.length} listing(s) from ${file.name}\n\nPlease review and fix these issues before exporting.`;
              alert(warningMsg);
            } else {
              // Show success message
              console.log(`✅ Successfully imported ${listings.length} listing(s) from ${file.name}`);
            }

            onDataLoaded(listings);
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Error parsing file. Please make sure it\'s a valid Excel file.');
        }
      };

      reader.readAsBinaryString(file);
    });
  }, [onDataLoaded, onTemplateDetected]);

  const handleLoadSampleData = () => {
    onDataLoaded(templateModal.sampleData);
    setTemplateModal({ show: false, fileName: '', template: null, sampleData: [] });
    console.log(`✅ Loaded ${templateModal.sampleData.length} sample listing(s) from template`);
  };

  const handleSaveAsTemplate = () => {
    if (templateModal.template && onTemplateDetected) {
      onTemplateDetected(templateModal.template, templateModal.sampleData);
      setTemplateModal({ show: false, fileName: '', template: null, sampleData: [] });
      console.log(`✅ Saved template structure from ${templateModal.fileName}`);
    }
  };

  const handleLoadBoth = () => {
    if (templateModal.template && onTemplateDetected) {
      onTemplateDetected(templateModal.template, templateModal.sampleData);
      onDataLoaded(templateModal.sampleData);
      setTemplateModal({ show: false, fileName: '', template: null, sampleData: [] });
      console.log(`✅ Loaded template structure and ${templateModal.sampleData.length} sample listing(s)`);
    }
  };

  const handleCancel = () => {
    setTemplateModal({ show: false, fileName: '', template: null, sampleData: [] });
  };

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
    <>
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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              💡 Upload data files or Facebook templates
            </p>
          </div>
        )}
      </div>

      {/* Template Detection Modal */}
      {templateModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Template File Detected
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  <strong>{templateModal.fileName}</strong> appears to be a Facebook Marketplace template
                  with {templateModal.sampleData.length} sample listing(s).
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  What would you like to do?
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Option 1: Load sample data */}
              <button
                onClick={handleLoadSampleData}
                className="w-full flex items-start gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <Table className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Load Sample Data Only</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Add the {templateModal.sampleData.length} sample listing(s) to your table for editing
                  </p>
                </div>
              </button>

              {/* Option 2: Save as template */}
              <button
                onClick={handleSaveAsTemplate}
                className="w-full flex items-start gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
              >
                <FileSpreadsheet className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Save as Template Only</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Save the template structure for future exports (don't load sample data)
                  </p>
                </div>
              </button>

              {/* Option 3: Both */}
              <button
                onClick={handleLoadBoth}
                className="w-full flex items-start gap-3 p-4 border-2 border-purple-300 dark:border-purple-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
              >
                <div className="flex gap-1 flex-shrink-0 mt-0.5">
                  <FileSpreadsheet className="text-purple-600 dark:text-purple-400" size={16} />
                  <Table className="text-purple-600 dark:text-purple-400" size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Do Both</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Save template structure AND load sample data into table
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

