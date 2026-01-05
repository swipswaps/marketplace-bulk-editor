/**
 * Image Preprocessor Component
 * Preview and adjust images before OCR processing
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Contrast,
  Sun,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Loader
} from 'lucide-react';

interface ImagePreprocessorProps {
  imageUrl: string;
  onImageProcessed?: (processedImageUrl: string) => void;
  onBatchProcess?: (methods: string[]) => Promise<void>;
}

export function ImagePreprocessor({ imageUrl, onImageProcessed, onBatchProcess }: ImagePreprocessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [scale, setScale] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [preprocessMethod, setPreprocessMethod] = useState<string>('none');
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set(['none']));
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [suggestedMethods, setSuggestedMethods] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Calculate Otsu's threshold (MUST be declared before applyPreprocessing)
  const calculateOtsuThreshold = useCallback((grayData: Uint8ClampedArray): number => {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < grayData.length; i++) {
      histogram[grayData[i]]++;
    }

    const total = grayData.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];

      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    return threshold;
  }, []);

  // Apply Tesseract preprocessing methods (MUST be declared before drawImage)
  const applyPreprocessing = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    switch (preprocessMethod) {
      case 'grayscale': {
        // Convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
      }

      case 'threshold': {
        // Binary threshold (Otsu's method)
        const grayData = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grayData[i / 4] = gray;
        }
        const threshold = calculateOtsuThreshold(grayData);
        for (let i = 0; i < data.length; i += 4) {
          const gray = grayData[i / 4];
          const binary = gray > threshold ? 255 : 0;
          data[i] = binary;
          data[i + 1] = binary;
          data[i + 2] = binary;
        }
        break;
      }

      case 'adaptive': {
        // Adaptive threshold (simplified local thresholding)
        const blockSize = 11;
        const grayDataAdaptive = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grayDataAdaptive[i / 4] = gray;
        }
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            let sum = 0;
            let count = 0;
            for (let dy = -blockSize / 2; dy <= blockSize / 2; dy++) {
              for (let dx = -blockSize / 2; dx <= blockSize / 2; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  sum += grayDataAdaptive[ny * width + nx];
                  count++;
                }
              }
            }
            const localThreshold = sum / count - 2;
            const binary = grayDataAdaptive[idx] > localThreshold ? 255 : 0;
            const pixelIdx = idx * 4;
            data[pixelIdx] = binary;
            data[pixelIdx + 1] = binary;
            data[pixelIdx + 2] = binary;
          }
        }
        break;
      }

      case 'denoise': {
        // Median filter for noise reduction
        const grayDataDenoise = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grayDataDenoise[i / 4] = gray;
        }
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const neighbors: number[] = [];
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                  neighbors.push(grayDataDenoise[ny * width + nx]);
                }
              }
            }
            neighbors.sort((a, b) => a - b);
            const median = neighbors[Math.floor(neighbors.length / 2)];
            const idx = (y * width + x) * 4;
            data[idx] = median;
            data[idx + 1] = median;
            data[idx + 2] = median;
          }
        }
        break;
      }

      case 'sharpen': {
        // Sharpen using convolution kernel
        const grayDataSharpen = new Uint8ClampedArray(width * height);
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grayDataSharpen[i / 4] = gray;
        }
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = (y + ky) * width + (x + kx);
                const kernelIdx = (ky + 1) * 3 + (kx + 1);
                sum += grayDataSharpen[idx] * kernel[kernelIdx];
              }
            }
            const sharpened = Math.max(0, Math.min(255, sum));
            const idx = (y * width + x) * 4;
            data[idx] = sharpened;
            data[idx + 1] = sharpened;
            data[idx + 2] = sharpened;
          }
        }
        break;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [preprocessMethod, calculateOtsuThreshold]);

  // Draw image function
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on rotation
    const isRotated = rotation % 180 !== 0;
    canvas.width = isRotated ? img.height * scale : img.width * scale;
    canvas.height = isRotated ? img.width * scale : img.height * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw image
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Apply preprocessing method if selected
    if (preprocessMethod !== 'none') {
      applyPreprocessing(ctx, canvas.width, canvas.height);
    }
  }, [rotation, brightness, contrast, scale, preprocessMethod, applyPreprocessing]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      drawImage();
    };
    img.src = imageUrl;
  }, [imageUrl, drawImage]);

  // Redraw when settings change
  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [drawImage, imageLoaded]);

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setScale(1);
    setPreprocessMethod('none');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preprocessed-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const processedUrl = canvas.toDataURL('image/png');
    onImageProcessed?.(processedUrl);
  };

  const handleBatchProcess = async () => {
    if (!onBatchProcess || selectedMethods.size === 0) return;
    setIsBatchProcessing(true);
    try {
      await onBatchProcess(Array.from(selectedMethods));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const toggleMethod = (method: string) => {
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

  const analyzeImageAndSuggest = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate image statistics
    let totalBrightness = 0;
    const totalContrast = 0;
    let colorVariance = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // Color variance (how much color differs from grayscale)
      const gray = brightness;
      colorVariance += Math.abs(r - gray) + Math.abs(g - gray) + Math.abs(b - gray);
    }

    const pixelCount = data.length / 4;
    const avgBrightness = totalBrightness / pixelCount;
    const avgColorVariance = colorVariance / pixelCount;

    // Suggest methods based on analysis
    const suggestions: string[] = [];

    // Always include none as baseline
    suggestions.push('none');

    // If image has low color variance, suggest grayscale
    if (avgColorVariance < 30) {
      suggestions.push('grayscale');
    }

    // If image is very bright or very dark, suggest adaptive threshold
    if (avgBrightness < 80 || avgBrightness > 180) {
      suggestions.push('adaptive');
    } else {
      // Otherwise suggest binary threshold for normal brightness
      suggestions.push('threshold');
    }

    // Always suggest denoise for scanned documents
    suggestions.push('denoise');

    // If brightness is in mid-range, suggest sharpen
    if (avgBrightness >= 80 && avgBrightness <= 180) {
      suggestions.push('sharpen');
    }

    setSuggestedMethods(suggestions);
    setSelectedMethods(new Set(suggestions));
    setShowSuggestions(true);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-center min-h-[400px] p-4">
          {showOriginal ? (
            <img 
              src={imageUrl} 
              alt="Original" 
              className="max-w-full max-h-[500px] object-contain"
            />
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[500px] object-contain"
            />
          )}
        </div>

        {/* Original/Processed toggle */}
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
        >
          {showOriginal ? <Eye size={14} /> : <EyeOff size={14} />}
          {showOriginal ? 'Show Processed' : 'Show Original'}
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Rotation */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
            Rotation
          </label>
          <button
            onClick={() => handleRotate(-90)}
            className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Rotate left 90°"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => handleRotate(90)}
            className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Rotate right 90°"
          >
            <RotateCw size={16} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {rotation}°
          </span>
        </div>

        {/* Brightness */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 flex items-center gap-2">
            <Sun size={14} />
            Brightness
          </label>
          <input
            type="range"
            min="50"
            max="150"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
            {brightness}%
          </span>
        </div>

        {/* Contrast */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 flex items-center gap-2">
            <Contrast size={14} />
            Contrast
          </label>
          <input
            type="range"
            min="50"
            max="150"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
            {contrast}%
          </span>
        </div>

        {/* Scale */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
            Scale
          </label>
          <button
            onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
            className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setScale((prev) => Math.min(3, prev + 0.1))}
            className="p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {(scale * 100).toFixed(0)}%
          </span>
        </div>

        {/* Preprocessing Methods - Multi-Select */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Preprocessing Methods
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={analyzeImageAndSuggest}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Loader size={12} />
                Auto-Suggest
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedMethods.size} selected
              </span>
            </div>
          </div>

          {showSuggestions && suggestedMethods.length > 0 && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Sun size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Suggested Methods Based on Image Analysis
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    {suggestedMethods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <EyeOff size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {[
              { id: 'none', label: 'None (Original)', desc: '✨ Original image with brightness/contrast/rotation adjustments' },
              { id: 'grayscale', label: 'Grayscale', desc: '⚫ Converts to grayscale - removes color information' },
              { id: 'threshold', label: 'Binary Threshold', desc: '📊 Binary threshold using Otsu\'s method - best for high contrast text' },
              { id: 'adaptive', label: 'Adaptive Threshold', desc: '🔆 Adaptive threshold - adjusts for varying lighting conditions' },
              { id: 'denoise', label: 'Denoise', desc: '🧹 Median filter - removes noise and artifacts' },
              { id: 'sharpen', label: 'Sharpen', desc: '🔍 Sharpens edges - enhances text clarity' }
            ].map(method => (
              <label key={method.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMethods.has(method.id)}
                  onChange={() => toggleMethod(method.id)}
                  className="mt-0.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {method.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {method.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Preview Mode - Single Method Selection */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Preview Method (for canvas display)
            </label>
            <div className="flex flex-wrap gap-2">
              {['none', 'grayscale', 'threshold', 'adaptive', 'denoise', 'sharpen'].map(method => (
                <button
                  key={method}
                  onClick={() => setPreprocessMethod(method)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    preprocessMethod === method
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw size={16} />
          Reset
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <Download size={16} />
            Download
          </button>

          {onImageProcessed && (
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Apply Current Preview
            </button>
          )}

          {onBatchProcess && (
            <button
              onClick={handleBatchProcess}
              disabled={selectedMethods.size === 0 || isBatchProcessing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isBatchProcessing ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Processing {selectedMethods.size} methods...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Process {selectedMethods.size} Selected Method{selectedMethods.size !== 1 ? 's' : ''}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>Tips for better OCR:</strong> Increase contrast for faded text, adjust brightness for dark/light images,
          rotate if text is sideways. Click "Apply & Re-process OCR" to run OCR again with the adjusted image.
        </p>
      </div>
    </div>
  );
}

