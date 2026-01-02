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
  EyeOff
} from 'lucide-react';

interface ImagePreprocessorProps {
  imageUrl: string;
  onImageProcessed?: (processedImageUrl: string) => void;
}

export function ImagePreprocessor({ imageUrl, onImageProcessed }: ImagePreprocessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [scale, setScale] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

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
  }, [rotation, brightness, contrast, scale]);

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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply & Re-process OCR
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

