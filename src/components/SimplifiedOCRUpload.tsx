/**
 * Simplified OCR Upload Component
 * Single-view UX: Upload → Select Methods → Process → Compare Results
 * Per Rule 16: Simplified workflow while preserving functionality
 */

import { useState, useRef, useEffect } from 'react';
import { FileImage, Loader, CheckCircle, X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { processWithTesseract, processWithPaddleOCR, checkBackendHealth } from '../services/ocrService';
import type { ParsedProduct } from '../types/ocr';
import type { MarketplaceListing } from '../types';

interface SimplifiedOCRUploadProps {
  onClose: () => void;
  onProductsImport?: (products: MarketplaceListing[]) => void;
}

interface ProcessingResult {
  method: string;
  text: string;
  confidence: number;
  productCount: number;
  products: ParsedProduct[];
  preprocessedImageUrl?: string; // Preview of preprocessed image
}

type PreprocessMethod = 'grayscale' | 'threshold' | 'adaptive' | 'denoise' | 'sharpen' | 'upscale';

export function SimplifiedOCRUpload({ onClose, onProductsImport }: SimplifiedOCRUploadProps) {
  const { isAuthenticated, accessToken } = useAuth();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<Set<PreprocessMethod>>(
    new Set(['grayscale', 'threshold', 'adaptive', 'denoise', 'sharpen'])
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const isCancelledRef = useRef(false); // Use ref for immediate cancellation
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState('');
  const [ocrEngine, setOcrEngine] = useState<'paddleocr' | 'tesseract'>('paddleocr');
  // Show warning immediately if PaddleOCR selected and not authenticated
  const [showLoginWarning, setShowLoginWarning] = useState(!isAuthenticated);
  // Image carousel state - show original + all preprocessed images
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Zoom state - precise zoom level (10% to 500%)
  const [zoomLevel, setZoomLevel] = useState(100);
  // Crop state - for selecting area to OCR
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  // Image manipulation state
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Reset results and image state
    setResults([]);
    setZoomLevel(100);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setCropMode(false);
    setCropArea(null);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 500));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 10));
  const handleZoomReset = () => setZoomLevel(100);
  const handleZoomFit = () => setZoomLevel(100);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoomLevel(prev => Math.max(10, Math.min(500, prev + delta)));
    }
  };

  // Touch pinch zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialZoom = 100;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialZoom = zoomLevel;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(10, Math.min(500, initialZoom * scale));
        setZoomLevel(newZoom);
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [zoomLevel]);

  const toggleMethod = (method: PreprocessMethod) => {
    setSelectedMethods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(method)) {
        newSet.delete(method);
      } else {
        newSet.add(method);
      }
      return newSet;
    });
  };

  const processAllMethods = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    isCancelledRef.current = false; // Reset cancel flag
    setResults([]);
    const newResults: ProcessingResult[] = [];

    try {
      // Determine which OCR engine to use
      const usePaddleOCR = ocrEngine === 'paddleocr' && isAuthenticated && accessToken;

      if (usePaddleOCR) {
        // Check backend health
        const backendHealthy = await checkBackendHealth();
        if (!backendHealthy) {
          setProcessingProgress('Backend unavailable, falling back to Tesseract...');
          setOcrEngine('tesseract');
        }
      }

      // Process with each selected method
      for (const method of Array.from(selectedMethods)) {
        // Check if cancelled
        if (isCancelledRef.current) {
          setProcessingProgress('Processing cancelled by user');
          break;
        }

        setProcessingProgress(`Processing with ${method}...`);

        let result;

        if (usePaddleOCR && accessToken) {
          try {
            result = await processWithPaddleOCR(
              uploadedFile,
              accessToken,
              (msg) => setProcessingProgress(msg),
              'paddleocr',
              method === 'threshold' ? 'threshold' :
              method === 'adaptive' ? 'adaptive' :
              method === 'upscale' ? 'upscale' : 'auto',
              true // enableMultiResolution
            );
          } catch (error) {
            console.error(`PaddleOCR failed for ${method}, falling back to Tesseract:`, error);
            result = await processWithTesseract(
              uploadedFile,
              (msg) => setProcessingProgress(msg),
              method
            );
          }
        } else {
          result = await processWithTesseract(
            uploadedFile,
            (msg) => setProcessingProgress(msg),
            method
          );
        }

        if (result.success) {
          const newResult = {
            method,
            text: result.raw_text,
            confidence: result.confidence_score || 0,
            productCount: result.parsed.products.length,
            products: result.parsed.products,
            preprocessedImageUrl: result.preprocessed_image_url
          };
          newResults.push(newResult);

          // Update results immediately so partial results are visible
          setResults([...newResults]);
        }
      }

      setResults(newResults);
      setProcessingProgress('');
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingProgress('Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };



  const methodLabels: Record<PreprocessMethod, string> = {
    grayscale: 'Grayscale',
    threshold: 'Threshold',
    adaptive: 'Adaptive Threshold',
    denoise: 'Denoise',
    sharpen: 'Sharpen',
    upscale: 'Upscale'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">OCR Image Upload</h2>
            <button
              onClick={onClose}
              aria-label="Close OCR upload"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Upload Area */}
          {!uploadedImage && (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 mb-6">
              <label className="flex flex-col items-center cursor-pointer">
                <FileImage size={48} className="text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Upload product catalog image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  Click to browse or drag and drop
                </span>
              </label>
            </div>
          )}

          {/* Image Preview + Method Selector + Results */}
          {uploadedImage && (() => {
            // Build array of all images: original + preprocessed results
            const allImages = [
              { url: uploadedImage, label: 'Original', filename: uploadedFile?.name || 'uploaded-image.png' },
              ...results.map(r => ({
                url: r.preprocessedImageUrl || '',
                label: r.method,
                filename: `${r.method}-preprocessed.png`
              })).filter(img => img.url)
            ];
            const currentImage = allImages[currentImageIndex] || allImages[0];

            return (
            <div className="space-y-6">
              {/* Image Carousel Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentImage.label} ({currentImageIndex + 1}/{allImages.length})
                  </h3>
                  <a
                    href={currentImage.url}
                    download={currentImage.filename}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    title="Download current image"
                  >
                    <Download size={14} />
                    Download
                  </a>
                </div>

                {/* Image Tools Bar */}
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded px-2 py-1">
                    <button
                      onClick={handleZoomOut}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Zoom out (Ctrl+Scroll)"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-mono min-w-[50px] text-center text-gray-700 dark:text-gray-300">
                      {zoomLevel}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Zoom in (Ctrl+Scroll)"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      onClick={handleZoomFit}
                      className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors ml-1"
                      title="Fit to screen"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>

                  {/* Rotate */}
                  <button
                    onClick={() => setRotation((rotation + 90) % 360)}
                    className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Rotate 90°"
                  >
                    <RotateCw size={16} />
                  </button>

                  {/* Brightness */}
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Brightness:</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs font-mono w-8 text-gray-700 dark:text-gray-300">{brightness}%</span>
                  </div>

                  {/* Contrast */}
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">Contrast:</label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-xs font-mono w-8 text-gray-700 dark:text-gray-300">{contrast}%</span>
                  </div>

                  {/* Crop Mode Toggle */}
                  <button
                    onClick={() => {
                      setCropMode(!cropMode);
                      setCropArea(null);
                    }}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      cropMode
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cropMode ? '✓ Crop Mode' : 'Crop Mode'}
                  </button>

                  {cropMode && cropArea && (
                    <button
                      onClick={() => {
                        // TODO: Process only cropped area
                        alert('Crop & OCR feature coming soon!');
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Crop & OCR
                    </button>
                  )}
                </div>

                {/* Image with navigation and crop overlay */}
                <div
                  ref={containerRef}
                  className="relative overflow-auto max-h-[600px] bg-gray-100 dark:bg-gray-800 rounded"
                  onWheel={handleWheel}
                  onMouseDown={(e) => {
                    if (!cropMode || !imageRef.current) return;
                    const rect = imageRef.current.getBoundingClientRect();
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    setCropArea(null);
                  }}
                  onMouseMove={(e) => {
                    if (!cropMode || !isDragging || !dragStart || !imageRef.current) return;
                    const rect = imageRef.current.getBoundingClientRect();
                    const currentX = e.clientX - rect.left;
                    const currentY = e.clientY - rect.top;
                    setCropArea({
                      x: Math.min(dragStart.x, currentX),
                      y: Math.min(dragStart.y, currentY),
                      width: Math.abs(currentX - dragStart.x),
                      height: Math.abs(currentY - dragStart.y)
                    });
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <img
                    ref={imageRef}
                    src={currentImage.url}
                    alt={currentImage.label}
                    className={`mx-auto rounded border border-gray-300 dark:border-gray-600 transition-all ${
                      cropMode ? 'cursor-crosshair' : 'cursor-grab'
                    }`}
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      maxHeight: zoomLevel === 100 ? '600px' : 'none',
                      transformOrigin: 'center center'
                    }}
                  />

                  {/* Crop overlay */}
                  {cropMode && cropArea && (
                    <div
                      className="absolute border-2 border-purple-600 bg-purple-600 bg-opacity-20 pointer-events-none"
                      style={{
                        left: cropArea.x,
                        top: cropArea.y,
                        width: cropArea.width,
                        height: cropArea.height
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                        {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  {allImages.length > 1 && !cropMode && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((currentImageIndex - 1 + allImages.length) % allImages.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                        title="Previous image"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((currentImageIndex + 1) % allImages.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                        title="Next image"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                {/* Zoom hint */}
                {!cropMode && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Ctrl+Scroll to zoom • Pinch to zoom on touch devices
                  </p>
                )}

                {/* Thumbnail slider - Enhanced */}
                {allImages.length > 1 && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        All Images ({allImages.length})
                      </h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setCurrentImageIndex((currentImageIndex - 1 + allImages.length) % allImages.length)}
                          className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Previous"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((currentImageIndex + 1) % allImages.length)}
                          className="p-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Next"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-shrink-0 w-24 h-24 rounded border-2 transition-all relative ${
                            idx === currentImageIndex
                              ? 'border-purple-600 dark:border-purple-400 shadow-lg'
                              : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
                          }`}
                          title={img.label}
                        >
                          <img
                            src={img.url}
                            alt={img.label}
                            className="w-full h-full object-cover rounded"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 truncate">
                            {img.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* OCR Engine Selector */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  OCR Engine:
                </h3>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ocr-engine"
                      value="paddleocr"
                      checked={ocrEngine === 'paddleocr'}
                      onChange={(e) => {
                        setOcrEngine(e.target.value as 'paddleocr' | 'tesseract');
                        if (!isAuthenticated) {
                          setShowLoginWarning(true);
                        } else {
                          setShowLoginWarning(false);
                        }
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      PaddleOCR {!isAuthenticated && '(requires login)'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="ocr-engine"
                      value="tesseract"
                      checked={ocrEngine === 'tesseract'}
                      onChange={(e) => setOcrEngine(e.target.value as 'paddleocr' | 'tesseract')}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Tesseract.js
                    </span>
                  </label>
                </div>

                {/* Login Warning */}
                {showLoginWarning && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ PaddleOCR requires authentication. Please log in to use PaddleOCR, or select Tesseract.js for offline processing.
                    </p>
                  </div>
                )}
              </div>

              {/* Preprocessing Methods Selector */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Select Preprocessing Methods (multiple):
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(Object.keys(methodLabels) as PreprocessMethod[]).map(method => (
                    <label
                      key={method}
                      className="flex items-center gap-2 p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMethods.has(method)}
                        onChange={() => toggleMethod(method)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {methodLabels[method]}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Process and Cancel Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={processAllMethods}
                    disabled={isProcessing || selectedMethods.size === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-lg transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        {processingProgress || 'Processing...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Process {selectedMethods.size} Method{selectedMethods.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>

                  {isProcessing && (
                    <button
                      onClick={() => {
                        isCancelledRef.current = true;
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Cancel processing"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Side-by-Side Results Comparison */}
              {results.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Processing Results ({results.length} methods) - Compare Side-by-Side
                  </h3>

                  <div className={`grid gap-4 ${results.length === 1 ? 'grid-cols-1' : results.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {results.map((result, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600 flex flex-col"
                      >
                        {/* Header */}
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            {result.method}
                          </h4>
                          <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                            <span>Products: {result.productCount}</span>
                            <span>Chars: {result.text.length}</span>
                          </div>
                        </div>

                        {/* Note: Image shown in carousel above */}

                        {/* Full OCR Text in Textarea */}
                        <div className="flex-1 mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Full OCR Text:
                            </label>
                            {result.preprocessedImageUrl && (
                              <a
                                href={result.preprocessedImageUrl}
                                download={`${result.method}-preprocessed.png`}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                                title="Download preprocessed image"
                              >
                                📥 Download Image
                              </a>
                            )}
                          </div>
                          <textarea
                            readOnly
                            value={result.text}
                            className="w-full h-96 text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 resize-none"
                          />
                        </div>

                        {/* Import Button */}
                        <button
                          onClick={() => {
                            const listings: MarketplaceListing[] = result.products.map(product => ({
                              id: crypto.randomUUID(),
                              TITLE: product.name,
                              PRICE: product.price || 0,
                              CONDITION: (product.condition || 'New') as 'New' | 'Used - Like New' | 'Used - Good' | 'Used - Fair',
                              DESCRIPTION: product.description || product.name,
                              CATEGORY: product.category || '',
                              'OFFER SHIPPING': 'Yes' as 'Yes' | 'No'
                            }));
                            onProductsImport?.(listings);
                            onClose();
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          <CheckCircle size={16} />
                          Import This Result
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

