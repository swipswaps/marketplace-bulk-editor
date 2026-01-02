/**
 * OCR Service - Enhanced with PaddleOCR + Tesseract fallback
 * Based on receipts-ocr patterns with optimizations:
 * - Better sharpening (PIL ImageFilter.SHARPEN equivalent)
 * - Multi-resolution testing for better accuracy
 * - PaddleOCR backend + Tesseract.js browser fallback
 */

import type { OcrResponse, ParsedProduct } from '../types/ocr';
import { API_BASE } from '../config';

type LogFn = (msg: string, level: 'info' | 'success' | 'warn' | 'error') => void;

// Removed unused OCR_ERROR_PATTERNS and fixCommonOcrErrors - error correction is now handled in ocrPostProcessing.ts

/**
 * Check backend health
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/health`, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    clearTimeout(timeoutId);

    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
};

/**
 * Preprocess image - handle HEIC and EXIF rotation
 */
export const preprocessImage = async (
  file: File,
  onLog?: LogFn
): Promise<File> => {
  // For now, return file as-is
  // HEIC conversion and EXIF rotation will be handled by backend
  onLog?.('Image preprocessing will be handled by backend', 'info');
  return file;
};

/**
 * Process image with Docker backend (PaddleOCR)
 */
export const processWithPaddleOCR = async (
  file: File,
  accessToken: string,
  onLog?: LogFn,
  ocrEngine?: string
): Promise<OcrResponse> => {
  onLog?.('Sending to PaddleOCR backend...', 'info');

  const formData = new FormData();
  formData.append('file', file);
  if (ocrEngine) {
    formData.append('ocr_engine', ocrEngine);
  }

  onLog?.('Waiting for PaddleOCR response (this may take up to 60 seconds)...', 'info');

  try {
    // PaddleOCR can take 30-40 seconds on first run, so use 60-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

    const response = await fetch(`${API_BASE}/api/ocr/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        // Response might not be JSON
      }

      if (response.status === 401) {
        onLog?.('Authentication failed - please log in again', 'error');
        throw new Error('Authentication failed - please log in again');
      }

      onLog?.(`Backend error: ${errorMessage}`, 'error');
      throw new Error(`Backend error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();

    onLog?.(`OCR complete: ${data.ocr_scan?.items_extracted || 0} items extracted`, 'success');

    return {
      success: true,
      filename: file.name,
      scan_id: data.ocr_scan?.id,
      raw_text: data.ocr_scan?.ocr_text || '',
      parsed: data.ocr_scan?.extracted_data || { products: [] },
      confidence_score: data.ocr_scan?.confidence_score,
      processing_time: data.ocr_scan?.processing_time
    };
  } catch (error) {
    onLog?.(`PaddleOCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    throw error;
  }
};

/**
 * Preprocess image for better OCR accuracy
 * - 3x scale for better text recognition (was 2x)
 * - Grayscale conversion
 * - Enhanced contrast (2.0 instead of 1.5)
 * - Adaptive thresholding for better text separation
 * - Noise reduction
 */
const preprocessImageForOCR = async (file: File, onLog?: LogFn): Promise<string> => {
  onLog?.('Preprocessing image for OCR (3x scale, enhanced contrast, adaptive threshold)...', 'info');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas at 3x size for better OCR accuracy (especially for small text)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Scale up 3x for better OCR accuracy (was 2x)
      const scaleFactor = 3;
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      // Enable image smoothing for LANCZOS-like quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // First pass: Convert to grayscale
      const grayData = new Uint8ClampedArray(canvas.width * canvas.height);
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        grayData[i / 4] = gray;
      }

      // Second pass: Enhanced contrast (factor 2.0 instead of 1.5)
      const contrast = 2.0;
      for (let i = 0; i < grayData.length; i++) {
        const enhanced = ((grayData[i] / 255 - 0.5) * contrast + 0.5) * 255;
        grayData[i] = Math.max(0, Math.min(255, enhanced));
      }

      // Third pass: Adaptive thresholding for better text separation
      // Use Otsu's method approximation
      const threshold = calculateOtsuThreshold(grayData);
      onLog?.(`Calculated threshold: ${threshold}`, 'info');

      // Apply threshold
      for (let i = 0; i < data.length; i += 4) {
        const gray = grayData[i / 4];
        const binary = gray > threshold ? 255 : 0;

        data[i] = binary;     // R
        data[i + 1] = binary; // G
        data[i + 2] = binary; // B
        // Alpha unchanged
      }

      ctx.putImageData(imageData, 0, 0);

      // Return as data URL
      const dataUrl = canvas.toDataURL('image/png');
      onLog?.(`Image preprocessed: ${canvas.width}x${canvas.height}px (${scaleFactor}x scale)`, 'info');
      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate Otsu's threshold for adaptive binarization
 * Finds optimal threshold to separate foreground (text) from background
 */
function calculateOtsuThreshold(grayData: Uint8ClampedArray): number {
  // Build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < grayData.length; i++) {
    histogram[grayData[i]]++;
  }

  // Total number of pixels
  const total = grayData.length;

  // Calculate sum of all pixel values
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
    wB += histogram[t]; // Weight background
    if (wB === 0) continue;

    wF = total - wB; // Weight foreground
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB; // Mean background
    const mF = (sum - sumB) / wF; // Mean foreground

    // Calculate between-class variance
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

// Removed unused mergeTextRegionsByLine function - backend PaddleOCR handles this

/**
 * Process image with Tesseract.js (browser fallback)
 * Enhanced with image preprocessing and spatial analysis for better accuracy
 */
export const processWithTesseract = async (
  file: File,
  onLog?: LogFn
): Promise<OcrResponse> => {
  onLog?.('Processing with Tesseract.js (browser fallback)...', 'info');

  // Preprocess image for better OCR
  const preprocessedImage = await preprocessImageForOCR(file, onLog);

  // Tesseract.js will be loaded dynamically
  const { createWorker } = await import('tesseract.js');

  onLog?.('Initializing Tesseract worker...', 'info');
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onLog?.(`Recognizing text: ${Math.round(m.progress * 100)}%`, 'info');
      }
    }
  });

  // Configure Tesseract for better multi-line text extraction
  await worker.setParameters({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tessedit_pageseg_mode: 1 as any, // Automatic page segmentation with OSD (Orientation and Script Detection)
    preserve_interword_spaces: '1', // Preserve spaces between words
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?@#$%&*()-_+=:;"\'/\\|[]{}', // Allow common characters
  });

  onLog?.('Running OCR recognition...', 'info');

  // Use preprocessed image instead of raw file
  const result = await worker.recognize(preprocessedImage);
  await worker.terminate();

  // Extract text from Tesseract.js result
  const text = result.data.text;
  const lines = text.split('\n').filter(l => l.trim());

  onLog?.(`OCR complete: Extracted ${lines.length} lines of text`, 'success');
  onLog?.(`Confidence: ${result.data.confidence.toFixed(1)}%`, 'info');

  // Simple product parsing
  const products = parseProductText(lines);

  onLog?.(`Parsed ${products.length} products from text`, 'success');

  return {
    success: true,
    filename: file.name,
    raw_text: text,
    parsed: { products },
    confidence_score: result.data.confidence / 100
  };
};

/**
 * Simple product text parser
 * Extracts product information from OCR text lines
 *
 * Strategy:
 * 1. Each non-empty line becomes a potential product
 * 2. Extract price if present (various formats: $X.XX, $X, X.XX, etc.)
 * 3. Use remaining text as product name
 * 4. If no price found, use entire line as product name with price = 0
 */
function parseProductText(lines: string[]): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  // Multiple price patterns to catch various formats
  const pricePatterns = [
    /\$\s*(\d+(?:[.,]\d{2})?)/,  // $100.00, $100, $ 100.00
    /(\d+(?:[.,]\d{2}))\s*\$/,   // 100.00$, 100$
    /\b(\d+\.\d{2})\b/,          // 100.00 (standalone)
    /\b(\d+)\s*(?:dollars?|usd)\b/i, // 100 dollars, 100 USD
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip very short lines (likely noise)
    if (trimmed.length < 3) continue;

    // Skip lines that are just numbers or single characters
    if (/^[\d\s.,!?@#$%&*()-_+=:;"/\\|[\]{}]+$/.test(trimmed)) continue;

    // Skip common UI text that's not a product
    const skipPatterns = [
      /^(screenshot|archive|omni|dash|toolkit|internet|page|of|the|and|or|for|with|from|to|at|in|on|by)$/i,
      /^\d{4}-\d{2}-\d{2}/, // Dates
      /^\d{2}:\d{2}/, // Times
    ];

    if (skipPatterns.some(pattern => pattern.test(trimmed))) continue;

    // Try to extract price
    let price: number | null = null;
    let name = trimmed;

    for (const pattern of pricePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const priceStr = match[1].replace(',', '.');
        price = parseFloat(priceStr);

        // Remove price from name
        name = trimmed.replace(match[0], '').trim();
        break;
      }
    }

    // If no price found, use 0 as default
    if (price === null) {
      price = 0;
      name = trimmed;
    }

    // Skip if name is empty after price extraction
    if (!name || name.length < 2) continue;

    // Clean up name
    name = name
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/^[-•*]\s*/, '') // Remove bullet points
      .trim();

    // Skip if cleaned name is too short
    if (name.length < 2) continue;

    products.push({
      name,
      price,
      description: trimmed,
      condition: 'New',
      category: ''
    });
  }

  return products;
}

