"""
OCR Processing Utilities
Enhanced with PaddleOCR + Tesseract fallback, optimized sharpening, multi-resolution testing
"""

import os
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

logger = logging.getLogger(__name__)

# Common OCR error patterns to fix
OCR_ERROR_PATTERNS = {
    # Spacing errors
    r'\bfi le\b': 'file',
    r'\bfi les\b': 'files',
    r'\bCsV\b': 'CSV',
    r'\bJsON\b': 'JSON',
    r'\bXLsx\b': 'XLSX',
    r'\bXLSx\b': 'XLSX',
    r'\bxlsx\b': 'xlsx',
    r'\bplo\b': 'upload',  # Common OCR error for "upload"

    # Layout errors (letters merged with words)
    r'\bDI([A-Z][a-z]+)': r'\1',  # "DINeed" → "Need"
    r'\bOD([A-Z][a-z]+)': r'\1',  # "ODNext" → "Next"
    r'\bV([A-Z][a-z]+)': r'\1',   # "VTemplate" → "Template"

    # Common character confusions
    r'\b0([A-Z])': r'O\1',  # "0ption" → "Option"
    r'\bl([A-Z])': r'I\1',  # "lnfo" → "Info"
    r'\b([A-Z][a-z]+)0\b': r'\1O',  # "Hell0" → "Hello"

    # Number/letter confusions in prices
    r'\$\s*O(\d)': r'$\1',  # "$O50" → "$50"
    r'\$\s*0(\d)': r'$\1',  # "$050" → "$50"
    r'(\d)\s*O\s*(\d)': r'\1O\2',  # "1 O 5" → "105"

    # Common word errors
    r'\btitIe\b': 'title',
    r'\bTITIE\b': 'TITLE',
    r'\bprlce\b': 'price',
    r'\bPRIGE\b': 'PRICE',
    r'\bconditlon\b': 'condition',
    r'\bGONDITION\b': 'CONDITION',
    r'\bdescriptlon\b': 'description',
    r'\bDESGRIPTION\b': 'DESCRIPTION',
    r'\bcategOry\b': 'category',
    r'\bGATEGORY\b': 'CATEGORY',
    r'\bshlpping\b': 'shipping',
    r'\bSHIPPING\b': 'SHIPPING',

    # Common "rn" vs "m" confusion
    r'\brn\b': 'm',  # "rn" → "m"
    r'\bfrorn\b': 'from',
    r'\btl1e\b': 'the',
    r'\btl1is\b': 'this',
    r'\btl1at\b': 'that',
    r'\bwitl1\b': 'with',
    r'\bwl1ich\b': 'which',
    r'\bwl1ere\b': 'where',
    r'\bwl1en\b': 'when',
    r'\bwl1at\b': 'what',
    r'\bwl1o\b': 'who',

    # Price formatting
    r'\$\s+(\d)': r'$\1',  # "$ 100" → "$100"
    r'(\d)\s+\.\s+(\d{2})': r'\1.\2',  # "100 . 00" → "100.00"
    r'(\d),\s*(\d{3})': r'\1,\2',  # "1, 000" → "1,000"

    # ALL CAPS words merged together (column headers)
    # Split sequences of 2+ ALL CAPS words (min 3 letters each)
    r'([A-Z]{3,})([A-Z]{3,})': r'\1 \2',  # "TITLEPRICE" → "TITLE PRICE"
}

# Try to import PaddleOCR (optional dependency)
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
    logger.info("PaddleOCR is available")

    # Create global PaddleOCR instance (receipts-ocr pattern)
    # This is initialized ONCE and reused across all requests
    # Avoids 15-20 second model loading delay on every request
    _PADDLE_OCR_INSTANCE = None

    def get_paddle_ocr():
        """Get or create the global PaddleOCR instance (singleton pattern)"""
        global _PADDLE_OCR_INSTANCE
        if _PADDLE_OCR_INSTANCE is None:
            logger.info("Initializing PaddleOCR instance (first time only)...")
            _PADDLE_OCR_INSTANCE = PaddleOCR(
                lang="en",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
                text_det_limit_side_len=2560,
                text_det_limit_type="max",
                text_det_thresh=0.3,
                text_det_box_thresh=0.5,
            )
            logger.info("PaddleOCR instance initialized successfully")
        return _PADDLE_OCR_INSTANCE

