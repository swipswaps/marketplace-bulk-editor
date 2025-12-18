import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Table, AlertCircle, CheckCircle, X, ExternalLink, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MarketplaceListing, TemplateMetadata } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: MarketplaceListing[]) => void;
  onTemplateDetected?: (template: TemplateMetadata, sampleData: MarketplaceListing[]) => void;
  currentTemplate: TemplateMetadata | null;
  onTemplateLoad: (template: TemplateMetadata, isPreload?: boolean) => void;
}

interface TemplateDetectionModal {
  show: boolean;
  fileName: string;
  template: TemplateMetadata | null;
  sampleData: MarketplaceListing[];
}

export function FileUpload({ onDataLoaded, onTemplateDetected, currentTemplate, onTemplateLoad }: FileUploadProps) {
  const [templateModal, setTemplateModal] = useState<TemplateDetectionModal>({
    show: false,
    fileName: '',
    template: null,
    sampleData: []
  });
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [showPreloadWarning, setShowPreloadWarning] = useState(false);

  // Template processing functions
  const findHeaderRow = (worksheet: XLSX.WorkSheet): number => {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let row = range.s.r; row <= Math.min(range.s.r + 10, range.e.r); row++) {
      const rowData: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? String(cell.v) : '');
      }

      const rowText = rowData.join('|').toUpperCase();
      if (rowText.includes('TITLE') && rowText.includes('PRICE') && rowText.includes('DESCRIPTION')) {
        return row;
      }
    }

    return 0;
  };

  const processTemplateFile = useCallback((file: File, isPreload = false) => {
    setTemplateError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const headerRowIndex = findHeaderRow(worksheet);
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

        const columnHeaders: string[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
          const cell = worksheet[cellAddress];
          columnHeaders.push(cell ? String(cell.v) : '');
        }

        // Extract sample data
        const sampleData: MarketplaceListing[] = [];
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: ''
        }) as Record<string, string | number>[];

        rawData.forEach((row, index) => {
          sampleData.push({
            id: `template-${Date.now()}-${index}`,
            TITLE: String(row.TITLE || ''),
            PRICE: Number(row.PRICE) || 0,
            CONDITION: String(row.CONDITION || 'New'),
            DESCRIPTION: String(row.DESCRIPTION || ''),
            CATEGORY: String(row.CATEGORY || ''),
            'OFFER SHIPPING': String(row['OFFER SHIPPING'] || 'No')
          });
        });

        const template: TemplateMetadata = {
          sheetName,
          headerRowIndex,
          headerRows,
          columnHeaders,
          sampleData: sampleData.length > 0 ? sampleData : undefined
        };

        onTemplateLoad(template, isPreload);
      } catch (err) {
        setTemplateError(`Failed to process template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    reader.onerror = () => {
      setTemplateError('Failed to read file');
    };

    reader.readAsBinaryString(file);
  }, [onTemplateLoad]);

  const handlePreloadTemplate = async () => {
    setShowPreloadWarning(false);
    setTemplateError(null);

    try {
      const response = await fetch('/Marketplace_Bulk_Upload_Template.xlsx');
      if (!response.ok) {
        throw new Error('Failed to load template');
      }

      const blob = await response.blob();
      const file = new File([blob], 'Marketplace_Bulk_Upload_Template.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      processTemplateFile(file, true);
    } catch (err) {
      setTemplateError('Failed to load preloaded template. Please upload your own template.');
    }
  };

  const handleClearTemplate = () => {
    onTemplateLoad({ sheetName: '', headerRowIndex: 0, headerRows: [], columnHeaders: [] });
  };

  const handleLoadTemplateSampleData = () => {
    if (currentTemplate?.sampleData) {
      onDataLoaded(currentTemplate.sampleData);
    }
  };

  const isTemplateFile = (fileName: string, headerRows: string[][], dataRowCount: number): boolean => {
    const nameIsTemplate = /template/i.test(fileName);
    const hasHeaderRows = headerRows.length > 0 && headerRows.some(row =>
      row.some(cell => /template|facebook|marketplace|bulk.*upload/i.test(cell))
    );
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
      {/* Combined Upload Area */}
      <div className="space-y-4">
        {/* Template Status Section */}
        {currentTemplate && currentTemplate.columnHeaders.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Template Loaded
                  </p>
                  <div className="mt-2 text-xs text-green-700 dark:text-green-300 space-y-1">
                    <p>Sheet: <span className="font-mono">{currentTemplate.sheetName}</span></p>
                    <p>Header rows: {currentTemplate.headerRows.length}</p>
                    <p>Columns: {currentTemplate.columnHeaders.filter(h => h).join(', ')}</p>
                    {currentTemplate.sampleData && currentTemplate.sampleData.length > 0 && (
                      <p>Sample data: {currentTemplate.sampleData.length} listing(s)</p>
                    )}
                  </div>

                  {/* Load Sample Data Button */}
                  {currentTemplate.sampleData && currentTemplate.sampleData.length > 0 && (
                    <button
                      onClick={handleLoadTemplateSampleData}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                      <Table size={14} />
                      Load {currentTemplate.sampleData.length} Sample Listing{currentTemplate.sampleData.length !== 1 ? 's' : ''} into Editor
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={handleClearTemplate}
                className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 rounded transition-colors"
              >
                <X size={14} />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Main Upload Area */}
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
                Supports .xlsx, .xls, and .csv files • Upload data files or Facebook templates
              </p>

              {/* Template Upload Options */}
              {!currentTemplate || currentTemplate.columnHeaders.length === 0 ? (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    📋 Need a Facebook Marketplace template?
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href="https://www.facebook.com/business/help/125074381480892"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink size={12} />
                      Get official template from Facebook
                    </a>
                    <span className="text-xs text-gray-400">or</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPreloadWarning(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      <Download size={12} />
                      Use bundled template (may be outdated)
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Template Error */}
        {templateError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{templateError}</p>
          </div>
        )}
      </div>

      {/* Preload Warning Modal */}
      {showPreloadWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Use Bundled Template?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  The bundled template may be outdated. For best results, download the latest template from Facebook.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPreloadWarning(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePreloadTemplate}
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Use Bundled Template
              </button>
            </div>
          </div>
        </div>
      )}

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

