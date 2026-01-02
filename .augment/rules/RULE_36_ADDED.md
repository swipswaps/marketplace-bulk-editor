# Rule 36 Added - Full Error Console Messages Required

**Date**: 2025-12-29  
**Version**: 5.1 (upgraded from 5.0)  
**Trigger**: User question: "do @rules include display full error console messages?"

---

## User Question That Triggered This Rule

> "do @rules include display full error console messages?"

**Answer**: NO - the rules did NOT explicitly require showing full error console messages.

---

## What Was Missing

### Existing Rules Mentioned Console/Terminal Output

**Rule 0 line 15:** "Show evidence (full terminal output)"  
**Rule 2 line 37:** "Full terminal output"  
**Rule 21 line 278:** "Terminal output for ALL claims"  
**Rule 24 line 336:** "Verify 0 critical errors in console logs"  
**Rule 25 line 344:** "Display Debug in UI, Not Console"  
**Rule 29 line 501:** "Terminal Output Capture & Session Management"

**But NONE specifically required:**
- ❌ Full browser console error messages
- ❌ Complete stack traces
- ❌ Error details (file, line, column)
- ❌ Console.error output to be captured and shown
- ❌ Network errors if relevant

### The Gap

**When user reported "settings icon fails - Something Went Wrong":**

**What assistant should have shown immediately:**
```
Error: Cannot access 'loadBackupInfo' before initialization
    at BackupManager.tsx:29:5
    at useState (react-dom.development.js:1234)
    at BackupManager (BackupManager.tsx:16)
    at SettingsModal (SettingsModal.tsx:273)
```

**What assistant actually did:**
- ❌ Did not show browser console error
- ❌ Did not show stack trace
- ❌ Did not show error details from ErrorBoundary
- ✅ Had to search codebase to find error
- ✅ Had to use ESLint to find root cause

**With full error message, diagnosis would have been instant.**

---

## What Was Added

### Rule 36: Full Error Console Messages Required (CRITICAL)

**Key requirements:**

### Browser Console Errors
1. ✅ Full error message (not "An error occurred")
2. ✅ Complete stack trace with file paths
3. ✅ Line and column numbers
4. ✅ Error type (TypeError, ReferenceError, etc.)
5. ✅ All console.error() output
6. ✅ All console.warn() output (if relevant)
7. ✅ Network errors (if relevant)

### Terminal/Build Errors
1. ✅ Full error message
2. ✅ Complete stack trace
3. ✅ File paths and line numbers
4. ✅ Error codes
5. ✅ All preceding context (what led to error)

### Forbidden Patterns
- ❌ "An error occurred" (without showing the error)
- ❌ "The build failed" (without showing why)
- ❌ "There's a console error" (without showing what it says)
- ❌ "I see an error in the logs" (without pasting the error)
- ❌ Truncating errors: "Error: Cannot read property... [truncated]"

### Required Pattern
```
### Error Detected

**Error Type:** [TypeError/ReferenceError/etc.]

**Full Error Message:**
```
[paste COMPLETE error message - no truncation]
```

**Stack Trace:**
```
[paste COMPLETE stack trace with file paths and line numbers]
```

**Context:**
- Action that triggered error: [what was being done]
- File: [full path]
- Line: [line number]
- Column: [column number]

**Console Output:**
```
[paste ALL console.error and console.warn output]
```
```

---

## Impact

### Before Rule 36
- ❌ Assistant didn't show full error messages
- ❌ User had to ask "what's the actual error?"
- ❌ Diagnosis took longer (search codebase, run linting)
- ❌ User wasted time waiting for error details

### After Rule 36
- ✅ Assistant MUST show full error messages immediately
- ✅ Assistant MUST show complete stack traces
- ✅ User can see root cause instantly
- ✅ Diagnosis is faster
- ✅ User doesn't have to ask for error details

---

## Files Modified

1. **`.augment/rules/mandatory-rules.md`**
   - Added Rule 36 (140 lines)
   - Updated version to 5.1
   - Updated rule count to 0-36
   - Total: 1003 lines (was 868 lines)

2. **`.augment/rules/RULE_36_ADDED.md`** (this file)
   - Documents the new rule
   - Explains user question
   - Shows what was missing
   - Shows what was added

---

## Verification

```bash
# Count total rules
$ grep -c "^## Rule" .augment/rules/mandatory-rules.md
37

# Verify Rule 36 exists
$ grep "^## Rule 36" .augment/rules/mandatory-rules.md
## Rule 36: Full Error Console Messages Required (CRITICAL)
```

---

## Summary

✅ **Rule 36 added** - Full error console messages requirement  
✅ **Version updated** - 5.0 → 5.1  
✅ **Rule count updated** - 0-35 → 0-36  
✅ **Documentation created** - This summary file  

**The assistant will now be required to show FULL error messages and stack traces immediately when ANY error occurs.**

---

**This rule prevents the exact situation that just happened: user reporting "settings icon fails" without seeing the actual error message.**

