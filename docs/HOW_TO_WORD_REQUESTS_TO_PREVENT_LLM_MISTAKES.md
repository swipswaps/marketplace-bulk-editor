# How to Word Requests to Prevent LLM Mistakes

**Date**: 2025-12-22  
**Based on**: REPEATED_MISTAKES_ANALYSIS.md, Mandatory_LLM_Execution_Checklist.md, mandatory-rules.md v3.8

---

## 🎯 Core Principle: Trigger Phrases Force Compliance

The LLM has 28 mandatory rules, but it may not follow them unless you use **trigger phrases** that activate specific rules.

---

## 📋 Trigger Phrases by Category

### 1. Workspace Verification (Rule 1)

**Problem**: LLM might work in wrong directory or repository

**Trigger Phrases**:
- ✅ "Declare workspace before acting"
- ✅ "Verify repository path"
- ✅ "State absolute path to workspace"

**Example**:
```
❌ BAD: "Fix the login button"
✅ GOOD: "Declare workspace, then fix the login button in marketplace-bulk-editor"
```

---

### 2. Evidence Requirements (Rule 2)

**Problem**: LLM makes claims without proof (screenshots, terminal output, OCR)

**Trigger Phrases**:
- ✅ "Show evidence for each claim"
- ✅ "Provide terminal output"
- ✅ "Take screenshot and use OCR to verify"
- ✅ "Show screenshot in VSCode file editor" (not just file size!)

**Example**:
```
❌ BAD: "Test the login form"
✅ GOOD: "Test the login form, take screenshot, use OCR to verify, show screenshot in VSCode"
```

---

### 3. OCR Verification (Rule 9, Rule 27)

**Problem**: LLM claims to "see" things without actually reading screenshots with OCR

**Trigger Phrases**:
- ✅ "Use OCR to read the screenshot"
- ✅ "Show full OCR output"
- ✅ "Don't guess what the screenshot shows - use OCR"
- ✅ "Run pytesseract and show extracted text"

**Example**:
```
❌ BAD: "Check if the button is visible"
✅ GOOD: "Take screenshot, use OCR to extract text, verify button text appears in OCR output"
```

---

### 4. Existing Browser Windows (Rule 26)

**Problem**: LLM creates new Selenium tests instead of using existing browser window

**Trigger Phrases**:
- ✅ "Use existing Firefox window with xdotool"
- ✅ "Find window with [title] in the title"
- ✅ "List all Firefox windows first"
- ✅ "Don't create new Selenium test - use existing browser"

**Example**:
```
❌ BAD: "Test the page"
✅ GOOD: "Use xdotool to find existing Firefox window with 'marketplace-bulk-editor' in title, take screenshot, use OCR"
```

---

### 5. Deterministic Parameters (Rule 28)

**Problem**: LLM guesses port numbers, credentials, URLs instead of reading APP_PARAMETERS_DATABASE.md

**Trigger Phrases**:
- ✅ "@APP_PARAMETERS_DATABASE.md"
- ✅ "Use deterministic parameters from APP_PARAMETERS_DATABASE.md"
- ✅ "Read .augment/APP_PARAMETERS_DATABASE.md BEFORE acting"
- ✅ "Quote parameters from database"

**Example**:
```
❌ BAD: "Start the dev server"
✅ GOOD: "@APP_PARAMETERS_DATABASE.md - Start dev server on documented port"
```

---

### 6. Scope Containment (Rule 5)

**Problem**: LLM adds unrequested features or refactors unrelated code

**Trigger Phrases**:
- ✅ "Only fix [specific thing], don't add features"
- ✅ "Scope: [exact task]"
- ✅ "Don't refactor unrelated code"

**Example**:
```
❌ BAD: "Improve the login form"
✅ GOOD: "Scope: Add aria-label to login button. Don't change anything else."
```

---

### 7. Feature Preservation (Rule 18)

**Problem**: LLM removes existing features without permission

**Trigger Phrases**:
- ✅ "List all existing features BEFORE making changes"
- ✅ "Don't remove any features"
- ✅ "Preserve all 15 advanced UX features"

**Example**:
```
❌ BAD: "Simplify the UI"
✅ GOOD: "List all existing features, then add [feature] without removing anything"
```

---

### 8. Complete Workflow Testing (Rule 22)

**Problem**: LLM only tests initial page load, not complete workflows

**Trigger Phrases**:
- ✅ "Test complete workflow from [start] to [end]"
- ✅ "Show all steps: setup → usage → verification"
- ✅ "Don't just load the page - demonstrate actual usage"

**Example**:
```
❌ BAD: "Test the app"
✅ GOOD: "Test complete workflow: load page → login → create listing → export → verify file content"
```

---

### 9. Mandatory Workflow Pattern (Rule 0 - META-RULE)

**Problem**: LLM doesn't follow per-step pattern (state rules → execute → evidence → verify)

**Trigger Phrases**:
- ✅ "Follow Rule 0 workflow pattern"
- ✅ "State rules for each step before executing"
- ✅ "Show evidence after each step"
- ✅ "Analyze request step-by-step with rule citations"

