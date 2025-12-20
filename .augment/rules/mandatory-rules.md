---
type: "always_apply"
description: "Mandatory rules for all AI assistant interactions - workspace verification, evidence requirements, Selenium testing (VISIBLE mode, OCR verification, screenshots in README), complete workflow testing, Docker deployment, ORM safety, feature preservation, use existing browser windows"
version: "3.3"
---

1. Workspace Authority (HARD STOP)

Before any code, test, build, or deployment discussion, the assistant must declare:

Repository name

Absolute or repo-relative root path

All actions apply only to that workspace.
If unclear → stop and ask.

2. Evidence Before Assertion (HARD STOP)

The assistant may not claim success of builds, tests, deployments, UI behavior, or APIs without raw evidence.

Valid evidence:

Full terminal output

curl / grep output

Browser console logs

Selenium logs

Screenshots (when relevant)

Required format:

Evidence:
<raw output>

Conclusion:
<derived only from evidence>

3. Execution Boundary (CRITICAL)

The assistant must never imply it executed actions.

Forbidden: “I ran”, “I deployed”, “I tested”, “I verified”.

Allowed:

“The output shows…”

“Based on the provided logs…”

4. Stop-the-Line Conditions (HARD STOP)

Immediately stop if any occur:

Conflicting tool outputs

Workspace ambiguity

Unverified deployment or test claims

Explicit user correction

Active user constraints violated

Only clarification is allowed until resolved.

5. Ask, Don’t Guess (HARD STOP)

If intent, path, tooling, or solution choice is ambiguous:

Do not proceed

Do not assume

Required format:

CLARIFICATION NEEDED:
- Situation:
- Options:
- Question:

6. Scope Containment

“Fix everything related” means:

Fix all instances of the current defect class

Do not add features, refactor, or expand scope unless asked

If a related issue is found, ask before acting.

7. Observation Layer Integrity

All statements must be tagged as:

Filesystem

Build-time

Runtime (browser/API)

Deployment (remote)

Cross-layer conclusions without evidence are prohibited.

8. Feature Preservation (CRITICAL)

If the user says “do not remove features”:

Required workflow:

Enumerate existing features

Make changes

Verify each feature still works

Provide evidence per feature

No silent removals. No assumptions.

9. End-to-End Workflow Proof & Selenium Testing (CRITICAL)

Loading a page ≠ proof.

When testing or documenting functionality, the assistant must demonstrate the complete user workflow, including:

Setup

Usage

Data persistence

Integration points

Failure paths (where applicable)

### Selenium Testing Requirements (MANDATORY)

**CRITICAL: Selenium tests MUST run in VISIBLE mode (NOT headless) unless explicitly specified otherwise by the user.**

Forbidden:
- `options.add_argument('--headless')`
- `options.headless = True`
- Any headless configuration

Allowed only if user explicitly requests:
- "run selenium in headless mode"
- "use headless browser"

Rationale: Visible mode allows user to see what's happening, verify behavior visually, and debug issues. Headless mode hides problems and prevents user observation.

### Screenshot Requirements (MANDATORY)

**All screenshots MUST:**
1. **Be taken at EACH major step** of the workflow (not just initial page load)
2. **Be saved with descriptive filenames** (e.g., `screenshot_01_frontend_loaded.png`, `screenshot_02_backend_status.png`)
3. **Be verified with OCR** (Tesseract or similar) to confirm text is visible
4. **Be embedded in documentation** (README.md, evidence documents) with:
   - Image markdown: `![Description](./screenshot_name.png)`
   - Caption describing what the screenshot shows
   - OCR verification note if applicable
5. **Show actual UI state** (not blank pages, loading screens, or error states unless testing errors)
6. **Include console logs** captured via Chrome DevTools Protocol
7. **Be taken in VISIBLE mode** (user can see browser window during test)

### Complete Workflow Testing (Rule 22)

**The assistant MUST test the COMPLETE workflow, not just initial page load.**

**For backend/database features, minimum steps:**
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

**For UI features, minimum steps:**
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

**Minimum screenshots required:**
- Backend/database features: 13+ screenshots
- UI features: 10+ screenshots

### Console Log Capture (MANDATORY)

**All Selenium tests MUST capture console logs:**

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

**Report:**
- Total console entries
- Number of errors (should be 0 for successful tests)
- Number of warnings
- Sample of info/debug messages

### OCR Verification (MANDATORY)

**All screenshots MUST be verified with OCR:**

```python
import pytesseract
from PIL import Image

img = Image.open('screenshot_01_frontend_loaded.png')
text = pytesseract.image_to_string(img)

# Verify expected text appears
assert "Docker Backend Connected" in text
assert "Marketplace Bulk Editor" in text
```

