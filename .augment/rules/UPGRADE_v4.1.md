# Rules Upgrade v4.0 → v4.1

**Date**: 2025-12-26  
**Evidence Source**: RULES_AUDIT_2025-12-26.json  
**Trigger**: User repeatedly saying "proceed" and "reword requests"

---

## Changes Made

### 1. Rule 0 Upgraded - Auto-Proceed Added

**Before (v4.0):**
```
PER STEP pattern required:
1. State which rules apply to THIS step
2. Execute THIS step
3. Show evidence (full terminal output)
4. Verify compliance

Forbidden: Bulk execution, no evidence, claims without OCR
```

**After (v4.1):**
```
PER STEP pattern required:
1. State which rules apply to THIS step
2. Execute THIS step
3. Show evidence (full terminal output)
4. Verify compliance
5. Auto-proceed to next step (don't ask "what next?")

Forbidden: Bulk execution, no evidence, claims without OCR, ending with questions unless blocked
```

**Impact:** Assistant will continue to next logical step instead of asking "What would you like me to do next?"

---

### 2. Rule 5 Upgraded - Clarified When to Ask

**Before (v4.0):**
```
If ambiguous → STOP and ask

Format:
CLARIFICATION NEEDED:
- Situation: [what's unclear]
- Options: [possible choices]
- Question: [what you need to know]
```

**After (v4.1):**
```
Ask ONLY when:
- Destructive action requiring permission (delete, push, deploy)
- True ambiguity with competing interpretations
- Missing critical information

Do NOT ask:
- "What would you like me to do next?" (use Rule 31 - auto-proceed)
- "Should I continue?" (just continue)
- Multiple choice questions about obvious next steps

Format when asking IS required:
CLARIFICATION NEEDED:
- Situation: [what's unclear]
- Options: [possible choices]
- Question: [what you need to know]
```

**Impact:** Assistant will only ask when truly blocked, not for routine continuation.

---

## Rules Already Added (v4.0)

These rules were already present in mandatory-rules.md:

### Rule 31: Action-First, Ask-Later (ANTI-QUESTION RULE)
- **Lines**: 269-284
- **Status**: ✅ Already implemented
- **Evidence**: User said "reword requests" 2+ times

### Rule 32: Prefer Project Scripts Over Generic Commands
- **Lines**: 286-302
- **Status**: ✅ Already implemented
- **Evidence**: User corrected "do not @rules show that ./start.sh should be running"

### Rule 33: Concise Response Format
- **Lines**: 304-322
- **Status**: ✅ Already implemented
- **Evidence**: Verbose explanations wasted user time

---

## Verification

**Command:**
```bash
grep -n "^## Rule" .augment/rules/mandatory-rules.md | head -10
```

**Expected output:**
```
10:## Rule 0: Mandatory Workflow Pattern (META-RULE)
23:## Rule 2: Evidence-Before-Assertion
34:## Rule 5: Ask Don't Guess
57:## Rule 26: Use Existing Browser Window
114:## Rule 27: Screenshot Claims Require OCR
166:## Rule 28: Application Parameters Database
181:## Rule 29: Terminal Output Capture & Session Management (CRITICAL)
241:## Rule 30: Project Dependencies (xlsx, d3, etc.)
279:## Rule 31: Action-First, Ask-Later (ANTI-QUESTION RULE)
296:## Rule 32: Prefer Project Scripts Over Generic Commands
```

---

## Summary

✅ **Rule 0**: Added step 5 "Auto-proceed to next step"  
✅ **Rule 5**: Clarified when to ask vs auto-proceed  
✅ **Rule 31**: Already implemented (Action-First, Ask-Later)  
✅ **Rule 32**: Already implemented (Prefer Project Scripts)  
✅ **Rule 33**: Already implemented (Concise Response Format)  
✅ **Version**: Updated 4.0 → 4.1  

**Total changes:** 2 rule upgrades, 1 version bump, 3 rules verified as already implemented.

