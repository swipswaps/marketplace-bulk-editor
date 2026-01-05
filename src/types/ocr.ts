/**
 * OCR Types
 */

export interface ParsedProduct {
  name: string;
  price: number | null;
  description?: string;
  quantity?: number;
  condition?: string;
  category?: string;
}

export interface OcrResponse {
  success: boolean;
  filename: string;
  scan_id?: string;
  raw_text: string;
  parsed: {
    products: ParsedProduct[];
  };
  confidence_score?: number;
  processing_time?: number;
  error?: string;
  preprocessed_image_url?: string; // URL of preprocessed image for comparison
}

export interface OcrScan {
  id: string;
  user_id: string;
  filename: string;
  file_size?: number;
  file_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_text?: string;
  extracted_data?: {
    products: ParsedProduct[];
  };
  error_message?: string;
  processing_time?: number;
  items_extracted?: number;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

