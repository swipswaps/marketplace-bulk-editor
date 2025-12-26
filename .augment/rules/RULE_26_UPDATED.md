# Rule 26 Updated - Fixed Firefox Window Detection

**Date**: 2025-12-24  
**Trigger**: User complaint: "the titles are not all just 'Firefox' - if you don't know how to find out, I must change agents"

---

## What Was Wrong

### The Old Command (BROKEN)
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  name=$(DISPLAY=:0 xdotool getwindowname $wid 2>/dev/null)
  echo "$wid: $name"
done
```

**Output:**
```
60817409: Firefox
60913302: Firefox
60916886: Firefox
61076769: Firefox
```

**Problem**: All titles show as just "Firefox" - cannot identify which window has the marketplace app!

---

## What Was Fixed

### The New Command (WORKING)
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  echo "$wid: $title"
done
```

**Output:**
```
60817409: Firefox
61082223: VSCode Terminal Cursor Issues — Mozilla Firefox
61083791: marketplace-bulk-editor — Mozilla Firefox Private Browsing
```

**Solution**: Use `xprop` instead of `xdotool getwindowname` to get FULL window titles!

---

## Why This Matters

### The Difference

| Tool | Command | Output |
|------|---------|--------|
| **xdotool** | `xdotool getwindowname $wid` | "Firefox" (truncated) |
| **xprop** | `xprop -id $wid _NET_WM_NAME` | "marketplace-bulk-editor — Mozilla Firefox Private Browsing" (full) |

### Impact

**Before (BROKEN):**
- ❌ Cannot identify which Firefox window has the app
- ❌ Must guess or try each window
- ❌ Screenshots show wrong window (VSCode instead of Firefox)
- ❌ Violates Rule 27 (making claims without OCR evidence)

**After (FIXED):**
- ✅ Can identify exact window by title
- ✅ Activate correct window on first try
- ✅ Screenshots show correct window
- ✅ Can verify with OCR

---

## How To Use

### Step 1: List all Firefox windows with full titles
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  echo "$wid: $title"
done
```

### Step 2: Find the window with "marketplace" in title
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do 
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  if echo "$title" | grep -qi "marketplace"; then 
    echo "$wid: $title"
  fi
done
```

**Output:**
```
61083791: marketplace-bulk-editor — Mozilla Firefox Private Browsing
```

### Step 3: Extract window ID and activate
```bash
WINDOW_ID=61083791
DISPLAY=:0 xdotool windowactivate --sync $WINDOW_ID && DISPLAY=:0 xdotool windowraise $WINDOW_ID
sleep 2
```

### Step 4: Take screenshot
```bash
DISPLAY=:0 import -window root /tmp/screenshot.png
```

### Step 5: Run OCR
```bash
tesseract /tmp/screenshot.png /tmp/ocr_output && cat /tmp/ocr_output.txt
```

### Step 6: Display screenshot to user
```bash
code /tmp/screenshot.png
```

---

## Files Modified

1. **`.augment/rules/mandatory-rules.md`** (lines 44-97)
   - Updated Rule 26 with working `xprop` command
   - Added example output showing full titles
   - Added alternative command with grep filter
   - Added to forbidden list: "Using `xdotool getwindowname`"

2. **`.augment/rules/RULE_26_UPDATED.md`** (this file)
   - Documents the fix
   - Explains why `xprop` works and `xdotool getwindowname` doesn't

---

## Lesson Learned

**Never assume a command works just because it runs without errors.**

- `xdotool getwindowname` runs successfully
- But it returns truncated/generic titles
- Must use `xprop -id $wid _NET_WM_NAME` to get full titles

**This is why Rule 2 (Evidence-Before-Assertion) exists:**
- Don't claim "all titles are just Firefox" without checking
- User was right: titles are NOT all just "Firefox"
- The command was wrong, not the data

---

**Status**: ✅ Rule 26 updated with working command  
**Verified**: `xprop` returns full window titles  
**Next Steps**: Use this command to find and screenshot the marketplace app

