# Lessons Learned - 2025-12-29

**Date**: 2025-12-29  
**Context**: Debugging Vite build error in DataTable.tsx  
**User Question**: "why not lint?"

---

## Lesson: Use Linting Tools FIRST, Not Manual Code Examination

### What Happened

**User reported error:**
```
[plugin:vite:react-babel] /home/owner/Documents/.../DataTable.tsx: Unexpected token, expected "," (546:4)
```

**Assistant's approach (WRONG):**
1. ❌ Manually examined DataTable.tsx around line 546
2. ❌ Tried to count braces with Python script
3. ❌ Looked at git history without running tools
4. ❌ Examined function structure manually
5. ❌ Wasted significant time on manual investigation

**User's correction:**
> "why not lint?"

**Correct approach:**
1. ✅ Run `npm run lint` immediately
2. ✅ Run `npx tsc --noEmit` to check TypeScript
3. ✅ Clear Vite cache (`rm -rf node_modules/.vite`)
4. ✅ Restart server (`./stop.sh && ./start.sh`)
5. ✅ Check logs (`tail -50 .vite.log`)

---

## Root Cause

**Vite cache corruption** - not actual syntax error

**Evidence:**
- ✅ ESLint showed NO errors in DataTable.tsx
- ✅ TypeScript showed NO errors in DataTable.tsx
- ✅ Clearing cache fixed the problem immediately
- ✅ Application loaded successfully after cache clear

**Why Babel showed error but ESLint/TypeScript didn't:**
- Babel was reading from corrupted Vite cache
- ESLint/TypeScript were reading from actual source files
- Cache corruption caused false syntax error

---

## Key Insights

### 1. Linting Tools Are Authoritative
- ESLint and TypeScript are the source of truth
- Babel runtime errors can be caused by cache corruption
- Always trust linting tools over runtime errors

### 2. Cache Corruption Is Common
- Vite caches transformed code in `node_modules/.vite`
- Cache can become corrupted during development
- Clearing cache should be SECOND step (after linting)

### 3. Manual Code Examination Is Last Resort
- Only examine code manually if tools show no errors
- Counting braces manually is error-prone and slow
- User time is wasted on manual investigation

---

## New Rule Created

**Rule 34: Debugging Build/Syntax Errors - Use Tools First**

**Mandatory workflow:**
1. Run linting tools (ESLint, TypeScript)
2. Clear build cache
3. Restart dev server
4. Check logs
5. ONLY THEN examine code manually

**Added to:**
- `.augment/rules/mandatory-rules.md` (line 341)
- `.augment/rules/RULE_34_ADDED.md` (full documentation)

---

## Impact

### Before This Lesson
- ❌ Assistant manually examined code for syntax errors
- ❌ Assistant tried to count braces manually
- ❌ Assistant wasted time on manual investigation
- ❌ User had to ask "why not lint?"

### After This Lesson
- ✅ Assistant runs linting tools FIRST
- ✅ Assistant clears cache SECOND
- ✅ Assistant only examines code manually if tools show no errors
- ✅ User shouldn't have to remind assistant to use proper tools

---

## Related Documentation

- **`.augment/rules/RULE_34_ADDED.md`** - Full documentation of Rule 34
- **`.augment/rules/mandatory-rules.md`** - Updated to version 4.3 with Rule 34
- **`.augment/rules/LESSONS_LEARNED.md`** - Previous lessons learned (2025-12-19)

---

## Summary

**User taught assistant:**
- ✅ Use linting tools FIRST, not manual examination
- ✅ Cache corruption can cause false syntax errors
- ✅ ESLint/TypeScript are authoritative, not Babel runtime errors
- ✅ Clear cache when tools show no errors but runtime shows errors

**This lesson was NOT documented in existing rules before 2025-12-29.**

**Status**: ✅ Lesson documented and Rule 34 created

