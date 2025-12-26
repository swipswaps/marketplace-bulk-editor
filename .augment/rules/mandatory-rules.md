---
type: "always_apply"
description: "Mandatory rules for all AI assistant interactions - workflow patterns, evidence requirements, and critical constraints"
---

# Mandatory Rules (Condensed)

**Version**: 4.0

## Rule 0: Mandatory Workflow Pattern (META-RULE)

**PER STEP pattern required:**
1. State which rules apply to THIS step
2. Execute THIS step
3. Show evidence (full terminal output)
4. Verify compliance

**Forbidden:** Bulk execution, no evidence, claims without OCR

---

## Rule 2: Evidence-Before-Assertion

**No claims without proof:**
- Full terminal output
- OCR verification
- Screenshots displayed to user (`code /tmp/screenshot.png`)

**Forbidden:** "I can see", "appears to work" without evidence

---

## Rule 5: Ask Don't Guess

**If ambiguous → STOP and ask**

Format:
```
CLARIFICATION NEEDED:
- Situation: [what's unclear]
- Options: [possible choices]
- Question: [what you need to know]
```

---

## Rule 26: Use Existing Browser Window

**When user says "page is open in firefox":**

**WORKING COMMAND to list ALL Firefox windows with FULL titles (use this EXACT command):**
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  echo "$wid: $title"
done
```

**Why this command works:**
- `xdotool getwindowname` returns truncated titles (just "Firefox")
- `xprop -id $wid _NET_WM_NAME` returns FULL window title (e.g., "marketplace-bulk-editor — Mozilla Firefox Private Browsing")
- This is the ONLY way to reliably identify which Firefox window has the app

**Example output:**
```
60817409: Firefox
61082223: VSCode Terminal Cursor Issues — Mozilla Firefox
61083791: marketplace-bulk-editor — Mozilla Firefox Private Browsing
```

**Workflow:**
1. List ALL Firefox windows using command above
2. Find correct window by title (contains "marketplace" or "localhost:5174" or "localhost:5173")
3. Extract the window ID from the line with matching title
4. Activate THAT window by ID: `DISPLAY=:0 xdotool windowactivate --sync <WINDOW_ID> && DISPLAY=:0 xdotool windowraise <WINDOW_ID>`
5. Wait: `sleep 2`
6. Take screenshot: `DISPLAY=:0 import -window root /tmp/screenshot.png`
7. Run OCR: `tesseract /tmp/screenshot.png /tmp/ocr_output && cat /tmp/ocr_output.txt`
8. Display screenshot: `code /tmp/screenshot.png`
9. Verify with OCR that Firefox is visible (not VSCode)

**Alternative: Find window ID directly with grep:**
```bash
DISPLAY=:0 xdotool search --class "firefox" 2>/dev/null | while read wid; do
  title=$(DISPLAY=:0 xprop -id $wid _NET_WM_NAME 2>/dev/null | cut -d'"' -f2)
  if echo "$title" | grep -qi "marketplace"; then
    echo "$wid: $title"
  fi
done
```

**Why `--class "firefox"` not `--name "Firefox"`:**
- `--class` searches window CLASS (reliable, always "firefox")
- `--name` searches window TITLE (unreliable, changes based on page)

**Forbidden:**
- Using `xdotool getwindowname` (returns truncated titles)
- Creating new Selenium instances
- Activating wrong window
- Using `--name` instead of `--class`

---

## Rule 27: Screenshot Claims Require OCR

**NEVER say "I can see" without:**
1. Running OCR with PIL preprocessing (see below)
2. Showing FULL OCR output
3. Displaying screenshot to user
4. Basing claims ONLY on OCR text

**Required OCR Method (PIL + 2x scaling):**
```python
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

img = Image.open('/tmp/screenshot.png')

# 1. Scale up 2x FIRST (critical for accuracy)
width, height = img.size
img = img.resize((width * 2, height * 2), Image.LANCZOS)

# 2. Convert to grayscale
img = img.convert('L')

# 3. Sharpen
enhancer = ImageEnhance.Sharpness(img)
img = enhancer.enhance(2.0)

# 4. Enhance contrast
enhancer = ImageEnhance.Contrast(img)
img = enhancer.enhance(2.0)

# 5. Reduce noise
img = img.filter(ImageFilter.MedianFilter(size=3))

# 6. Sharpen again
enhancer = ImageEnhance.Sharpness(img)
img = enhancer.enhance(3.0)