**Example**:
```
❌ BAD: "Fix the accessibility issues"
✅ GOOD: "Analyze request step-by-step, state applicable rules for each step, show evidence after each step"
```

---

## 🔥 Power Combo: Maximum Compliance

**Use this template for critical tasks:**

```
@APP_PARAMETERS_DATABASE.md
Declare workspace.
Analyze request step-by-step with rule citations.
For each step: state rules → execute → show evidence → verify compliance.
Use existing Firefox window with xdotool (don't create new Selenium test).
Take screenshots and use OCR to verify (show full OCR output).
Show screenshots in VSCode file editor (not just file size).
List all existing features before making changes.
Don't remove any features.
Scope: [exact task description]
```

---

## 📊 Common Mistakes and How to Prevent Them

| Mistake | Trigger Phrase to Prevent It |
|---------|------------------------------|
| LLM guesses port numbers | "@APP_PARAMETERS_DATABASE.md" |
| LLM claims to "see" screenshot without OCR | "Use OCR to read screenshot, show full output" |
| LLM shows file size instead of screenshot | "Show screenshot in VSCode file editor" |
| LLM creates new Selenium test | "Use existing Firefox window with xdotool" |
| LLM removes features | "List all features before changes, don't remove any" |
| LLM adds unrequested features | "Scope: [exact task], don't add features" |
| LLM doesn't follow per-step pattern | "Follow Rule 0 workflow pattern" |
| LLM makes claims without evidence | "Show evidence for each claim" |
| LLM doesn't test accessibility | "Test with OCR - if OCR can't find it, screen readers can't" |
| LLM breaks existing functionality | "Only add [X], preserve all existing functionality" |
| LLM tries to do everything at once | "Implement one component at a time, show evidence per step" |

---

## ✅ Success Criteria

**You know your request is well-worded when:**

1. ✅ LLM declares workspace before acting
2. ✅ LLM states which rules apply to each step
3. ✅ LLM shows evidence after each step
4. ✅ LLM uses OCR to verify screenshots (shows full output)
5. ✅ LLM displays screenshots in VSCode (not just file size)
6. ✅ LLM reads APP_PARAMETERS_DATABASE.md before guessing
7. ✅ LLM lists existing features before making changes
8. ✅ LLM stays within requested scope

**You should NEVER have to ask:**
- "Why didn't you follow the rules?"
- "Show me the evidence"
- "Use OCR to verify"
- "Why show file size instead of screenshot?"
- "Which rules apply?"

---

---

## 🆕 New Trigger Phrases (Added 2025-12-22)

### 10. Accessibility Testing (WCAG 2.1 AA)

**Problem**: LLM doesn't test accessibility or verify screen reader compatibility

**Trigger Phrases**:
- ✅ "Test with screen reader (OCR verification)"
- ✅ "Verify all buttons are findable by OCR"
- ✅ "If OCR can't find it, screen readers can't either"
- ✅ "Add aria-label to all icon-only buttons"
- ✅ "Add aria-live regions for dynamic content"
- ✅ "Test keyboard navigation (Tab, Escape, Enter)"

**Example**:
```
❌ BAD: "Make the app accessible"
✅ GOOD: "Add aria-label to all icon-only buttons. Test with OCR - if OCR can't find button text, screen readers can't either."
```

---

### 11. Code Changes Without Breaking Features

**Problem**: LLM changes code and breaks existing functionality

**Trigger Phrases**:
- ✅ "Only add [X], don't change existing code"
- ✅ "Preserve all existing functionality"
- ✅ "Add attributes only, don't modify logic"
- ✅ "Test before and after to verify nothing broke"

**Example**:
```
❌ BAD: "Improve the button"
✅ GOOD: "Add aria-label attribute to button. Don't change onClick handler or className. Preserve all existing functionality."
```

---

### 12. Multi-Step Implementation

**Problem**: LLM tries to do everything at once and makes mistakes

**Trigger Phrases**:
- ✅ "Implement one component at a time"
- ✅ "After each change, show evidence it works"
- ✅ "Don't move to next step until current step verified"
- ✅ "Break down into smallest possible steps"

**Example**:
```
❌ BAD: "Fix all accessibility issues"
✅ GOOD: "Fix DataTable.tsx first. Show code changes. Then fix BackendStatus.tsx. Show code changes. One component at a time."
```

---

## 🎓 How This Document Helps

**This document teaches you to:**
1. ✅ Activate specific rules with trigger phrases
2. ✅ Force LLM to follow per-step workflow pattern
3. ✅ Prevent repeated mistakes (false claims, guessing, scope creep)
4. ✅ Get evidence-based responses (screenshots, OCR, terminal output)
5. ✅ Ensure LLM reads documented parameters instead of guessing

**Use this as a reference when:**
- LLM makes claims without evidence
- LLM guesses instead of reading documentation
- LLM removes features without permission
- LLM adds unrequested features
- LLM doesn't follow rules automatically

---

**Last Updated**: 2025-12-22
**Version**: 1.0
**Based on**: 28 mandatory rules + analysis of repeated mistakes