except ImportError:
    PADDLE_AVAILABLE = False
    logger.warning("PaddleOCR not available, will use Tesseract fallback")

    def get_paddle_ocr():
        raise RuntimeError("PaddleOCR is not available")

# Try to import pytesseract (fallback)
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
    logger.info("Tesseract is available")
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.error("Neither PaddleOCR nor Tesseract is available!")


def fix_common_ocr_errors(text: str) -> str:
    """
    Fix common OCR errors using regex patterns

    Args:
        text: Raw OCR text

    Returns:
        Corrected text
    """
    import re

    corrected = text

    # FIRST: Fix partial words that were split by OCR
    # "CONDIT ION" → "CONDITION", "DESCRIPT ION" → "DESCRIPTION"
    corrected = re.sub(r'\bCONDIT\s+ION\b', 'CONDITION', corrected)
    corrected = re.sub(r'\bDESCRIPT\s+ION\b', 'DESCRIPTION', corrected)
    corrected = re.sub(r'\bCATEG\s+ORY\b', 'CATEGORY', corrected)
    corrected = re.sub(r'\bSHIPP\s+ING\b', 'SHIPPING', corrected)

    # SECOND: Handle ALL CAPS sequences (column headers like "TITLEPRICECONDITION")
    # Use dictionary of known words to split intelligently
    # Common column header words (Facebook Marketplace format)
    known_words = [
        'TITLE', 'PRICE', 'CONDITION', 'DESCRIPTION', 'CATEGORY',
        'OFFER', 'SHIPPING', 'NEW', 'USED', 'LIKE', 'GOOD', 'FAIR',
        'YES', 'NO', 'EXPORT', 'IMPORT', 'EDITOR', 'PREVIEW',
        'XLSX', 'CSV', 'JSON', 'SQL', 'FACEBOOK', 'TEMPLATE',
        'DOWNLOAD', 'UPLOAD', 'HEADERS', 'ONLY', 'WITH', 'SAMPLE',
        'DATA', 'REQUIRED', 'COLUMN', 'NEXT', 'STEPS', 'NEED',
        'DIFFERENT', 'FORMAT', 'SWITCH', 'OTHER', 'TABS', 'EACH',
        'OWN', 'BUTTON', 'MARKETPLACE', 'BULK'
    ]

    # Sort by length (longest first) to match longer words first
    known_words.sort(key=len, reverse=True)

    def split_all_caps(match):
        text = match.group(0)
        result = text

        # Try to split using known words
        for word in known_words:
            # Replace known word with itself + space marker
            # Use negative lookahead to avoid matching partial words
            pattern = f'({word})(?=[A-Z])'
            result = re.sub(pattern, r'\1 ', result)

        return result.strip()

    # Find sequences of 6+ capital letters (likely merged words)
    corrected = re.sub(r'\b[A-Z]{6,}\b', split_all_caps, corrected)

    # THIRD: Apply other error patterns
    for pattern, replacement in OCR_ERROR_PATTERNS.items():
        corrected = re.sub(pattern, replacement, corrected)

    return corrected


