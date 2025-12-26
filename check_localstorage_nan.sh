#!/bin/bash
# Check localStorage for NaN values in PRICE field

echo "=== Checking localStorage for NaN PRICE values ==="
echo ""

# Create a Node.js script to check the data
cat > /tmp/check_nan.js << 'EOF'
const fs = require('fs');

// Simulate localStorage data (we'll inject real data)
const listingsJson = process.argv[2];

if (!listingsJson || listingsJson === 'null') {
  console.log("No listings in localStorage");
  process.exit(0);
}

try {
  const listings = JSON.parse(listingsJson);
  
  console.log(`Total listings: ${listings.length}`);
  console.log("");
  
  let nanCount = 0;
  let emptyCount = 0;
  let validCount = 0;
  
  listings.forEach((listing, idx) => {
    const price = listing.PRICE;
    const priceNum = Number(price);
    
    if (price === null || price === undefined || price === '') {
      emptyCount++;
      console.log(`[${idx}] EMPTY PRICE:`);
      console.log(`  ID: ${listing.id}`);
      console.log(`  TITLE: ${listing.TITLE}`);
      console.log(`  PRICE: ${JSON.stringify(price)} (type: ${typeof price})`);
      console.log(`  Number(PRICE): ${priceNum}`);
      console.log("");
    } else if (isNaN(priceNum)) {
      nanCount++;
      console.log(`[${idx}] NaN PRICE:`);
      console.log(`  ID: ${listing.id}`);
      console.log(`  TITLE: ${listing.TITLE}`);
      console.log(`  PRICE: ${JSON.stringify(price)} (type: ${typeof price})`);
      console.log(`  Number(PRICE): ${priceNum}`);
      console.log("");
    } else {
      validCount++;
    }
  });
  
  console.log("=== SUMMARY ===");
  console.log(`Valid prices: ${validCount}`);
  console.log(`Empty prices: ${emptyCount}`);
  console.log(`NaN prices: ${nanCount}`);
  console.log(`Total: ${listings.length}`);
  
} catch (err) {
  console.error("Failed to parse listings:", err.message);
  process.exit(1);
}
EOF

# Get listings from localStorage using Python (since we can't access browser localStorage directly)
# We'll use the screenshot OCR to see what's in the browser
echo "Taking screenshot of current state..."
scrot /tmp/localstorage_check.png 2>/dev/null || import -window root /tmp/localstorage_check.png

echo "Running OCR to see current data..."
tesseract /tmp/localstorage_check.png /tmp/localstorage_ocr 2>&1 > /dev/null
echo "---OCR OUTPUT---"
cat /tmp/localstorage_ocr.txt

echo ""
echo "Opening screenshot in VSCode..."
code /tmp/localstorage_check.png

echo ""
echo "=== ANALYSIS ==="
echo "Based on OCR, checking for NaN in price column..."
grep -i "nan" /tmp/localstorage_ocr.txt && echo "✅ Found NaN in display" || echo "❌ No NaN found in display"