**Report:**
- Screenshot filename
- File size
- OCR extracted text (key phrases)
- Verification status (✅ or ❌)

### Documentation Requirements (MANDATORY)

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

### Failure to Comply

**If the assistant:**
- Uses headless mode without explicit user request
- Takes only 1-2 screenshots instead of complete workflow
- Does not verify screenshots with OCR
- Does not embed screenshots in README.md
- Does not capture console logs
- Does not test complete workflow

**Then the user MUST stop the assistant and request compliance with Rule 9.**

10. User Constraints Override Everything

Explicit user constraints override:

Defaults

Prior behavior

“Best practices”

Constraints persist until revoked.

Required acknowledgment:

Active constraints:
1. …
2. …

Known Critical Failure Classes (Do Not Regress)

These are non-negotiable checks when applicable:

ORM Safety

Never use reserved names (metadata, query, session, registry)

Test DB initialization immediately

Docker Configuration

All required env vars must be passed (DB, cache, rate limits, secrets)

Verify connectivity before claiming success

Python Versions

Use stable Python (3.11 / 3.12) in Docker

Do not use bleeding-edge images

Database Alignment

Do not change database type without user approval

Preserve SQL export paths if present

Tone After Errors

After corrections or failures:

Neutral

Technical

Factual

No celebratory language.

## Rule 23: Use Existing Browser Windows (CRITICAL)

When the user says:
- "use xdotool to find the open firefox window"
- "test the button in the open firefox window"
- "press save in the open firefox window"
- "the error persists" (implies they already tested)

**The assistant MUST:**
1. **NOT create a new browser instance**
2. **NOT write a new test script**
3. **Use xdotool to interact with the EXISTING window**
4. **Assume the user has already done setup** (login, data upload, etc.)

**Forbidden Actions:**
- Creating new Selenium WebDriver instances
- Writing test scripts that start from scratch
- Ignoring "the open firefox window" instruction
- Assuming the user hasn't tested yet

**Required Actions:**
1. Use `xdotool search --name "Firefox"` to find window ID
2. Use `xdotool windowactivate <ID>` to focus the window
3. Use `xdotool` commands to interact with the existing window
4. OR ask the user what they see in the browser

**Why This Rule Exists:**
- User has already spent time setting up the browser state
- Creating new instances wastes user's time
- User explicitly requested using the existing window
- "The error persists" means user already tested and saw failure

---

## Rule 24: Display Debug Info in UI, Not Console (CRITICAL)

**When the user says:**
- "save it yourself in the debug area at the bottom of the page"
- "having the user (me) get it increases chance of error"
- "why not display it in the UI?"

**The assistant MUST:**
1. **Add debug state to the relevant Context** (e.g., DataContext, AuthContext)
2. **Create or use existing debug panel component** in the UI
3. **Display all debug information automatically** without requiring user to open browser console
4. **Show timestamps, log levels (info/warn/error/success), and data**

**Forbidden Actions:**
- Only logging to console.log without UI display
- Requiring user to manually copy/paste console output
- Creating debug logs that aren't visible in the UI
- Ignoring existing debug panels

**Why This Rule Exists:**
- User shouldn't have to open browser console (F12)
- Manual copy/paste increases chance of error
- Debug info should be automatically captured and displayed
- Following this instruction made short work of the "Failed to save to database" issue

**Example Implementation:**
```typescript
// Context
const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
const addDebugLog = (level, message, data) => {
  setDebugLogs(prev => [...prev, { timestamp: new Date().toISOString(), level, message, data }]);
  console.log(`${emoji} [${message}]`, data); // Also log to console
};

// UI Component
{debugLogs.map((log, idx) => (
  <div key={idx} className={getColorClass(log.level)}>
    [{new Date(log.timestamp).toLocaleTimeString()}] {getEmoji(log.level)} {log.message}
    {log.data && <pre>{JSON.stringify(log.data, null, 2)}</pre>}
  </div>
))}
```

**Real-World Success:**
- User reported "Failed to save to database" error
- Assistant added debug logging to DataContext
- Debug panel showed: "⚠️ Skipping invalid listing 1" with data showing undefined values
- Root cause identified immediately: empty row with undefined title/price/condition
- Issue resolved by filtering invalid listings before sending to backend

**Example Violation:**
```python
# WRONG - Creates new browser
driver = webdriver.Firefox(options=options)
driver.get("http://localhost:5173")
```

**Correct Approach:**
```bash
# RIGHT - Use existing window
xdotool search --name "Firefox" windowactivate
# Then ask user what they see or use xdotool to click
```

**If the assistant violates this rule:**
- User will have to repeat the instruction
- User's time is wasted
- User's frustration increases
- Assistant demonstrates it's not listening