# 7. Run OCR with config
text = pytesseract.image_to_string(img, config='--oem 3 --psm 3')
print(text)
```

**Why 2x scaling matters:** Without scaling, OCR truncates text (e.g., "Jump to Debug L" instead of "Jump to Debug Logs")

**Forbidden phrases without OCR:**
- "I can see..."
- "The screenshot shows..."
- "The fix appears to be working..."

---

## Rule 28: Application Parameters Database

**BEFORE any action involving ports/URLs/credentials:**

1. Read `.augment/APP_PARAMETERS_DATABASE.md`
2. Quote relevant section
3. Use ONLY documented parameters

**Trigger phrases:**
- `@APP_PARAMETERS_DATABASE.md`
- "Use deterministic parameters"

**Forbidden:** Guessing port numbers, assuming credentials

---

## Rule 29: Terminal Output Capture & Session Management (CRITICAL)

**Problem:** After 50+ terminal sessions, `launch-process` experiences resource exhaustion:
- Output capture fails (empty output from valid commands)
- Commands execute but return no text
- Buffer allocation issues

**Solution 1: ALWAYS use heredoc format for reliable output capture:**

```bash
# ✅ CORRECT - Heredoc format (works even at high session counts)
bash << 'BASH_EOF'
echo "line 1"
echo "line 2"
python3 script.py
BASH_EOF

# For Node.js:
node << 'NODEJS_EOF'
const XLSX = require('xlsx');
console.log("output");
NODEJS_EOF

# ❌ WRONG - Inline commands (fail after 50+ sessions)
echo "test"
python3 -c "print('test')"
cmd1 && cmd2
```

**Solution 2: Monitor session count:**

```bash
# Check current session count with list-processes tool
# If count > 40: Warn user that session restart may be needed soon
# If count > 50: Recommend starting new conversation
```

**Why heredoc works:**
- Creates explicit subshell with proper stdout capture
- Avoids terminal buffer allocation issues
- Works regardless of session count

**Session management guidance:**
| Sessions | Status | Action |
|----------|--------|--------|
| 0-30 | ✅ Normal | Continue normally |
| 30-50 | ⚠️ Warning | Use heredoc, monitor for issues |
| 50+ | 🔴 Critical | Recommend new conversation if output fails |

**Required pattern for ALL commands:**
```bash
bash << 'SCRIPT_EOF'
# Your commands here
command1
command2
SCRIPT_EOF
```

---

## Rule 30: Project Dependencies (xlsx, d3, etc.)

**This project already has these dependencies installed:**

```json
// package.json dependencies (already installed)
{
  "xlsx": "^0.18.5",        // Excel file reading/writing
  "tesseract.js": "^5.1.1", // Browser-based OCR
  "lucide-react": "^0.468.0" // Icons
}
```

**Use xlsx (NOT pandas) for reading Excel files:**

```javascript
// ✅ CORRECT - Use project's xlsx dependency
const XLSX = require('xlsx');
const wb = XLSX.readFile('/path/to/file.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

// ❌ WRONG - pandas is NOT installed in this environment
import pandas as pd  // ModuleNotFoundError
```

**Available in Node.js environment:**
- xlsx - Excel reading/writing
- All npm packages in node_modules/

**NOT available:**
- pandas (Python, not installed)
- openpyxl (Python, not installed)

---

---

## Rule 31: Action-First, Ask-Later (ANTI-QUESTION RULE)

**Evidence:** User said "reword requests" 2+ times in session (2025-12-26)

**Do NOT end responses with:**
- "Would you like me to..."
- "What would you like me to do next?"
- "Should I proceed with..."
- Multiple choice questions

**Proceed to next logical step unless blocked by:**
- Destructive action requiring permission (delete, push, deploy)
- True ambiguity with competing interpretations
- Missing critical information

---

## Rule 32: Prefer Project Scripts Over Generic Commands

**Evidence:** User corrected: "do not @rules show that ./start.sh should be running" after port conflicts

**BEFORE using generic commands:**
```bash
# 1. Check for project scripts
ls *.sh

# 2. If start.sh/stop.sh exist, use them
./start.sh  # NOT npm run dev
./stop.sh   # NOT pkill node
```

**Why:** Project scripts handle port cleanup, PID tracking, stray processes

---

## Rule 33: Concise Response Format

**Evidence:** Verbose explanations wasted user time scanning for results (2025-12-26)

**Required format:**
```
### Step N: [action]
**Rules:** [numbers, e.g., 2, 26, 27]
**Command:** [code block]
**Evidence:** [1-2 line summary + raw output]
**Status:** ✅ or ❌
```

**Forbidden:**
- Long explanations before actions
- Repeating what was just done
- "I will now..." preambles

---

## Other Critical Rules

**Rule 4: Scope Containment** - Fix only what's requested, don't expand scope

**Rule 18: Feature Removal Prohibition** - Never remove features without permission

**Rule 24: Test Before Push** - Never push broken code

**Rule 25: Display Debug in UI** - Add debug logs to UI, not just console

---

## Enforcement

**If assistant violates any rule:**
1. User MUST stop immediately
2. Cite rule number
3. Require restart with proper pattern

---

**Full rules**: See `RULES_AUDIT_2025-12-26.json` for evidence-backed audit

