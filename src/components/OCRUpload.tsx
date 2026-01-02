/**
 * OCR Upload Component
 * Upload multiple images for OCR processing with PaddleOCR + Tesseract fallback
 * Supports background processing - user can continue using app while files are processed
 */

import { useState, useRef, useEffect } from 'react';
import { FileImage, AlertCircle, CheckCircle, Loader, X, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { processWithPaddleOCR, processWithTesseract, checkBackendHealth } from '../services/ocrService';
import { API_BASE } from '../config';
import { OCRResultsViewer } from './OCRResultsViewer';
import type { ParsedProduct } from '../types/ocr';
import type { MarketplaceListing } from '../types';

interface OCRUploadProps {
  onProductsExtracted?: (products: ParsedProduct[]) => void;
  onViewData?: () => void;
}

interface FileJob {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: string;
  logs: Array<{ message: string; level: string }>;
  productsExtracted?: number;
  preview?: string;
  error?: string;
  ocrText?: string;
  confidence?: number;
  extractedProducts?: ParsedProduct[];
}

type OcrEngine = 'paddleocr' | 'tesseract' | 'both';
type TabView = 'upload' | 'history';

interface HistoryScan {
  id: string;
  filename: string;
  thumbnail_path?: string;
  file_type?: string;
  status: 'completed' | 'failed' | 'processing';
  items_extracted: number;
  ocr_engine: string;
  created_at: string;
  extracted_data?: {
    products?: ParsedProduct[];
  };
}

export function OCRUpload({ onProductsExtracted, onViewData }: OCRUploadProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const { setListings } = useData();
  const [activeTab, setActiveTab] = useState<TabView>('upload');
  const [fileJobs, setFileJobs] = useState<FileJob[]>([]);
  const [clearPrevious, setClearPrevious] = useState(true);
  const [ocrEngine, setOcrEngine] = useState<OcrEngine>('paddleocr');
  const [historyScans, setHistoryScans] = useState<HistoryScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<FileJob | null>(null);
  const processingRef = useRef(false);
  const queueRef = useRef<FileJob[]>([]);

  // Update queue ref when fileJobs changes
  useEffect(() => {
    queueRef.current = fileJobs;
  }, [fileJobs]);

  // Start processing queue when files are added
  useEffect(() => {
    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileJobs.length]);

  // Load history when switching to history tab
  useEffect(() => {
    // Only load if we have BOTH authentication AND a valid token
    // accessToken is now reactive state in AuthContext, so no race condition
    if (activeTab === 'history' && isAuthenticated && accessToken) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated, accessToken]);

  const loadHistory = async () => {
    if (!isAuthenticated || !accessToken) {
      console.warn('Cannot load OCR history: Not authenticated');
      setHistoryScans([]);
      setHistoryError('Please log in to view OCR history');
      return;
    }

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await fetch(`${API_BASE}/api/ocr/scans?per_page=50`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('OCR history loaded:', data.scans?.length || 0, 'scans');
        setHistoryScans(data.scans || []);
        setHistoryError(null);
      } else {
        // Log error details
        const errorText = await response.text();
        console.error('Failed to load OCR history:', response.status, errorText);

        if (response.status === 401) {
          console.error('Authentication failed - token may be expired');
          setHistoryError('Authentication failed - please log in again');
        } else {
          setHistoryError(`Failed to load history: ${response.status} ${response.statusText}`);
        }

        setHistoryScans([]);
      }
    } catch (error) {
      console.error('Failed to load OCR history:', error);
      setHistoryError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHistoryScans([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const addLog = (jobId: string, message: string, level: 'info' | 'success' | 'warn' | 'error') => {
    setFileJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, logs: [...job.logs, { message, level }] }
        : job
    ));
  };

  const updateJobStatus = (jobId: string, updates: Partial<FileJob>) => {
    setFileJobs(prev => prev.map(job =>
      job.id === jobId
        ? { ...job, ...updates }
        : job
    ));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create jobs for all selected files
    const newJobs: FileJob[] = Array.from(files).map(file => {
      const jobId = crypto.randomUUID();

      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updateJobStatus(jobId, { preview: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      }

      return {
        id: jobId,
        file,
        status: 'queued' as const,
        progress: 'Queued',
        logs: [],
      };
    });

    setFileJobs(prev => [...prev, ...newJobs]);

    // Reset file input
    e.target.value = '';
  };

  const processQueue = async () => {
    // Prevent concurrent processing
    if (processingRef.current) return;

    // Find next queued job
    const nextJob = queueRef.current.find(job => job.status === 'queued');
    if (!nextJob) return;

    processingRef.current = true;
    updateJobStatus(nextJob.id, { status: 'processing', progress: 'Starting...' });
    addLog(nextJob.id, `Processing ${nextJob.file.name}...`, 'info');

    try {
      let result;
      let paddleResult;
      let tesseractResult;

      // Process based on user's engine selection
      if (ocrEngine === 'both') {
        // Try both engines and compare
        addLog(nextJob.id, 'Processing with both engines for comparison...', 'info');

        // Try PaddleOCR first if authenticated
        if (isAuthenticated && accessToken) {
          const backendHealthy = await checkBackendHealth();
          if (backendHealthy) {
            addLog(nextJob.id, 'Running PaddleOCR...', 'info');
            updateJobStatus(nextJob.id, { progress: 'Processing with PaddleOCR...' });
            try {
              paddleResult = await processWithPaddleOCR(
                nextJob.file,
                accessToken,
                (msg, level) => addLog(nextJob.id, `[PaddleOCR] ${msg}`, level),
                'both'
              );
            } catch (err) {
              addLog(nextJob.id, `PaddleOCR failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
            }
          }
        }

        // Run Tesseract
        addLog(nextJob.id, 'Running Tesseract.js...', 'info');
        updateJobStatus(nextJob.id, { progress: 'Processing with Tesseract...' });
        try {
          tesseractResult = await processWithTesseract(
            nextJob.file,
            (msg, level) => addLog(nextJob.id, `[Tesseract] ${msg}`, level)
          );
        } catch (err) {
          addLog(nextJob.id, `Tesseract failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        }

        // Use result with more products, or PaddleOCR if tied
        if (paddleResult && tesseractResult) {
          const paddleCount = paddleResult.parsed.products.length;
          const tesseractCount = tesseractResult.parsed.products.length;
          result = paddleCount >= tesseractCount ? paddleResult : tesseractResult;
          addLog(nextJob.id, `PaddleOCR: ${paddleCount} products, Tesseract: ${tesseractCount} products`, 'info');
          addLog(nextJob.id, `Using ${paddleCount >= tesseractCount ? 'PaddleOCR' : 'Tesseract'} result`, 'success');
        } else {
          result = paddleResult || tesseractResult;
        }

      } else if (ocrEngine === 'tesseract') {
        // User explicitly chose Tesseract
        addLog(nextJob.id, 'Using Tesseract.js (user selected)...', 'info');
        updateJobStatus(nextJob.id, { progress: 'Processing with Tesseract...' });
        result = await processWithTesseract(
          nextJob.file,
          (msg, level) => addLog(nextJob.id, msg, level)
        );

      } else {
        // Default: PaddleOCR (user selected or default)
        if (isAuthenticated && accessToken) {
          const backendHealthy = await checkBackendHealth();

          if (backendHealthy) {
            addLog(nextJob.id, 'Using PaddleOCR backend...', 'info');
            updateJobStatus(nextJob.id, { progress: 'Processing with PaddleOCR...' });

            try {
              result = await processWithPaddleOCR(
                nextJob.file,
                accessToken,
                (msg, level) => addLog(nextJob.id, msg, level),
                ocrEngine
              );
            } catch (error) {
              // If PaddleOCR fails (e.g., 401 auth error), fall back to Tesseract
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              if (errorMsg.includes('401') || errorMsg.includes('Authentication')) {
                addLog(nextJob.id, 'Authentication failed - falling back to Tesseract.js...', 'warn');
              } else {
                addLog(nextJob.id, `PaddleOCR failed (${errorMsg}) - falling back to Tesseract.js...`, 'warn');
              }

              updateJobStatus(nextJob.id, { progress: 'Processing with Tesseract...' });
              result = await processWithTesseract(
                nextJob.file,
                (msg, level) => addLog(nextJob.id, msg, level)
              );
            }
          } else {
            addLog(nextJob.id, 'Backend unavailable, using Tesseract.js fallback...', 'warn');
            updateJobStatus(nextJob.id, { progress: 'Processing with Tesseract...' });
            result = await processWithTesseract(
              nextJob.file,
              (msg, level) => addLog(nextJob.id, msg, level)
            );
          }
        } else {
          addLog(nextJob.id, 'Not authenticated, using Tesseract.js...', 'info');
          updateJobStatus(nextJob.id, { progress: 'Processing with Tesseract...' });
          result = await processWithTesseract(
            nextJob.file,
            (msg, level) => addLog(nextJob.id, msg, level)
          );
        }
      }

      if (result && result.success && result.parsed.products.length > 0) {
        addLog(nextJob.id, `Extracted ${result.parsed.products.length} products`, 'success');
        updateJobStatus(nextJob.id, { progress: 'Converting to listings...' });

        // Convert to listings format
        const newListings: MarketplaceListing[] = result.parsed.products.map(product => ({
          id: crypto.randomUUID(),
          TITLE: product.name,
          PRICE: product.price || 0,
          CONDITION: (product.condition || 'New') as 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair',
          DESCRIPTION: product.description || product.name,
          CATEGORY: product.category || '',
          'OFFER SHIPPING': 'Yes' as 'Yes' | 'No'
        }));

        // Add to data table
        if (clearPrevious && queueRef.current.filter(j => j.status === 'completed').length === 0) {
          // Clear only on first file if clearPrevious is checked
          addLog(nextJob.id, 'Clearing previous results...', 'info');
          setListings(newListings);
        } else {
          addLog(nextJob.id, 'Appending to existing results...', 'info');
          setListings((prevListings: MarketplaceListing[]) => [...prevListings, ...newListings]);
        }

        // Notify parent
        onProductsExtracted?.(result.parsed.products);

        addLog(nextJob.id, `${newListings.length} products added to table`, 'success');
        updateJobStatus(nextJob.id, {
          status: 'completed',
          progress: 'Completed',
          productsExtracted: newListings.length,
          ocrText: result.raw_text,
          confidence: result.confidence_score,
          extractedProducts: result.parsed.products
        });
      } else {
        addLog(nextJob.id, 'No products found in image', 'warn');
        updateJobStatus(nextJob.id, {
          status: 'completed',
          progress: 'No products found',
          productsExtracted: 0
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(nextJob.id, `Error: ${errorMsg}`, 'error');
      updateJobStatus(nextJob.id, {
        status: 'error',
        progress: 'Failed',
        error: errorMsg
      });
    } finally {
      processingRef.current = false;
      // Process next file in queue
      setTimeout(() => processQueue(), 100);
    }
  };

  const removeJob = (jobId: string) => {
    setFileJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const clearCompleted = () => {
    setFileJobs(prev => prev.filter(job => job.status !== 'completed'));
  };

  const activeJobs = fileJobs.filter(job => job.status === 'queued' || job.status === 'processing');
  const completedJobs = fileJobs.filter(job => job.status === 'completed' || job.status === 'error');

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Upload & Process
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          History ({historyScans.length})
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <>
          {/* OCR Engine Selector */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <label className="block text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
          OCR Engine
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOcrEngine('paddleocr')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              ocrEngine === 'paddleocr'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            PaddleOCR (Recommended)
          </button>
          <button
            onClick={() => setOcrEngine('tesseract')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              ocrEngine === 'tesseract'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Tesseract.js
          </button>
          <button
            onClick={() => setOcrEngine('both')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              ocrEngine === 'both'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Try Both (Compare)
          </button>
        </div>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
          {ocrEngine === 'paddleocr' && 'Uses backend PaddleOCR for best accuracy (requires authentication)'}
          {ocrEngine === 'tesseract' && 'Uses browser-based Tesseract.js (works offline, slower)'}
          {ocrEngine === 'both' && 'Processes with both engines and shows comparison (takes longer)'}
        </p>
      </div>

      {/* Clear Previous Results Checkbox */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <input
          type="checkbox"
          id="clear-previous"
          checked={clearPrevious}
          onChange={(e) => setClearPrevious(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label htmlFor="clear-previous" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          Clear previous results before adding first file (recommended to avoid duplicates)
        </label>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
        <label className="flex flex-col items-center cursor-pointer">
          <FileImage size={48} className="text-gray-400 dark:text-gray-500 mb-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Upload product catalog images (multiple files supported)
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Supports: JPG, PNG, PDF • Files process in background
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
        </label>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="border border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <h3 className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-100">
            Processing Queue ({activeJobs.length} file{activeJobs.length !== 1 ? 's' : ''})
          </h3>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  {/* Thumbnail or fallback icon */}
                  {job.preview ? (
                    <img src={job.preview} alt={job.file.name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded flex flex-col items-center justify-center border border-gray-300 dark:border-gray-600">
                      <FileImage size={24} className="text-gray-400 dark:text-gray-500 mb-1" />
                      <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center px-1 leading-tight break-all">
                        {job.file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {job.status === 'processing' && (
                        <Loader size={14} className="animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {job.file.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {job.progress}
                    </div>
                    {job.logs.length > 0 && (
                      <div className="text-xs space-y-0.5 max-h-20 overflow-y-auto">
                        {job.logs.slice(-3).map((log, idx) => (
                          <div key={idx} className={
                            log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                            log.level === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                            log.level === 'success' ? 'text-green-600 dark:text-green-400' :
                            'text-gray-500 dark:text-gray-500'
                          }>
                            {log.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {job.status === 'queued' && (
                    <button
                      onClick={() => removeJob(job.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Remove from queue"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Completed ({completedJobs.length})
            </h3>
            <div className="flex items-center gap-2">
              {onViewData && (
                <button
                  onClick={onViewData}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  View Extracted Data →
                </button>
              )}
              <button
                onClick={clearCompleted}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear All
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {completedJobs.map(job => (
              <div key={job.id} className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {/* Thumbnail or fallback icon */}
                {job.preview ? (
                  <img src={job.preview} alt={job.file.name} className="w-12 h-12 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded flex flex-col items-center justify-center border border-gray-300 dark:border-gray-600">
                    <FileImage size={20} className="text-gray-400 dark:text-gray-500 mb-0.5" />
                    <span className="text-[7px] text-gray-500 dark:text-gray-400 text-center px-0.5 leading-tight break-all">
                      {job.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {job.status === 'completed' ? (
                      <CheckCircle size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {job.file.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {job.status === 'completed'
                      ? `${job.productsExtracted || 0} products extracted`
                      : `Error: ${job.error}`
                    }
                  </div>
                  {job.status === 'completed' && job.productsExtracted && job.productsExtracted > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        <Eye size={12} />
                        View Results
                      </button>
                      {onViewData && (
                        <>
                          <span className="text-gray-400">•</span>
                          <button
                            onClick={onViewData}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View in data table →
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeJob(job.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Info Message */}
          {fileJobs.length === 0 && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              Select multiple files to process them in the background while you continue using the app
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Error Message */}
          {historyError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-300">
                    Failed to load OCR history
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {historyError}
                  </p>
                  {historyError.includes('Authentication') && (
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Refresh page to log in again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={24} className="animate-spin text-purple-600 dark:text-purple-400" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading history...</span>
            </div>
          ) : historyScans.length === 0 && !historyError ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileImage size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No OCR history yet</p>
              <p className="text-xs mt-1">Upload files in the "Upload & Process" tab to get started</p>
            </div>
          ) : historyScans.length > 0 ? (
            <div className="space-y-2">
              {historyScans.map(scan => (
                <div key={scan.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* Thumbnail or icon */}
                  {scan.thumbnail_path ? (
                    <img src={`${API_BASE}${scan.thumbnail_path}`} alt={scan.filename} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded flex flex-col items-center justify-center border border-gray-300 dark:border-gray-600">
                      <FileImage size={24} className="text-gray-400 dark:text-gray-500 mb-1" />
                      <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center px-1 leading-tight break-all">
                        {scan.file_type?.split('/').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {scan.status === 'completed' ? (
                        <CheckCircle size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : scan.status === 'failed' ? (
                        <AlertCircle size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                      ) : (
                        <Loader size={14} className="animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {scan.filename}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                      <div>{scan.items_extracted || 0} products • {scan.ocr_engine || 'paddleocr'}</div>
                      <div>{new Date(scan.created_at).toLocaleString()}</div>
                    </div>
                    {scan.status === 'completed' && scan.items_extracted > 0 && (
                      <button
                        onClick={() => {
                          // Re-load this scan's data
                          if (scan.extracted_data?.products) {
                            const newListings: MarketplaceListing[] = scan.extracted_data.products.map((product: ParsedProduct) => ({
                              id: crypto.randomUUID(),
                              TITLE: product.name,
                              PRICE: product.price || 0,
                              CONDITION: (product.condition || 'New') as 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair',
                              DESCRIPTION: product.description || product.name,
                              CATEGORY: product.category || '',
                              'OFFER SHIPPING': 'Yes' as 'Yes' | 'No'
                            }));
                            setListings(newListings);
                            onViewData?.();
                          }
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                      >
                        Load into data table →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* OCR Results Viewer Modal */}
      {selectedJob && selectedJob.preview && selectedJob.ocrText && (
        <OCRResultsViewer
          imageUrl={selectedJob.preview}
          ocrText={selectedJob.ocrText}
          confidence={selectedJob.confidence || 0.8}
          extractedProducts={(selectedJob.extractedProducts || []).map(product => ({
            id: crypto.randomUUID(),
            TITLE: product.name || '',
            PRICE: product.price || 0,
            CONDITION: (product.condition || 'New') as 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair',
            DESCRIPTION: product.description || '',
            CATEGORY: product.category || '',
            'OFFER SHIPPING': 'Yes' as 'Yes' | 'No'
          }))}
          onClose={() => setSelectedJob(null)}
          onProductsImport={(products) => {
            setListings((prevListings: MarketplaceListing[]) => [...prevListings, ...products]);
            setSelectedJob(null);
            onViewData?.();
          }}
          onReprocess={async (processedImageUrl) => {
            // TODO: Implement reprocessing with adjusted image
            console.log('Reprocess with adjusted image:', processedImageUrl);
          }}
        />
      )}
    </div>
  );
}

