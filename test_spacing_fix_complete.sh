#!/bin/bash
# Test OCR Spacing Fix - Complete End-to-End Test
# Tests that "fi le" → "file", "CsV" → "CSV", etc. are fixed

set -e

echo "=========================================="
echo "OCR Spacing Fix - Complete Test"
echo "=========================================="

# Step 1: Find Firefox window
echo ""
echo "### Step 1: Find Firefox Window"
WINDOW_ID=$(DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  if echo "$title" | grep -qi "marketplace"; then 
    echo "$wid"
    break
  fi
done)

if [ -z "$WINDOW_ID" ]; then
  echo "❌ Firefox window with 'marketplace' not found"
  echo "Please open http://localhost:5174/ in Firefox"
  exit 1
fi

echo "✅ Found Firefox window: $WINDOW_ID"

# Step 2: Activate window
echo ""
echo "### Step 2: Activate Firefox Window"
DISPLAY=:0 xdotool windowactivate --sync $WINDOW_ID
DISPLAY=:0 xdotool windowraise $WINDOW_ID
sleep 2
echo "✅ Window activated"

# Step 3: Take screenshot BEFORE upload
echo ""
echo "### Step 3: Screenshot Before Upload"
DISPLAY=:0 import -window root /tmp/before_upload.png
echo "✅ Screenshot saved: /tmp/before_upload.png"
code /tmp/before_upload.png

# Step 4: Wait for user to upload image
echo ""
echo "=========================================="
echo "USER ACTION REQUIRED:"
echo "=========================================="
echo "1. Make sure 'Clear previous results' checkbox is CHECKED"
echo "2. Upload the image: 'Screenshot 2025-11-18 at 07-09-25 Marketplace Data Editor - Multi-Format Template Mapper.png'"
echo "3. Wait for OCR processing to complete"
echo "4. Press ENTER when done"
echo "=========================================="
read -p "Press ENTER when upload is complete..."

# Step 5: Take screenshot AFTER upload
echo ""
echo "### Step 5: Screenshot After Upload"
sleep 2
DISPLAY=:0 import -window root /tmp/after_upload.png
echo "✅ Screenshot saved: /tmp/after_upload.png"
code /tmp/after_upload.png

# Step 6: Run OCR on screenshot
echo ""
echo "### Step 6: Run OCR on Screenshot"
tesseract /tmp/after_upload.png /tmp/ocr_result 2>/dev/null
echo "✅ OCR complete"

# Step 7: Check for spacing issues
echo ""
echo "### Step 7: Check for Spacing Issues"
echo ""
echo "Checking OCR output for spacing issues..."

ISSUES_FOUND=0

if grep -q "fi le" /tmp/ocr_result.txt; then
  echo "❌ FAIL: Found 'fi le' (should be 'file')"
  grep "fi le" /tmp/ocr_result.txt | head -3
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -q "CsV" /tmp/ocr_result.txt; then
  echo "❌ FAIL: Found 'CsV' (should be 'CSV')"
  grep "CsV" /tmp/ocr_result.txt | head -3
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -q "JsON" /tmp/ocr_result.txt; then
  echo "❌ FAIL: Found 'JsON' (should be 'JSON')"
  grep "JsON" /tmp/ocr_result.txt | head -3
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if grep -q "XLsx" /tmp/ocr_result.txt; then
  echo "❌ FAIL: Found 'XLsx' (should be 'XLSX')"
  grep "XLsx" /tmp/ocr_result.txt | head -3
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Step 8: Check backend logs
echo ""
echo "### Step 8: Check Backend Logs"
echo ""
echo "Backend debug output:"
docker logs marketplace-backend --tail 50 | grep "OCR DEBUG" || echo "⚠️  No debug output found"

# Step 9: Report results
echo ""
echo "=========================================="
echo "TEST RESULTS"
echo "=========================================="

if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ PASS: No spacing issues found!"
  echo ""
  echo "Correctly formatted text found:"
  grep -E "file|CSV|JSON|XLSX" /tmp/ocr_result.txt | head -5
  exit 0
else
  echo "❌ FAIL: $ISSUES_FOUND spacing issues found"
  echo ""
  echo "Full OCR output:"
  cat /tmp/ocr_result.txt
  exit 1
fi

