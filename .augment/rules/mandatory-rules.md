---
type: "always_apply"
description: "Mandatory rules for all AI assistant interactions - workflow patterns, evidence requirements, and critical constraints"
---

# Mandatory Rules for AI Assistant Interactions

Version: 5.2 (Enforced)
Status: Authoritative
Scope: Overrides all default assistant behavior

============================================================
RULE CLASSES (READ FIRST)
============================================================

🔴 HARD STOP — Immediate halt required if violated  
🟠 CRITICAL — High-risk; strict evidence required  
🟡 MAJOR — Strong constraint; deviation requires justification  
🔵 FORMAT — Output structure enforcement  

============================================================
🔒 RULE ACTIVATION GATE (NON-NEGOTIABLE)
============================================================

The assistant MUST NOT perform any task, reasoning, planning, or suggestion until ALL items below are completed verbatim:

1. Restate Rule 0 in one sentence.
2. List ALL rules that apply to the FIRST step.
3. Explicitly state: “I will not proceed until this gate is satisfied.”
4. If workspace info is missing, STOP and ask under Rule 1.

Failure to complete this gate = HARD VIOLATION.

============================================================
RULE 0 — Mandatory Workflow Pattern (META-RULE) 🔴
============================================================

For EVERY step:

1. State which rules apply to THIS step
2. IF step involves changes/fixes:
   a. Capture BEFORE state (save to /tmp/before_*.txt)
   b. Execute ONLY this step
   c. Capture AFTER state (save to /tmp/after_*.txt)
   d. Show before/after comparison
3. IF step is read-only:
   a. Execute step
   b. Save output to /tmp/[step_name].txt
4. Show full evidence (terminal output / OCR / logs) + file paths
5. Verify compliance explicitly
6. Auto-proceed if and only if Rule 31 conditions are satisfied

Forbidden:
- Bulk execution
- Claims without evidence
- Making changes without capturing BEFORE state
- Ending with “what next?” when next step is obvious

============================================================
RULE 1 — Workspace Authority 🔴
============================================================

Before ANY code, test, or build discussion, declare:

- Repository name
- Absolute or repo-relative root path
- Scope of actions limited strictly to this workspace

If unclear → STOP and ask.

============================================================
RULE 2 — Evidence-Before-Assertion 🟠
============================================================

No factual or success claim without proof.

Allowed evidence:
- Full terminal output (untruncated)
- OCR-verified screenshots
- Logs pasted verbatim

Forbidden:
- “Appears to work”
- “I can see”
- “This should fix it”

============================================================
RULE 3 — Execution Boundary 🟠
============================================================

The assistant MUST NEVER imply it executed actions.

Forbidden:
- “I ran”
- “I tested”
- “I verified”

Allowed:
- “The provided output shows…”
- “Based on the logs above…”

============================================================
RULE 4 — Stop-the-Line Conditions 🔴
============================================================

Immediately STOP if any occur:
- Conflicting outputs
- Workspace ambiguity
- Unverified execution claims
- User correction
- Constraint violation

Only clarification is allowed until resolved.

============================================================
RULE 5 — Ask Don’t Guess 🟠
============================================================

Ask ONLY when:
- Destructive action
- True ambiguity
- Missing critical info

Required format:

CLARIFICATION NEEDED:
- Situation:
- Options:
- Question:

============================================================
RULE 6 — Scope Containment 🟡
============================================================

Fix only the defect class requested.
No feature additions or refactors without approval.

============================================================
RULE 7 — Observation Layer Integrity 🟠
============================================================

All statements MUST be tagged as:
- Filesystem
- Build-time
- Runtime
- Deployment

No cross-layer inference without evidence.

============================================================
RULE 8 — Feature Preservation 🟠
============================================================

If user says “do not remove features”:

1. Enumerate all existing features
2. Modify
3. Verify each feature
4. Provide evidence per feature

============================================================
RULE 9 — End-to-End Workflow Proof 🟠
============================================================

Page load ≠ success.

Full workflow must be tested:
- Setup
- Usage
- Persistence
- Integration
- Failure paths

============================================================
RULE 10 — User Constraints Override Everything 🔴
============================================================

Explicit constraints override all defaults and best practices.
Constraints persist until revoked.

============================================================
RULE 11 — ORM Safety 🟠
============================================================

Reserved names forbidden.
DB initialization must be tested immediately.

============================================================
RULE 12 — Docker Configuration 🟠
============================================================

All env vars required.
Connectivity must be verified.

============================================================
RULE 13 — Python Version Compatibility 🟡
============================================================

Use Python 3.11 or 3.12 only.

============================================================
RULE 14 — Database Alignment 🟡
============================================================

DB type may not change without approval.
Preserve export paths.

============================================================
RULE 15 — Tone After Errors 🔵
============================================================

Neutral. Technical. Factual. No celebration.

============================================================
RULE 16 — Workflow Context Preservation 🟠
============================================================

Understand and preserve the COMPLETE user workflow.
No isolated assumptions.

============================================================
RULE 17 — Data Format Compatibility 🟠
============================================================

External formats must remain compatible.
Never rename columns silently.

============================================================
RULE 18 — Feature Removal Prohibition 🔴
============================================================

No feature removal without explicit permission.

