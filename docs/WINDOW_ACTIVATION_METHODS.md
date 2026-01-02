# Window Activation Methods - What Worked vs What Failed

**Date**: 2025-12-24  
**Purpose**: Document all window activation methods tried in chat history

---

## Methods Found in This Chat Session

### Method 1: Direct Screenshot Without Activation (WORKED)

**What was done:**
```bash
DISPLAY=:0 import -window root /tmp/screenshot.png
tesseract /tmp/screenshot.png /tmp/ocr_output
cat /tmp/ocr_output.txt
code /tmp/screenshot.png
```

**Result:** ✅ WORKED - Captured whatever window was currently visible
**When it worked:** When Firefox with marketplace app was already the active window
**Why it worked:** User had manually opened the marketplace app, so it was already on screen

**Limitation:** Only works if the target window is already active/visible

---

### Method 2: Find Window by Class and Name (ATTEMPTED, INCOMPLETE)

**What was tried:**
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  echo "$wid: $title"
done
```

**Result:** ⚠️ PARTIAL - Found window IDs but titles only showed "Firefox", not full page title
**Issue:** `xprop` returned generic "Firefox" instead of full title like "marketplace-bulk-editor — Mozilla Firefox"

**What should have been done next:**
```bash
# Activate the window
DISPLAY=:0 xdotool windowactivate --sync $WINDOW_ID
DISPLAY=:0 xdotool windowraise $WINDOW_ID
sleep 2

# Then take screenshot
DISPLAY=:0 import -window root /tmp/screenshot.png
```

**Why it failed:** Command timed out during execution, possibly due to window manager issues

---

### Method 3: Search by Window Name (FAILED)

**What was tried:**
```bash
DISPLAY=:0 xdotool search --name "marketplace" 2>/dev/null
```

**Result:** ❌ FAILED - Returned empty (no windows found)
**Why it failed:** Window title might not contain "marketplace" or search pattern was too specific

---

### Method 4: Search by Class "Navigator" (ATTEMPTED)

**What was tried:**
```bash
DISPLAY=:0 xdotool search --class "Navigator" 2>/dev/null | while read wid; do
  name=$(DISPLAY=:0 xdotool getwindowname $wid 2>/dev/null)
  echo "$wid: $name"
done
```

**Result:** ❌ FAILED - Returned empty (no windows found)
**Why it failed:** Firefox might not use "Navigator" as class name on this system

---

## What Should Work (Based on Rule 26)

**From `.augment/rules/mandatory-rules.md` Rule 26:**

### Correct Method (From Rules Documentation)

**Step 1: Find all Firefox windows with FULL titles**
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  echo "$wid: $title"
  if echo "$title" | grep -qi "marketplace"; then 
    echo "$wid"
  fi
done
```

**Step 2: Extract window ID and activate**
```bash
WINDOW_ID=<id_from_step_1>
DISPLAY=:0 xdotool windowactivate --sync $WINDOW_ID
DISPLAY=:0 xdotool windowraise $WINDOW_ID
sleep 2
```

**Step 3: Take screenshot**
```bash
DISPLAY=:0 import -window root /tmp/screenshot.png
```

**Step 4: Run OCR**
```bash
tesseract /tmp/screenshot.png /tmp/ocr_output
cat /tmp/ocr_output.txt
```

**Step 5: Display to user**
```bash
code /tmp/screenshot.png
```

---

## Alternative Method: Try All Firefox Windows

**If title matching fails, try each Firefox window:**

```bash
# Get all Firefox window IDs
WINDOW_IDS=$(DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null)

# Try each window
for wid in $WINDOW_IDS; do
  echo "Trying window $wid..."
  DISPLAY=:0 xdotool windowactivate --sync $wid
  DISPLAY=:0 xdotool windowraise $wid
  sleep 2
  
  # Take screenshot
  DISPLAY=:0 import -window root /tmp/test_$wid.png
  
  # Run OCR
  tesseract /tmp/test_$wid.png /tmp/ocr_$wid
  
  # Check if it contains "marketplace"
  if grep -qi "marketplace" /tmp/ocr_$wid.txt; then
    echo "FOUND marketplace in window $wid!"
    cat /tmp/ocr_$wid.txt
    code /tmp/test_$wid.png
    break
  fi
done
```

---

## Next Steps

1. ✅ Try the "Alternative Method" - activate each Firefox window and check OCR
2. ✅ This guarantees finding the marketplace app without relying on window titles
3. ✅ Once found, proceed with NaN bug verification and fixes

---

**Status**: Documentation complete - ready to test Alternative Method

