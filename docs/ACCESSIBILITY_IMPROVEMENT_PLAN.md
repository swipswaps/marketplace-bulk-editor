# Accessibility Improvement Plan

**Date**: 2025-12-22  
**Scope**: Upgrade login and other page controls for accessibility by impaired users  
**Standard**: WCAG 2.1 AA compliance  
**Principle**: If OCR cannot find a button, screen readers likely cannot either

---

## ✅ Current Accessibility Features (DO NOT REMOVE)

### AuthModal.tsx (Login/Register)
- ✅ `aria-describedby` on form
- ✅ `role="alert"` on error messages
- ✅ `aria-live="assertive"` on errors
- ✅ `aria-atomic="true"` on errors
- ✅ `aria-label="required"` on required field markers
- ✅ `aria-required="true"` on inputs
- ✅ `aria-invalid` on inputs with errors
- ✅ `aria-busy` on submit button
- ✅ `aria-live="polite"` on submit button
- ✅ `aria-hidden="true"` on decorative icons
- ✅ `autoComplete` attributes
- ✅ `autoFocus` on email field
- ✅ Proper `id` and `htmlFor` associations

### Modal.tsx
- ✅ `role="dialog"`
- ✅ `aria-modal="true"`
- ✅ `aria-labelledby` pointing to title
- ✅ `aria-label="Close modal"` on close button
- ✅ `aria-hidden="true"` on backdrop
- ✅ Escape key to close
- ✅ Body scroll lock

### UserMenu.tsx
- ✅ Login button with icon + text label

---

## ❌ Accessibility Gaps to Fix

### 1. DataTable.tsx - Icon-Only Buttons

**Issue**: Buttons with only icons and `title` attribute are not accessible to screen readers

**Affected buttons**:
- Clear search button (line 539-545) - Only `<X>` icon
- Column action menu button (line 676-685) - Only `<MoreVertical>` icon
- Duplicate button (line 1106-1112) - Only `<Copy>` icon + title
- Delete row button (line 1113-1119) - Only `<Trash2>` icon + title

**Fix**: Add `aria-label` to all icon-only buttons

**Example**:
```tsx
// BEFORE
<button
  onClick={() => setSearchQuery('')}
  className="..."
  title="Clear search"
>
  <X size={16} />
</button>

// AFTER
<button
  onClick={() => setSearchQuery('')}
  className="..."
  title="Clear search"
  aria-label="Clear search"
>
  <X size={16} aria-hidden="true" />
</button>
```

---

### 2. BackendStatus.tsx - Expand/Collapse Button

**Issue**: Expand/collapse button has no `aria-label` or `aria-expanded` state

**Affected button**:
- Backend status expand/collapse (line 137-149)

**Fix**: Add `aria-label` and `aria-expanded`

**Example**:
```tsx
// BEFORE
<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="..."
>
  <div className="flex items-center gap-2">
    {getStatusIcon()}
    <span>{health.message}</span>
  </div>
  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
</button>

// AFTER
<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="..."
  aria-label={`Backend status: ${health.message}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
  aria-expanded={isExpanded}
>
  <div className="flex items-center gap-2">
    {getStatusIcon()}
    <span>{health.message}</span>
  </div>
  {isExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
</button>
```

---

### 3. Missing ARIA Live Regions

**Issue**: Dynamic content updates don't announce to screen readers

**Affected areas**:
- Data table row count changes
- File upload progress
- Backend status changes
- Sync status changes

**Fix**: Add `aria-live` regions for dynamic updates

**Example**:
```tsx
// Add to DataTable.tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {data.length} listings in table. {selectedRows.size} selected.
</div>

// Add to FileUpload.tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isDragActive ? 'Drop file to upload' : 'Drag and drop area ready'}
</div>
```

---

### 4. Missing Keyboard Navigation Hints

**Issue**: No visual indication of keyboard shortcuts or focus order

**Fix**: Add keyboard shortcut documentation and visible focus indicators

**Example**:
```tsx
// Add to SettingsModal or create KeyboardShortcutsModal
<div>
  <h3>Keyboard Shortcuts</h3>
  <ul>
    <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> - Undo</li>
    <li><kbd>Ctrl</kbd> + <kbd>Y</kbd> - Redo</li>
    <li><kbd>Esc</kbd> - Close modal</li>
    <li><kbd>Tab</kbd> - Navigate between fields</li>
  </ul>
</div>
```

---

### 5. Missing Skip Links

**Issue**: Keyboard users must tab through entire header to reach main content

**Fix**: Add skip link at top of page

**Example**:
```tsx
// Add to App.tsx at the very top
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white"
>
  Skip to main content
</a>

// Add id to main content area
<main id="main-content">
  {/* existing content */}
</main>
```

---

## 📋 Implementation Checklist

- [x] Add `aria-label` to all icon-only buttons in DataTable.tsx ✅ **COMPLETED 2025-12-22**
  - Clear search button (line 543)
  - Column action menu button (lines 683-684) + `aria-expanded`
  - Duplicate button (line 1113)
  - Delete button (line 1119)
- [x] Add `aria-expanded` to expand/collapse buttons ✅ **COMPLETED 2025-12-22**
  - BackendStatus.tsx expand/collapse (lines 140-141)
- [x] Add `aria-live` regions for dynamic content ✅ **COMPLETED 2025-12-22**
  - DataTable.tsx listing count (lines 468-471)
  - FileUpload.tsx drag/drop state (lines 601-604)
- [x] Add skip link to main content ✅ **COMPLETED 2025-12-22**
  - App.tsx skip link (lines 262-268)
  - Main content id (line 467)
- [ ] Add keyboard shortcuts documentation
- [x] Create test script for screen reader verification ✅ **COMPLETED 2025-12-22**
  - `test_accessibility.py` - Uses OCR to verify button text is visible
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Test with keyboard-only navigation
- [ ] Verify all interactive elements are focusable
- [ ] Verify focus indicators are visible
- [ ] Run automated accessibility audit (axe DevTools)

---

## ✅ Implementation Summary (2025-12-22)

### Files Modified
1. **src/components/DataTable.tsx** - Added `aria-label` to 4 icon-only buttons
2. **src/components/BackendStatus.tsx** - Added `aria-label` and `aria-expanded` to expand/collapse button
3. **src/components/FileUpload.tsx** - Added `aria-live` region for drag/drop state
4. **src/App.tsx** - Added skip link and main content id

### Test Script Created
- **test_accessibility.py** - OCR-based accessibility verification
  - Finds existing Firefox window with xdotool
  - Takes screenshots at each step
  - Uses OCR to verify button text is visible
  - Principle: "If OCR can't find it, screen readers can't either"

### Next Steps
1. Run `npm run dev` to start development server
2. Open http://localhost:5174 in Firefox
3. Run `./test_accessibility.py` to verify changes
4. Test with actual screen reader (NVDA on Windows, VoiceOver on Mac)
5. Test keyboard navigation (Tab, Escape, Enter keys)

---

**Status**: 4/10 checklist items completed. Core accessibility improvements implemented. Testing phase next.

