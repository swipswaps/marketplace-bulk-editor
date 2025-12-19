# Rule 9 Upgraded - Complete Selenium Testing Requirements

**Date**: 2025-12-19  
**Version**: 3.2 (upgraded from 3.1)  
**Trigger**: User request for correct, verified screenshots in README

---

## User Request

> "upgrade @.augment/rules/mandatory-rules.md section on selenium so that the user gets correct, verified screenshots and no headless mode unless explicitly requested."

---

## What Was Upgraded

### Rule 9: End-to-End Workflow Proof & Selenium Testing (CRITICAL)

**Expanded from 36 lines to 161 lines** with comprehensive requirements.

---

## New Requirements Added

### 1. Screenshot Requirements (MANDATORY)

**All screenshots MUST:**
1. ✅ Be taken at EACH major step (not just initial page load)
2. ✅ Be saved with descriptive filenames (`screenshot_01_frontend_loaded.png`)
3. ✅ Be verified with OCR (Tesseract) to confirm text is visible
4. ✅ Be embedded in README.md with:
   - Image markdown: `![Description](./screenshot_name.png)`
   - Caption describing what the screenshot shows
   - OCR verification note
5. ✅ Show actual UI state (not blank pages or loading screens)
6. ✅ Include console logs (Chrome DevTools Protocol)
7. ✅ Be taken in VISIBLE mode (user can see browser window)

### 2. Complete Workflow Testing (Rule 22 Integration)

**Backend/database features (11 minimum steps)**:
1. Setup: `./docker-start.sh` + container status
2. User registration: API call + JWT tokens
3. Login: API call + response
4. Create listing: API call + database verification
5. Templates: Creation + usage
6. OCR: File upload + processing + results
7. Export: Export + file content verification
8. Rate limiting: 429 error after exceeding limits
9. Database: `psql` queries proving persistence
10. Redis: `redis-cli` commands proving caching
11. Cleanup: `./docker-stop.sh` + data preservation

**UI features (10 minimum steps)**:
1. Initial load
2. Backend status (collapsed + expanded)
3. File upload area
4. Data table with data
5. Cell editing (before/after)
6. Export preview modal
7. Dark mode toggle
8. Search/filter
9. Bulk actions
10. Undo/redo

**Minimum screenshots required**:
- Backend/database features: 13+ screenshots
- UI features: 10+ screenshots

### 3. Console Log Capture (MANDATORY)

**Code example provided**:
```python
from selenium.webdriver.chrome.options import Options

options = Options()
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
# DO NOT add --headless unless user explicitly requests it

driver = webdriver.Chrome(options=options)
driver.get("http://localhost:5173")

# Capture console logs
for entry in driver.get_log('browser'):
    print(f"[{entry['level']}] {entry['message']}")
```

**Report requirements**:
- Total console entries
- Number of errors (should be 0 for successful tests)
- Number of warnings
- Sample of info/debug messages

### 4. OCR Verification (MANDATORY)

**Code example provided**:
```python
import pytesseract
from PIL import Image

img = Image.open('screenshot_01_frontend_loaded.png')
text = pytesseract.image_to_string(img)

# Verify expected text appears
assert "Docker Backend Connected" in text
assert "Marketplace Bulk Editor" in text
```

**Report requirements**:
- Screenshot filename
- File size
- OCR extracted text (key phrases)
- Verification status (✅ or ❌)

### 5. Documentation Requirements (MANDATORY)

**After Selenium testing, the assistant MUST:**

1. **Embed screenshots in README.md** with:
   - Section titled "📸 Screenshots (Selenium Testing - VISIBLE Mode)"
   - Each screenshot with descriptive caption
   - OCR verification note
   - Console logs status (0 errors)
   - Test date

2. **Create evidence document** (e.g., COMPLETE_WORKFLOW_EVIDENCE.md) with:
   - Executive summary of all tested features
   - Step-by-step workflow with terminal output
   - API request/response examples
   - Database query results
   - Screenshot references with OCR results
   - Compliance checklist

3. **Update backend/README.md** (if applicable) with:
   - Complete API workflow examples
   - Database verification examples
   - Redis verification examples
   - Rate limiting demonstration

### 6. Failure to Comply

**If the assistant:**
- Uses headless mode without explicit user request
- Takes only 1-2 screenshots instead of complete workflow
- Does not verify screenshots with OCR
- Does not embed screenshots in README.md
- Does not capture console logs
- Does not test complete workflow

**Then the user MUST stop the assistant and request compliance with Rule 9.**

---

## Impact

### Before Upgrade
- ❌ No specific screenshot requirements
- ❌ No OCR verification requirement
- ❌ No requirement to embed screenshots in README
- ❌ No console log capture requirement
- ❌ No complete workflow testing checklist
- ❌ No documentation requirements

### After Upgrade
- ✅ Detailed screenshot requirements (7 criteria)
- ✅ OCR verification with code example
- ✅ README.md embedding requirement
- ✅ Console log capture with code example
- ✅ Complete workflow testing (11 backend steps, 10 UI steps)
- ✅ Documentation requirements (3 documents)
- ✅ Failure to comply consequences

---

## Files Modified

1. **`.augment/rules/mandatory-rules.md`**
   - Rule 9 expanded from 36 lines to 161 lines
   - Added 6 new subsections
   - Updated version to 3.2
   - Updated description
   - Total: 344 lines (was 217 lines)

2. **`.augment/rules/RULE_9_UPGRADED.md`** (this file)
   - Documents the upgrade
   - Shows before/after comparison
   - Lists all new requirements

---

**Upgrade Complete** ✅

