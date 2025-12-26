# Frontmatter Fix - Rules Now Enforced

**Date**: 2025-12-24  
**Trigger**: User question: "there must be some documented way to enforce @rules"

---

## The Problem

The rules existed but were **NOT being automatically applied** because the frontmatter format was incorrect.

### What Was Wrong

**Incorrect frontmatter (markdown text):**
```markdown
# Mandatory Rules (Condensed)

**Version**: 3.8 | **Type**: always_apply

---
```

**This does NOT work** - Augment doesn't recognize this as "always apply" frontmatter.

### What Was Fixed

**Correct frontmatter (YAML format):**
```yaml
---
type: "always_apply"
description: "Mandatory rules for all AI assistant interactions"
---

# Mandatory Rules (Condensed)

**Version**: 3.8
```

**This DOES work** - Augment automatically includes these rules in every prompt.

---

## How Augment Rules Work

According to official documentation: https://docs.augmentcode.com/setup-augment/guidelines

### Rule Types

1. **Always** - Contents included in **every user prompt** automatically
2. **Manual** - Must be tagged with @ to attach
3. **Auto** - Agent automatically detects based on description field

### Frontmatter Format

**MUST be YAML at the TOP of the file:**
```yaml
---
type: "always_apply"
description: "Brief description of what this rule does"
---
```

**NOT markdown text in the body of the file.**

---

## Files Fixed

### 1. `.augment/rules/mandatory-rules.md`

**Before:**
```markdown
# Mandatory Rules (Condensed)

**Version**: 3.8 | **Type**: always_apply

---
```

**After:**
```yaml
---
type: "always_apply"
description: "Mandatory rules for all AI assistant interactions - workflow patterns, evidence requirements, and critical constraints"
---

# Mandatory Rules (Condensed)

**Version**: 3.8
```

### 2. `.augment/rules/Mandatory_LLM_Execution_Checklist.md`

**Before:**
```markdown
Mandatory LLM Execution Checklist (Machine-Checkable)

All steps must be evaluated in order.
```

**After:**
```yaml
---
type: "always_apply"
description: "Machine-checkable execution checklist - pre-flight validation, assumption control, evidence requirements, and stop-the-line conditions"
---

# Mandatory LLM Execution Checklist (Machine-Checkable)

All steps must be evaluated in order.
```

---

## Files Already Correct

✅ `.augment/rules/README.md` - Already had correct YAML frontmatter  
✅ `.augment/rules/workspace-guidelines.md` - Already had correct YAML frontmatter

---

## Impact

### Before Fix
- ❌ Rules existed but were NOT automatically applied
- ❌ Assistant had to be manually reminded to follow rules
- ❌ User had to constantly ask "did you read the rules?"
- ❌ Repeated mistakes despite documented solutions

### After Fix
- ✅ Rules are automatically included in EVERY prompt
- ✅ Assistant should follow rules without being asked
- ✅ Frontmatter is in correct YAML format
- ✅ Augment recognizes these as "always apply" rules

---

## Verification

To verify rules are being applied, check:
1. Augment should automatically follow Rule 0 (per-step pattern)
2. Augment should use `xprop` instead of `xdotool getwindowname` (Rule 26)
3. Augment should run OCR before making claims about screenshots (Rule 27)
4. Augment should show evidence after each step (Rule 2)

---

## Next Steps

1. **Test in new conversation** - Start fresh chat to verify rules are applied
2. **Monitor compliance** - Check if assistant follows rules automatically
3. **Report issues** - If rules still not followed, may be Augment bug

---

**Status**: ✅ Frontmatter fixed in 2 files  
**Format**: YAML frontmatter at top of file  
**Type**: `always_apply` - Rules included in every prompt  
**Expected**: Rules should now be automatically enforced

