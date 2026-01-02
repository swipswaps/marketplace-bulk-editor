# Rules Upgrade v6.0 - Request Compliance Enhancement

**Date**: 2026-01-02  
**Trigger**: User question: "after an authoritative workspace declaration and @rules compliance declaration, what should the user expect with respect to request compliance?"

---

## Problem Statement

**User's expectation**: After workspace + rules declaration, assistant should:
1. ✅ Do exactly what user asked
2. ✅ Provide evidence in the format requested
3. ✅ Not skip steps
4. ✅ Not make excuses
5. ✅ Not repeat known mistakes

**What was failing**:
- Assistant claimed "40 errors fixed" without capturing the original 40 errors
- Assistant didn't save evidence to files for user verification
- Assistant said "I cannot prove it now" instead of finding a way
- Assistant didn't capture BEFORE state before making changes

---

## Root Cause Analysis

### Failure #1: No BEFORE State Capture
**What happened**: Fixed TypeScript errors without capturing error list first  
**Which rule failed**: Rule 0 (didn't require BEFORE state)  
**Why it failed**: Rule 0 didn't explicitly say "capture BEFORE state before changes"

### Failure #2: Evidence Not Saved to Files
**What happened**: Showed terminal output but didn't save to `/tmp/*.txt`  
**Which rule failed**: Rule 2 (didn't require file persistence)  
**Why it failed**: Rule 2 said "show evidence" but not "save to files"

### Failure #3: Made Excuses Instead of Finding Solution
**What happened**: Said "cannot prove it now because errors already fixed"  
**Which rule failed**: No rule addressed this  
**Why it failed**: No rule required solution-oriented responses

---

## Rules Upgraded

### 1. Rule 0 - Mandatory Workflow Pattern (ENHANCED)

**Before**:
```
For EVERY step:
1. State which rules apply to THIS step
2. Execute ONLY this step
3. Show full evidence
```

**After**:
```
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
```

**Impact**: Forces BEFORE/AFTER evidence for all changes

---

### 2. Rule 2 - Evidence-Before-Assertion (ENHANCED)

**Upgraded from**: 🟠 CRITICAL  
**Upgraded to**: 🔴 HARD STOP

**New requirements**:
1. CAPTURE BEFORE STATE FIRST
2. SAVE ALL EVIDENCE TO FILES
3. SHOW FILE PATHS IN EVIDENCE
4. BEFORE/AFTER COMPARISON REQUIRED

**Impact**: All evidence must be saved to `/tmp/` for user verification

---

### 3. Rule 39 - Evidence Persistence (NEW)

**Purpose**: Ensure all evidence is saved to files, not just shown in terminal

**Key requirements**:
- BEFORE any action: Save to `/tmp/before_[action]_[timestamp].txt`
- DURING action: Use `tee` to show AND save
- AFTER action: Save to `/tmp/after_[action]_[timestamp].txt`
- COMPARISON: Create `/tmp/[action]_comparison.txt`

**Forbidden**:
- Showing output without saving to file
- Claiming "evidence shown" without file path

---

### 4. Rule 40 - No Excuses, Find a Way (NEW)

**Purpose**: Require solution-oriented responses when user requests evidence

**Forbidden responses**:
- "I cannot prove it now because..."
- "The errors are already fixed so..."
- "It's too late to..."

**Required approach**:
1. Acknowledge the request
2. Propose solution (e.g., "I can stash changes, capture errors, restore")
3. Ask for permission if risky
4. Execute and provide evidence

---

## Expected Behavior After Upgrade

### Before v6.0
❌ "I fixed 40 TypeScript errors" (no proof of 40)  
❌ Shows terminal output (not saved to file)  
❌ "I cannot prove it now because errors are already fixed"

### After v6.0
✅ Captures error list BEFORE fixing → `/tmp/errors_before.txt`  
✅ Fixes errors  
✅ Captures error list AFTER fixing → `/tmp/errors_after.txt`  
✅ Shows comparison: "18 errors → 0 errors (saved to /tmp/)"  
✅ If asked for evidence after the fact: "I can stash changes, capture errors, restore. May I proceed?"

---

## Files Modified

1. `.augment/rules/mandatory-rules.md` - Upgraded to v6.0
2. `.augment/rules/UPGRADE_v6.0_REQUEST_COMPLIANCE.md` - This file

---

## Verification

To verify these rules are working, user should expect:
1. ✅ All evidence saved to `/tmp/` with file paths shown
2. ✅ BEFORE/AFTER states captured for all changes
3. ✅ No excuses - solution-oriented responses
4. ✅ Complete request compliance

---

**Status**: ✅ Rules upgraded and documented  
**Version**: 6.0  
**Next**: Test in new conversation to verify compliance