============================================================
RULE 19 — OCR Data Handling 🟡
============================================================

Never auto-delete OCR noise.
Provide cleanup tools only.

============================================================
RULE 20 — UI State Preservation 🟡
============================================================

Persist preferences.
Handle corruption gracefully.

============================================================
RULE 21 — Task Completion Evidence 🟠
============================================================

When complete, provide:
1. Request summary
2. Actions taken
3. Full evidence
4. Requirement-to-evidence mapping

============================================================
RULE 22 — Complete Workflow Testing 🔴
============================================================

Backend and UI workflows must be proven with screenshots, logs, and data checks.

============================================================
RULE 23 — Use Existing Browser Window (Deprecated)
============================================================

See Rule 26.

============================================================
RULE 24 — Test Before Push 🔴
============================================================

Never push broken code.
All tests must pass with evidence.

============================================================
RULE 25 — Debug in UI, Not Console 🟠
============================================================

Debug output must be visible in UI.

============================================================
RULE 26 — Use Existing Browser Window 🟠
============================================================

Use xdotool + xprop command exactly as specified.
No new browser instances if existing window exists.

============================================================
RULE 27 — Screenshot Claims Require OCR (CRITICAL) 🔴
============================================================

**NEVER make claims about what a screenshot shows without:**

1. ✅ **SCROLL to target elements** - Use `scrollIntoView()` to ensure elements are visible
2. ✅ **VERIFY elements are displayed** - Check `is_displayed()` returns True
3. ✅ **Take screenshot AFTER scrolling** - Don't screenshot before elements are visible
4. ✅ **Run OCR on the screenshot** - Use Tesseract or PaddleOCR
5. ✅ **Show FULL OCR output** - Don't summarize, show complete text
6. ✅ **Display screenshot to user** - Use `code /tmp/screenshot.png` in VSCode
7. ✅ **Base claims ONLY on OCR text** - Not on assumptions or guesses

**Forbidden phrases without OCR evidence:**
- ❌ "I can see..."
- ❌ "The screenshot shows..."
- ❌ "Looking at the screenshot..."
- ❌ "The fix appears to be working..."
- ❌ "The problem is fixed..."
- ❌ "The buttons are visible..." (without OCR proof)

**Required pattern for Selenium + OCR:**
```python
# 1. Find target element by data-testid or aria-label
target = driver.find_element(By.CSS_SELECTOR, "[data-testid='target-element']")

# 2. SCROLL to make element visible
driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", target)
time.sleep(1)

# 3. VERIFY element is displayed
assert target.is_displayed(), "Element not visible after scrolling!"

# 4. Take screenshot
driver.save_screenshot("/tmp/screenshot.png")

# 5. Run OCR
import pytesseract
from PIL import Image
img = Image.open('/tmp/screenshot.png')
text = pytesseract.image_to_string(img)
print("=== FULL OCR OUTPUT ===")
print(text)

# 6. Display screenshot to user
# (In VSCode: code /tmp/screenshot.png)

# 7. Make claims based ONLY on OCR output
if "Expected Text" in text:
    print("✅ Found 'Expected Text' in OCR output")
else:
    print("❌ 'Expected Text' NOT found in OCR output")
```

**Why this rule exists:**
- Prevents claiming buttons are visible when they're below the fold
- Prevents running OCR on screenshots that don't show target elements
- Prevents false negatives (element exists but not in screenshot)
- Ensures reproducible verification

============================================================
RULE 28 — Application Parameters Database 🟠
============================================================

Read and quote parameters before use.
No guessing.

============================================================
RULE 29 — Terminal Output Capture 🟠
============================================================

Use heredoc format exclusively.
Monitor session count.

============================================================
RULE 30 — Project Dependencies 🟡
============================================================

Use installed dependencies only.
No environment assumptions.

============================================================
RULE 31 — Proceed With Obvious Next Steps 🟡
============================================================

Auto-proceed ONLY if:
- Non-destructive
- No ambiguity
- No rule conflict
- Evidence can be produced immediately

Otherwise, ask under Rule 5.

============================================================
RULE 32 — Prefer Project Scripts 🟡
============================================================

Use project scripts before generic commands.

============================================================
RULE 33 — Concise Response Format 🔵
============================================================

Each step MUST follow:

### Step N
Rules:
Command:
Evidence:
Status:

============================================================
RULE 34 — Debugging Uses Tools First 🔴
============================================================

Lint → Clear cache → Verify → Manual review (only last).

============================================================
RULE 35 — Browser Priority for Selenium 🟠
============================================================

Firefox → Chromium → Chrome, with explicit evidence.

============================================================
RULE 36 — Full Error Console Messages 🔴
============================================================

No truncated errors. Full stack traces required.

============================================================
RULE 37 — No Partial Compliance 🔴
============================================================

Partial compliance = non-compliance.
If full compliance is impossible → STOP and explain.

============================================================
RULE 38 — Violation Memory 🔴
============================================================

Any violation MUST be:
- Logged
- Cited by rule number
- Referenced before next step

============================================================
FINAL STEP — Compliance Self-Audit 🔴
============================================================

Every response MUST end with:

COMPLIANCE AUDIT:
- Rules applied:
- Evidence provided: YES/NO
- Violations: YES/NO
- Safe to proceed: YES/NO