def preprocess_image_enhanced(image_path: str, output_dir: str) -> List[str]:
    """
    Enhanced image preprocessing with multiple techniques:
    1. Original (baseline)
    2. Sharpened (PIL ImageFilter.SHARPEN - Rule 7)
    3. Multi-resolution (test at 150%, 200% for small text)
    4. Enhanced contrast + sharpening
    
    Returns list of preprocessed image paths to test
    """
    img = Image.open(image_path)
    
    # Convert RGBA to RGB if needed
    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    preprocessed_paths = []
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    
    # 1. Original (baseline)
    original_path = os.path.join(output_dir, f"{base_name}_original.png")
    img.save(original_path)
    preprocessed_paths.append(('original', original_path))
    
    # 2. Sharpened (Rule 7: OCR Best Practices)
    sharpened = img.filter(ImageFilter.SHARPEN)
    sharpened_path = os.path.join(output_dir, f"{base_name}_sharpened.png")
    sharpened.save(sharpened_path)
    preprocessed_paths.append(('sharpened', sharpened_path))
    
    # 3. Enhanced sharpening (apply SHARPEN twice for better results)
    enhanced_sharp = img.filter(ImageFilter.SHARPEN).filter(ImageFilter.SHARPEN)
    enhanced_sharp_path = os.path.join(output_dir, f"{base_name}_enhanced_sharp.png")
    enhanced_sharp.save(enhanced_sharp_path)
    preprocessed_paths.append(('enhanced_sharp', enhanced_sharp_path))
    
    # 4. Contrast + Sharpening
    enhancer = ImageEnhance.Contrast(img)
    contrasted = enhancer.enhance(1.5)
    contrast_sharp = contrasted.filter(ImageFilter.SHARPEN)
    contrast_sharp_path = os.path.join(output_dir, f"{base_name}_contrast_sharp.png")
    contrast_sharp.save(contrast_sharp_path)
    preprocessed_paths.append(('contrast_sharp', contrast_sharp_path))
    
    # 5. Multi-resolution: 150% (for small text)
    width, height = img.size
    if width < 2000 or height < 2000:  # Only upscale if image is small
        upscaled_150 = img.resize((int(width * 1.5), int(height * 1.5)), Image.Resampling.LANCZOS)
        upscaled_150_sharp = upscaled_150.filter(ImageFilter.SHARPEN)
        upscaled_150_path = os.path.join(output_dir, f"{base_name}_150pct_sharp.png")
        upscaled_150_sharp.save(upscaled_150_path)
        preprocessed_paths.append(('150pct_sharp', upscaled_150_path))
    
    # 6. Multi-resolution: 200% (for very small text)
    if width < 1500 or height < 1500:  # Only upscale if image is very small
        upscaled_200 = img.resize((int(width * 2.0), int(height * 2.0)), Image.Resampling.LANCZOS)
        upscaled_200_sharp = upscaled_200.filter(ImageFilter.SHARPEN)
        upscaled_200_path = os.path.join(output_dir, f"{base_name}_200pct_sharp.png")
        upscaled_200_sharp.save(upscaled_200_path)
        preprocessed_paths.append(('200pct_sharp', upscaled_200_path))
    
    logger.info(f"Created {len(preprocessed_paths)} preprocessed versions for testing")
    return preprocessed_paths


