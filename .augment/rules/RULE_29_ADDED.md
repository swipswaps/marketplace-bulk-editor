# Rule 29 Added - Browser Priority for Selenium Tests

**Date**: 2025-12-29  
**Version**: 4.2 (upgraded from 4.1)  
**Trigger**: User request: "implement a Firefox → Chromium → Chrome priority rule"

---

## User Request

> "implement a Firefox → Chromium → Chrome priority rule
> 
> in this workspace, if marketplace-bulk-editor is open,"

---

## What Was Added

### Rule 29: Browser Priority for Selenium Tests (CRITICAL)

**Location**: `.augment/rules/mandatory-rules.md` lines 353-449  
**Size**: 97 lines (new rule)  
**Total file size**: 504 lines (was 364 lines)

---

## The Mandatory Priority

### Browser Selection Order:

1. **Firefox** (first choice)
   - Check if marketplace-bulk-editor is already open in Firefox (Rule 26)
   - If yes: Note it, but create new instance for full Selenium control
   - If no: Create new Firefox instance
   - Reason: User may already have app open, Firefox DevTools excellent

2. **Chromium** (second choice)
   - If Firefox not available, try Chromium
   - Reason: Open-source alternative to Chrome, often pre-installed on Linux

3. **Chrome** (third choice)
   - If Chromium not available, use Chrome
   - Reason: Last resort, proprietary but widely available

---

## Implementation Pattern

### Required Code Structure:

```python
def setup_driver():
    """Setup WebDriver with browser priority: Firefox → Chromium → Chrome"""
    
    # Step 1: Check for existing Firefox window
    existing_firefox = check_existing_firefox_window()
    if existing_firefox:
        print(f"✅ Found existing Firefox window: {existing_firefox['title']}")
    
    # Step 2: Try Firefox (new instance)
    try:
        driver = webdriver.Firefox(options=firefox_options)
        print("✅ Using Firefox")
        return driver
    except Exception as e:
        print(f"⚠️  Firefox not available: {e}")
    
    # Step 3: Try Chromium
    try:
        chromium_options.binary_location = "/usr/bin/chromium"
        driver = webdriver.Chrome(options=chromium_options)
        print("✅ Using Chromium")
        return driver
    except Exception as e:
        print(f"⚠️  Chromium not available: {e}")
    
    # Step 4: Try Chrome
    try:
        driver = webdriver.Chrome(options=chrome_options)
        print("✅ Using Chrome")
        return driver
    except Exception as e:
        raise Exception("No browser available")
```

---

## Evidence Requirements

**ALWAYS show which browser was selected:**

```
Browser priority: Firefox → Chromium → Chrome

Step 1: Checking for existing Firefox window with marketplace-bulk-editor...
⚠️  No existing Firefox window found

Step 2: Trying Firefox (new instance)...
✅ PASS: Firefox WebDriver initialized
```

**OR if Firefox fails:**

```
Browser priority: Firefox → Chromium → Chrome

Step 1: Checking for existing Firefox window with marketplace-bulk-editor...
⚠️  No existing Firefox window found

Step 2: Trying Firefox (new instance)...
⚠️  Firefox not available: geckodriver not found

Step 3: Trying Chromium...
✅ PASS: Chromium WebDriver initialized
```

---

## Files Modified

### 1. `.augment/rules/mandatory-rules.md`
- Added Rule 29 (97 lines)
- Updated version to 4.2
- Total: 504 lines (was 364 lines)

### 2. `test_backup_ui.py`
- Added `check_existing_firefox_window()` function
- Replaced `setup_driver()` with browser priority logic
- Shows which browser was selected
- Total: 471 lines (was 377 lines)

### 3. `.augment/rules/workspace-guidelines.md`
- Updated "Selenium Best Practices" section
- Replaced Chrome-only example with Firefox → Chromium → Chrome
- Added complete implementation example
- Total: 271 lines (was 203 lines)

### 4. `.augment/rules/RULE_29_ADDED.md` (this file)
- Documents the new rule
- Explains browser priority
- Shows implementation pattern

---

## Impact

### Before Rule 29
- ❌ Tests used Chrome directly without trying Firefox
- ❌ No check for existing Firefox window
- ❌ No fallback to Chromium
- ❌ Violated user's expectation of Firefox priority

### After Rule 29
- ✅ Tests try Firefox first
- ✅ Check for existing Firefox window (Rule 26)
- ✅ Fallback to Chromium, then Chrome
- ✅ Show evidence of browser selection
- ✅ Explain why fallback occurred

---

## Verification

```bash
# Count total rules
$ grep -c "^## Rule" .augment/rules/mandatory-rules.md
29

# Verify Rule 29 exists
$ grep "^## Rule 29" .augment/rules/mandatory-rules.md
## Rule 29: Browser Priority for Selenium Tests (CRITICAL)

# Check version
$ grep "^**Version**:" .augment/rules/mandatory-rules.md
**Version**: 4.2
```

---

## Integration with Existing Rules

### Rule 26: Use Existing Browser Window
- Rule 29 calls Rule 26's `check_existing_firefox_window()` function
- If existing window found, note it but create new instance for Selenium control
- Preserves Rule 26's xdotool-based window detection

### Rule 2: Evidence-Before-Assertion
- Rule 29 requires showing which browser was selected
- Must show why fallback occurred
- Must show full error messages if browser unavailable

### Rule 0: Mandatory Workflow Pattern
- Rule 29 follows per-step pattern
- Shows evidence at each step
- Explains which rule applies

---

## Summary

✅ **Rule 29 added** - Browser priority requirement  
✅ **Version updated** - 4.1 → 4.2  
✅ **Test script updated** - `test_backup_ui.py` now follows priority  
✅ **Documentation updated** - workspace-guidelines.md reflects new rule  
✅ **Documentation created** - This summary file  

**The assistant will now be required to use Firefox → Chromium → Chrome priority for all Selenium tests.**

---

**This rule ensures Firefox is preferred, with graceful fallback to Chromium and Chrome.**

