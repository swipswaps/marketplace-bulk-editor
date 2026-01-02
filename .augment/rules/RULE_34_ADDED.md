# Rule 34 Added - Debugging Build/Syntax Errors: Use Tools First

**Date**: 2025-12-29
**Version**: 4.3 (upgraded from 4.2)
**Trigger**: User question: "why not lint?"

**Note**: Originally planned as Rule 30, but Rule 30 already exists (Project Dependencies). Using Rule 34 instead.

---

## User Question That Triggered This Rule

> "why not lint?"

**Context:**
- Assistant was manually examining DataTable.tsx code line by line
- Assistant tried to count braces manually
- Assistant looked at git diffs without testing
- Assistant wasted significant time on manual investigation
- User correctly pointed out: linting tools should be used FIRST

---

## What Was Wrong

### The Problem

**Assistant's approach:**
1. ❌ Manually examined code around line 546
2. ❌ Tried to count braces with Python script
3. ❌ Looked at git history without running tools
4. ❌ Examined function structure manually
5. ❌ Wasted time on manual investigation

**What assistant SHOULD have done:**
1. ✅ Run `npm run lint` immediately
2. ✅ Run `npx tsc --noEmit` to check TypeScript
3. ✅ Clear Vite cache (`rm -rf node_modules/.vite`)
4. ✅ Restart server (`./stop.sh && ./start.sh`)
5. ✅ Check logs (`tail -50 .vite.log`)

**Root cause discovered:**
- ✅ **Vite cache corruption** - not actual syntax error
- ✅ ESLint showed no errors in DataTable.tsx
- ✅ TypeScript showed no errors in DataTable.tsx
- ✅ Clearing cache fixed the problem immediately

---

## What Was Added to Rules

### Rule 34: Debugging Build/Syntax Errors - Use Tools First (CRITICAL)

**When encountering build errors, syntax errors, or compilation failures, the assistant MUST:**

**Phase 1: Run Linting Tools (FIRST)**
```bash
# Step 1: Run ESLint
npm run lint 2>&1 | tee lint_output.txt

# Step 2: Run TypeScript compiler
npx tsc --noEmit 2>&1 | tee tsc_output.txt

# Step 3: Show results
echo "=== ESLint Results ==="
cat lint_output.txt
echo "=== TypeScript Results ==="
cat tsc_output.txt
```

**Phase 2: Clear Build Cache (SECOND)**
```bash
# Step 1: Stop dev server
./stop.sh

# Step 2: Clear Vite cache
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist

# Step 3: Restart dev server
./start.sh

# Step 4: Check logs
sleep 3
tail -50 .vite.log
```

**Phase 3: Verify Fix (THIRD)**
```bash
# Check if error persists
tail -30 .vite.log | grep -i "error\|fail"
```

**Phase 4: Manual Code Examination (ONLY IF TOOLS SHOW NO ERRORS)**
- If ESLint shows no errors
- AND TypeScript shows no errors
- AND cache clear doesn't fix it
- THEN examine code manually

**Forbidden Actions:**
- ❌ Manually examining code before running linting tools
- ❌ Counting braces manually before checking TypeScript compiler
- ❌ Assuming syntax error without verifying with ESLint/TypeScript
- ❌ Ignoring cache as potential cause
- ❌ Wasting time on manual investigation when tools would find issue immediately

**Why This Rule Exists:**
- Linting tools are faster and more accurate than manual review
- Cache corruption can cause false errors (Babel vs ESLint/TypeScript mismatch)
- User time is wasted on manual investigation
- User correctly identified the right approach: "why not lint?"

---

## Impact

### Before Rule 34
- ❌ Assistant manually examined code for syntax errors
- ❌ Assistant tried to count braces manually
- ❌ Assistant wasted time on manual investigation
- ❌ User had to ask "why not lint?"

### After Rule 34
- ✅ Assistant runs linting tools FIRST
- ✅ Assistant clears cache SECOND
- ✅ Assistant only examines code manually if tools show no errors
- ✅ User shouldn't have to remind assistant to use proper tools

---

## Files Modified

1. **`.augment/rules/mandatory-rules.md`**
   - Added Rule 34 (new rule)
   - Updated version: 4.2 → 4.3
   - Updated description to include "debugging workflow"

2. **`.augment/rules/RULE_34_ADDED.md`** (renamed from RULE_30_ADDED.md)
   - Documents the new rule
   - Explains user question
   - Shows before/after comparison

---

## Lesson Learned

**User taught assistant:**
- ✅ Use linting tools FIRST, not manual examination
- ✅ Cache corruption can cause false syntax errors
- ✅ ESLint/TypeScript are authoritative, not Babel runtime errors
- ✅ Clear cache when tools show no errors but runtime shows errors

**This lesson was NOT documented in existing rules.**

---

**Status**: ✅ Rule 34 created and documented
**Next Steps**: Update mandatory-rules.md to include Rule 34