def merge_text_regions_by_line(rec_texts: List[str], rec_scores: List[float], dt_polys: List) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Merge text regions that belong to the same line using spatial analysis.

    Fixes spacing issues like "fi le" → "file" and "CsV" → "CSV" by:
    1. Grouping regions with similar Y coordinates (same line)
    2. Sorting regions left-to-right within each line
    3. Merging regions with small horizontal gaps (same word)
    4. Preserving regions with large gaps (different words)

    Args:
        rec_texts: List of recognized text strings from PaddleOCR
        rec_scores: List of confidence scores for each text region
        dt_polys: List of bounding box coordinates (numpy arrays)

    Returns:
        Tuple of (merged_lines, blocks) where:
        - merged_lines: List of text strings, one per line
        - blocks: List of block metadata with merged text and boxes
    """
    if not rec_texts or not dt_polys:
        return [], []

    # Build list of regions with their bounding boxes
    regions = []
    for i, text in enumerate(rec_texts):
        if i >= len(dt_polys):
            break

        box = dt_polys[i]
        confidence = rec_scores[i] if i < len(rec_scores) else 0.0

        # Calculate bounding box center and dimensions
        # dt_polys format: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        box_array = box if isinstance(box, np.ndarray) else np.array(box)

        # Get Y coordinate (use top-left and top-right average for line detection)
        y_top = (box_array[0][1] + box_array[1][1]) / 2

        # Get X coordinates (left and right edges)
        x_left = min(box_array[:, 0])
        x_right = max(box_array[:, 0])

        # Get height for line grouping threshold
        height = abs(box_array[2][1] - box_array[0][1])

        regions.append({
            'text': text,
            'confidence': confidence,
            'box': box_array.tolist() if isinstance(box_array, np.ndarray) else box,
            'y_top': y_top,
            'x_left': x_left,
            'x_right': x_right,
            'height': height
        })

    if not regions:
        return [], []

    # Sort regions by Y coordinate (top to bottom)
    regions.sort(key=lambda r: r['y_top'])

    # Group regions into lines based on Y coordinate proximity
    lines = []
    current_line = [regions[0]]

    for i in range(1, len(regions)):
        prev_region = regions[i - 1]
        curr_region = regions[i]

        # Calculate Y distance between regions
        y_distance = abs(curr_region['y_top'] - prev_region['y_top'])

        # Use average height as threshold (regions on same line should have Y distance < 50% of height)
        avg_height = (prev_region['height'] + curr_region['height']) / 2
        threshold = avg_height * 0.5

        if y_distance <= threshold:
            # Same line
            current_line.append(curr_region)
        else:
            # New line
            lines.append(current_line)
            current_line = [curr_region]

    # Don't forget the last line
    if current_line:
        lines.append(current_line)

    # Process each line: sort left-to-right and merge close regions
    merged_lines = []
    merged_blocks = []

    for line_regions in lines:
        # Sort regions in this line by X coordinate (left to right)
        line_regions.sort(key=lambda r: r['x_left'])

        # Merge regions that are close together (same word)
        line_text_parts = []

        for i, region in enumerate(line_regions):
            if i == 0:
                # First region in line
                line_text_parts.append(region['text'])
            else:
                prev_region = line_regions[i - 1]

                # Calculate horizontal gap between regions
                gap = region['x_left'] - prev_region['x_right']

                # Use average height as reference for gap threshold
                avg_height = (prev_region['height'] + region['height']) / 2

                # If gap is small (< 100% of height), merge without space (same word split by OCR)
                # If gap is medium (< 200% of height), add single space (different words)
                # If gap is large (>= 200% of height), add double space (significant separation)
                if gap < avg_height * 1.0:
                    # Same word - merge without space (fixes "fi le" → "file", "CsV" → "CSV")
                    line_text_parts.append(region['text'])
                elif gap < avg_height * 2.0:
                    # Different words - add single space
                    line_text_parts.append(' ' + region['text'])
                else:
                    # Large gap - add double space
                    line_text_parts.append('  ' + region['text'])

        # Join all parts of this line
        merged_line_text = ''.join(line_text_parts)

        # Apply OCR error corrections
        corrected_line_text = fix_common_ocr_errors(merged_line_text)

        # DEBUG: Show before/after correction
        if merged_line_text != corrected_line_text:
            print(f"[OCR FIX] Before: {merged_line_text}")
            print(f"[OCR FIX] After:  {corrected_line_text}")

        merged_lines.append(corrected_line_text)

        # Create merged block for this line
        merged_blocks.append({
            'text': corrected_line_text,
            'confidence': sum(r['confidence'] for r in line_regions) / len(line_regions),
            'box': line_regions[0]['box'],  # Use first region's box as representative
            'regions_count': len(line_regions)
        })

    return merged_lines, merged_blocks


def process_with_paddleocr(image_path: str) -> Tuple[str, float, List[Dict[str, Any]]]:
    """
    Process image with PaddleOCR (using receipts-ocr's working code)
    Enhanced with spatial analysis to fix spacing issues.
    Returns: (raw_text, confidence, blocks)
    """
    if not PADDLE_AVAILABLE:
        raise RuntimeError("PaddleOCR is not available")

    # Get global PaddleOCR instance (receipts-ocr pattern - singleton)
    # This avoids 15-20 second model loading delay on every request
    ocr = get_paddle_ocr()

    # Read image with OpenCV (receipts-ocr pattern)
    import cv2
    img = cv2.imread(image_path)
    if img is None:
        return "", 0.0, []

    # Run OCR (receipts-ocr pattern - uses predict(), not ocr())
    result = ocr.predict(img)

    if not result or len(result) == 0:
        return "", 0.0, []

    # Extract results from PaddleOCR predict() response (receipts-ocr pattern)
    ocr_result = result[0]
    rec_texts = ocr_result.get("rec_texts", [])
    rec_scores = ocr_result.get("rec_scores", [])
    dt_polys = ocr_result.get("dt_polys", [])

    if not rec_texts:
        return "", 0.0, []

    # Use spatial analysis to merge text regions on the same line
    # This fixes spacing issues like "fi le" → "file" and "CsV" → "CSV"
    merged_lines, blocks = merge_text_regions_by_line(rec_texts, rec_scores, dt_polys)

    # DEBUG: Log before and after merging
    print(f"[OCR DEBUG] Before merge: {len(rec_texts)} regions")
    print(f"[OCR DEBUG] After merge: {len(merged_lines)} lines")
    if rec_texts:
        print(f"[OCR DEBUG] First 3 regions before: {rec_texts[:3]}")
    if merged_lines:
        print(f"[OCR DEBUG] First 3 lines after: {merged_lines[:3]}")

    # Join lines with newlines
    raw_text = '\n'.join(merged_lines)

    # Calculate average confidence from blocks
    avg_confidence = sum(b['confidence'] for b in blocks) / len(blocks) if blocks else 0.0

    return raw_text, float(avg_confidence), blocks


def process_with_tesseract(image_path: str, psm_mode: int = 3, oem_mode: int = 3) -> Tuple[str, float]:
    """
    Process image with Tesseract

    Args:
        image_path: Path to image file
        psm_mode: Page segmentation mode (default 3 = fully automatic)
            - 3: Fully automatic page segmentation (default) - BEST for full pages
            - 4: Assume a single column of text of variable sizes
            - 6: Assume a single uniform block of text - GOOD for buttons/UI
            - 11: Sparse text - GOOD for scattered UI elements
        oem_mode: OCR Engine Mode (default 3 = both legacy + LSTM)
            - 0: Legacy engine only
            - 1: Neural nets LSTM engine only
            - 2: Legacy + LSTM engines
            - 3: Default, based on what is available (BEST)

    Returns: (raw_text, confidence)
    """
    if not TESSERACT_AVAILABLE:
        raise RuntimeError("Tesseract is not available")

    img = Image.open(image_path)

    # Build Tesseract config with PSM and OEM modes
    config = f'--psm {psm_mode} --oem {oem_mode}'

    raw_text = pytesseract.image_to_string(img, config=config)

    # Get confidence from Tesseract
    try:
        data = pytesseract.image_to_data(img, config=config, output_type=pytesseract.Output.DICT)
        confidences = [c for c in data['conf'] if c != -1]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
    except:
        avg_confidence = 0.0

    return raw_text, avg_confidence / 100.0  # Normalize to 0-1


def process_with_tesseract_multi_psm(image_path: str) -> Tuple[str, float, int]:
    """
    Process image with multiple PSM modes and choose best result

    Tests PSM modes 3, 4, 6, 11 and selects the one with highest score.
    Score = confidence * text_length (prefers more text with good confidence)

    Returns: (raw_text, confidence, best_psm_mode)
    """
    if not TESSERACT_AVAILABLE:
        raise RuntimeError("Tesseract is not available")

    img = Image.open(image_path)

    # Test these PSM modes (based on empirical testing)
    # PSM 3: Best for full pages with mixed content
    # PSM 4: Good for single column layouts
    # PSM 6: Good for uniform text blocks (buttons, labels)
    # PSM 11: Good for sparse/scattered text (UI elements)
    psm_modes_to_test = [3, 4, 6, 11]

    best_result = None
    best_score = 0.0
    best_psm = 3
    best_confidence = 0.0

    for psm in psm_modes_to_test:
        config = f'--psm {psm} --oem 3'

        try:
            raw_text = pytesseract.image_to_string(img, config=config)
            data = pytesseract.image_to_data(img, config=config, output_type=pytesseract.Output.DICT)
            confidences = [c for c in data['conf'] if c != -1]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Score = confidence * text_length (prefer more text with good confidence)
            score = (avg_confidence / 100.0) * len(raw_text)

            logger.info(f"Tesseract PSM {psm}: confidence={avg_confidence:.2f}%, text_len={len(raw_text)}, score={score:.2f}")

            if score > best_score:
                best_score = score
                best_result = raw_text
                best_confidence = avg_confidence / 100.0
                best_psm = psm
        except Exception as e:
            logger.warning(f"Tesseract PSM {psm} failed: {e}")

    if best_result is None:
        raise RuntimeError("All Tesseract PSM modes failed")

    logger.info(f"Best Tesseract result: PSM {best_psm} (score={best_score:.2f})")

    return best_result, best_confidence, best_psm


def preprocess_for_tesseract(image_path: str, output_dir: str) -> List[Tuple[str, str]]:
    """
    Preprocessing optimized specifically for Tesseract

    Tesseract works best with:
    - High contrast black text on white background
    - Binary (thresholded) images
    - Upscaled images for small text

    Different from PaddleOCR preprocessing which uses sharpening.

    Returns: List of (method_name, preprocessed_path) tuples
    """
    try:
        import cv2
    except ImportError:
        logger.warning("OpenCV not available, skipping Tesseract-specific preprocessing")
        return []

    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"Failed to load image: {image_path}")
        return []

    preprocessed = []
    base_name = os.path.splitext(os.path.basename(image_path))[0]

    # 1. Grayscale + Otsu thresholding (BEST for Tesseract)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    thresh_path = os.path.join(output_dir, f"{base_name}_thresh.png")
    cv2.imwrite(thresh_path, thresh)
    preprocessed.append(('threshold', thresh_path))

    # 2. Adaptive thresholding (GOOD for varying lighting)
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    adaptive_path = os.path.join(output_dir, f"{base_name}_adaptive.png")
    cv2.imwrite(adaptive_path, adaptive)
    preprocessed.append(('adaptive', adaptive_path))

    # 3. Upscale + threshold (GOOD for small text like buttons)
    height, width = img.shape[:2]
    if width < 2000 or height < 2000:
        upscaled = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        gray_up = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)
        _, thresh_up = cv2.threshold(gray_up, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        upscaled_path = os.path.join(output_dir, f"{base_name}_upscaled_thresh.png")
        cv2.imwrite(upscaled_path, thresh_up)
        preprocessed.append(('upscaled_threshold', upscaled_path))

    logger.info(f"Created {len(preprocessed)} Tesseract-specific preprocessed versions")
    return preprocessed


def process_image_multi_method(
    image_path: str,
    temp_dir: str,
    preprocess_method: str = 'auto',
    multi_resolution: bool = True
) -> Dict[str, Any]:
    """
    Process image with multiple preprocessing methods and choose best result

    Args:
        image_path: Path to image file
        temp_dir: Temporary directory for preprocessed images
        preprocess_method: Which preprocessing to use:
            - 'auto': Test all methods and choose best (default)
            - 'threshold': Binary threshold only
            - 'adaptive': Adaptive threshold only
            - 'upscale': Upscale + threshold only
            - 'all': Test all methods (same as 'auto')
        multi_resolution: Whether to test multiple resolutions (default True)

    Strategy:
    1. Try PaddleOCR on all preprocessed versions
    2. If PaddleOCR fails, fall back to Tesseract
    3. Choose result with highest confidence and most text
    """
    start_time = time.time()

    # Create preprocessed versions based on user preference
    if preprocess_method == 'auto' or preprocess_method == 'all':
        # Test all methods
        preprocessed_images = preprocess_image_enhanced(image_path, temp_dir)
    else:
        # Use specific method only
        preprocessed_images = []
        base_name = os.path.splitext(os.path.basename(image_path))[0]

        if preprocess_method == 'threshold':
            # Tesseract-specific threshold preprocessing
            tesseract_prep = preprocess_for_tesseract(image_path, temp_dir)
            preprocessed_images = [p for p in tesseract_prep if 'thresh' in p[0] and 'adaptive' not in p[0]]
        elif preprocess_method == 'adaptive':
            # Tesseract-specific adaptive threshold
            tesseract_prep = preprocess_for_tesseract(image_path, temp_dir)
            preprocessed_images = [p for p in tesseract_prep if 'adaptive' in p[0]]
        elif preprocess_method == 'upscale':
            # Tesseract-specific upscale + threshold
            tesseract_prep = preprocess_for_tesseract(image_path, temp_dir)
            preprocessed_images = [p for p in tesseract_prep if 'upscaled' in p[0]]

        # If no images created (e.g., image too large for upscale), fall back to original
        if not preprocessed_images:
            logger.warning(f"No preprocessed images for method '{preprocess_method}', using original")
            img = Image.open(image_path)
            original_path = os.path.join(temp_dir, f"{base_name}_original.png")
            img.save(original_path)
            preprocessed_images = [('original', original_path)]
    
    best_result = None
    best_score = 0.0
    method_used = None
    
    # Try PaddleOCR first
    if PADDLE_AVAILABLE:
        for method_name, prep_path in preprocessed_images:
            try:
                raw_text, confidence, blocks = process_with_paddleocr(prep_path)
                # Score = confidence * text_length (prefer more text with good confidence)
                score = confidence * len(raw_text)
                
                logger.info(f"PaddleOCR ({method_name}): confidence={confidence:.2f}, text_len={len(raw_text)}, score={score:.2f}")
                
                if score > best_score:
                    best_score = score
                    best_result = {
                        'raw_text': raw_text,
                        'confidence': confidence,
                        'blocks': blocks,
                        'method': f'paddleocr_{method_name}'
                    }
                    method_used = f'paddleocr_{method_name}'
            except Exception as e:
                logger.warning(f"PaddleOCR failed on {method_name}: {e}")
    
    # Fall back to Tesseract if PaddleOCR failed or not available
    if best_result is None and TESSERACT_AVAILABLE:
        # Create Tesseract-specific preprocessed images (threshold, adaptive, upscaled)
        tesseract_preprocessed = preprocess_for_tesseract(image_path, temp_dir)

        # If OpenCV not available, fall back to PaddleOCR preprocessing
        if not tesseract_preprocessed:
            tesseract_preprocessed = preprocessed_images

        for method_name, prep_path in tesseract_preprocessed:
            try:
                # Test multiple PSM modes and choose best
                raw_text, confidence, best_psm = process_with_tesseract_multi_psm(prep_path)
                score = confidence * len(raw_text)

                logger.info(f"Tesseract ({method_name}, PSM {best_psm}): confidence={confidence:.2f}, text_len={len(raw_text)}, score={score:.2f}")

                if score > best_score:
                    best_score = score
                    best_result = {
                        'raw_text': raw_text,
                        'confidence': confidence,
                        'blocks': [],
                        'method': f'tesseract_{method_name}_psm{best_psm}'
                    }
                    method_used = f'tesseract_{method_name}_psm{best_psm}'
            except Exception as e:
                logger.warning(f"Tesseract failed on {method_name}: {e}")
    
    processing_time = time.time() - start_time
    
    if best_result is None:
        raise RuntimeError("All OCR methods failed")
    
    best_result['processing_time'] = processing_time
    best_result['method_used'] = method_used
    
    logger.info(f"Best result: {method_used} (score={best_score:.2f}, time={processing_time:.2f}s)")

    return best_result


def parse_product_catalog(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parse product catalog from OCR text
    Extracts product information for marketplace listings
    """
    import re

    products = []
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

    price_pattern = r'\$?\d+[.,]\d{2}'

    for line in lines:
        # Skip very short lines
        if len(line) < 3:
            continue

        # Extract price if present
        price_match = re.search(price_pattern, line)
        price = None
        if price_match:
            price_str = price_match.group().replace('$', '').replace(',', '')
            try:
                price = float(price_str)
            except:
                pass

        # Extract product name (remove price from line)
        name = re.sub(price_pattern, '', line).strip()

        if name and len(name) >= 3:
            product = {
                'name': name,
                'price': price,
                'description': line,
                'condition': 'New',  # Default
                'category': ''  # To be filled by user
            }
            products.append(product)

    return products

