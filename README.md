# Facebook Marketplace Bulk Editor

A professional-grade web application for editing and combining Facebook Marketplace bulk upload spreadsheets with advanced UX features including dark mode, keyboard navigation, bulk actions, and undo/redo.

🌐 **Live Demo**: [https://swipswaps.github.io/marketplace-bulk-editor/](https://swipswaps.github.io/marketplace-bulk-editor/)

---

## 🐳 NEW: Full-Stack Docker Deployment Available!

**The improvement plan has been IMPLEMENTED!** This app now includes:

- ✅ **Secure Backend** (Flask + PostgreSQL + JWT auth)
- ✅ **Multi-Format Export** (Text, CSV, XLSX, JSON, SQL)
- ✅ **OCR Integration** (Convert scanned catalogs to listings)
- ✅ **Data Persistence** (PostgreSQL database)
- ✅ **RESTful API** (28 endpoints across 6 groups)
- ✅ **Redis Caching** (Rate limiting + performance)
- ✅ **Docker Deployment** (4-container architecture)
- ✅ **Backend Status Indicator** (Real-time connection monitoring)

### 🚀 Quick Start (Docker)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
./docker-start.sh

# Access the app
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000

# Stop all services
./docker-stop.sh
```

**✅ VERIFIED**: All services tested with Selenium + OCR verification (see [COMPLETE_WORKFLOW_EVIDENCE.md](./COMPLETE_WORKFLOW_EVIDENCE.md))

### 🎯 Complete Workflow (Tested End-to-End)

1. **Setup**: `./docker-start.sh` → 4 containers running (PostgreSQL, Redis, Backend, Frontend)
2. **Register**: `POST /api/auth/register` → JWT tokens issued (15 min access, 7 day refresh)
3. **Create Listing**: `POST /api/listings` → Saved to PostgreSQL
4. **Create Template**: `POST /api/templates` → Reusable configuration saved
5. **Export to SQL**: `POST /api/export/sql` → INSERT statements generated
6. **Rate Limiting**: 101 requests → 429 error (100/min limit enforced)
7. **Frontend UI**: Backend status indicator, file upload, dark mode, data table
8. **Selenium Testing**: 8 screenshots in VISIBLE mode (NOT headless)

**See [COMPLETE_WORKFLOW_EVIDENCE.md](./COMPLETE_WORKFLOW_EVIDENCE.md) for full terminal output, API responses, database queries, and screenshots.**

### 📸 Screenshots (Selenium Testing - VISIBLE Mode)

All screenshots captured with Selenium in VISIBLE mode (NOT headless) following the README Quick Start guide:

#### 1. Frontend Loaded
![Frontend Loaded](./screenshot_01_frontend_loaded.png)
*Initial page load showing "Marketplace Bulk Editor" title and file upload area*

**OCR Verified**: ✅ "Marketplace", "Bulk", "Editor"

#### 2. Backend Status Indicator
![Backend Status](./screenshot_02_backend_status.png)
*Backend status showing "Docker Backend Connected" in header*

**OCR Verified**: ✅ "Docker Backend", "Connected"

#### 3. File Upload Area
![File Upload Area](./screenshot_03_file_upload_area.png)
*Drag-and-drop file upload interface with instructions*

**OCR Verified**: ✅ "Drop your file here or click to browse"

#### 4. Settings Modal
![Settings Modal](./screenshot_04_settings_modal.png)
*Settings modal with Dark Mode toggle and legal information*

**OCR Verified**: ✅ "Settings", "Dark Mode", "Important Legal Notice"

#### 5. Dark Mode Enabled
![Dark Mode](./screenshot_05_dark_mode.png)
*Dark mode activated (persisted in localStorage)*

**OCR Verified**: ✅ Dark theme applied to modal

#### 6. Backend Status Expanded
![Backend Expanded](./screenshot_06_backend_expanded.png)
*Backend status expanded showing all 6 API endpoint groups*

**OCR Verified**: ✅ "/api/auth", "/api/listings", "/api/templates", "/api/ocr", "/api/export", "/health"

**Test Summary**:
- ✅ All screenshots verified with Tesseract OCR
- ✅ Console logs: 0 errors, 0 warnings
- ✅ Test date: 2025-12-19 13:52 UTC
- ✅ Test script: `test_follow_readme.py` (follows README Quick Start)

### 📊 What You Get

| Feature | Frontend Only | With Docker Backend |
|---------|--------------|---------------------|
| **Data Storage** | ❌ Browser only (lost on refresh) | ✅ PostgreSQL (permanent) |
| **Authentication** | ❌ None | ✅ JWT tokens (15 min access, 7 day refresh) |
| **OCR Processing** | ❌ None | ✅ Tesseract OCR |
| **SQL Export** | ❌ None | ✅ Full SQL INSERT statements |
| **Templates** | ❌ None | ✅ Save/reuse configurations |
| **Rate Limiting** | ❌ None | ✅ Redis-backed (100/min general, 10/min uploads, 50/hour exports) |
| **Audit Logs** | ❌ None | ✅ Full compliance tracking |
| **Multi-User** | ❌ Single user | ✅ Multiple users with accounts |

### 📚 Documentation

- **[COMPLETE_WORKFLOW_EVIDENCE.md](./COMPLETE_WORKFLOW_EVIDENCE.md)** - ⭐ **NEW**: Complete end-to-end workflow testing (Rule 22 compliance)
- **[HOW_TO_USE_DOCKER_BACKEND.md](./HOW_TO_USE_DOCKER_BACKEND.md)** - Complete user guide (583 lines)
- **[DOCKER_QUICK_REFERENCE.md](./DOCKER_QUICK_REFERENCE.md)** - Quick reference card (print this!)
- **[DOCKER_BACKEND_EXPLANATION.md](./DOCKER_BACKEND_EXPLANATION.md)** - Architecture overview
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Technical setup guide
- **[DOCKER_DEPLOYMENT_EVIDENCE.md](./DOCKER_DEPLOYMENT_EVIDENCE.md)** - Deployment verification
- **[SELENIUM_TEST_EVIDENCE.md](./SELENIUM_TEST_EVIDENCE.md)** - UI testing with screenshots
- **[README_IMPROVEMENTS.md](./README_IMPROVEMENTS.md)** - Implementation overview
- **[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)** - Original plan (1,175 lines)

---

## ⚠️ IMPORTANT LEGAL DISCLAIMER

**This software is NOT affiliated with, maintained, authorized, endorsed, or sponsored by Meta Platforms, Inc. or Facebook, Inc.**

- **FACEBOOK®** and the Facebook logo are **registered trademarks** of Meta Platforms, Inc.
- **MARKETPLACE™** is a **trademark** of Meta Platforms, Inc.
- All trademarks are the property of their respective owners.

### User Responsibility

**BY USING THIS SOFTWARE, YOU AGREE THAT:**

1. **Copyright & IP Compliance**: You are **solely responsible** for ensuring all listings comply with intellectual property laws. **NO counterfeit, replica, or unauthorized items.**

2. **Facebook Commerce Policies**: You must comply with [Meta's Commerce Policies](https://www.facebook.com/policies/commerce). Prohibited items include:
   - Alcohol, tobacco, and drugs
   - Weapons, ammunition, and explosives
   - Adult products and services
   - Animals and endangered species
   - Healthcare items (prescription drugs, medical devices)
   - Recalled, illegal, or hazardous products
   - Counterfeit or replica items
   - Digital products and non-physical items

3. **No Warranty**: This software is provided "AS IS" without warranty of any kind.

4. **Limitation of Liability**: The developers assume **NO LIABILITY** for account suspensions, policy violations, legal consequences, or any damages arising from use of this software.

5. **Use at Your Own Risk**: You are responsible for compliance with all applicable laws and platform policies.

For complete terms, see the [LICENSE](LICENSE) file.

---

## Table of Contents

- [Features](#features)
- [User Guide](#user-guide)
  - [Getting Started](#getting-started)
  - [Uploading Files](#uploading-files)
  - [Editing Listings](#editing-listings)
  - [Keyboard Navigation](#keyboard-navigation)
  - [Bulk Actions](#bulk-actions)
  - [Search & Filter](#search--filter)
  - [Column Management](#column-management)
  - [Undo/Redo](#undoredo)
  - [Dark Mode](#dark-mode)
  - [Exporting Data](#exporting-data)
- [Developer Guide](#developer-guide)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Component Architecture](#component-architecture)
  - [State Management](#state-management)
  - [Key Features Implementation](#key-features-implementation)
  - [Local Development](#local-development)
  - [Building & Deployment](#building--deployment)
- [Facebook Marketplace Format](#facebook-marketplace-format)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features
- 📤 **Multi-File Upload**: Drag & drop or select multiple Excel files (.xlsx, .xls, .csv)
- ✏️ **Inline Editing**: Click any cell to edit directly without separate edit mode
- 🔄 **Combine Spreadsheets**: Merge multiple files into one unified list
- 📱 **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- 💾 **Smart Export**: Export to Facebook-compatible Excel format with sort order preserved
- ✅ **Validation**: Real-time validation with warnings for missing/invalid data

### Advanced UX Features (17 Total)
1. **Escape Key Cancel** - Press Escape to exit edit mode without saving
2. **Sorted Column Highlight** - Visual feedback showing which column is sorted
3. **Row Hover Effects** - Clear visual feedback when hovering over rows
4. **Character Counter** - Live character count for TITLE field (max 150)
5. **Sticky Header** - Table header stays visible when scrolling
6. **Auto-Save Indicator** - Shows "Saved at [time]" after each edit
7. **Duplicate Button** - Clone any listing with one click
8. **Import Validation** - Alerts about empty titles, invalid prices, missing descriptions
9. **Search/Filter** - Real-time search across all fields with results count
10. **Column Visibility** - Show/hide columns via dropdown menu
11. **Export Preview** - Preview first 10 rows before exporting
12. **Dark Mode** - Toggle between light and dark themes (persists across sessions)
13. **Keyboard Navigation** - Navigate cells with Arrow keys, Tab, and Enter
14. **Bulk Actions** - Select multiple rows for bulk delete or bulk edit
15. **Undo/Redo** - Full undo/redo support with Ctrl+Z / Ctrl+Y (last 50 actions)
16. **Navigation Controls** - Floating panel for quick jumping to sections (disabled by default, enable in Settings)
17. **Analytics Dashboard** - Summary cards and interactive word cloud with click-to-filter

### Table Features
- 🔀 **Column Sorting**: Click headers to sort (ascending → descending → none)
- 📏 **Column Resizing**: Drag column dividers to resize
- 🎯 **Autocomplete**: Smart suggestions for TITLE and CATEGORY fields
- ⌨️ **Keyboard Shortcuts**: Enter to save, Shift+Enter for newlines, Escape to cancel
- 📊 **Auto-Expanding Textarea**: Description field grows with content

---

## User Guide

### Getting Started

1. **Access the App**: Visit [https://swipswaps.github.io/marketplace-bulk-editor/](https://swipswaps.github.io/marketplace-bulk-editor/)
2. **Upload Your Files**: Drag and drop Excel files or click to browse
3. **Edit Your Listings**: Click any cell to edit inline
4. **Export**: Click "Export for FB" to download the combined spreadsheet

### Uploading Files

**Drag & Drop:**
1. Drag one or more Excel files (.xlsx, .xls, .csv) onto the upload area
2. Files are automatically parsed and added to the table
3. Multiple uploads are merged into a single list

**Click to Browse:**
1. Click the upload area
2. Select one or more files from your computer
3. Files are processed and listings appear in the table

**Import Validation:**
- ⚠️ **Empty Titles**: Warns if any listings have blank titles
- ⚠️ **Invalid Prices**: Warns if prices are missing or ≤ 0
- ⚠️ **Empty Descriptions**: Warns if descriptions are blank

### Editing Listings

**Inline Editing:**
1. **Click any cell** to start editing
2. **Make your changes** in the input field
3. **Press Enter** to save (or click outside the cell)
4. **Press Escape** to cancel without saving

**Field-Specific Editing:**

- **TITLE**: Text input with autocomplete suggestions and character counter (max 150)
- **PRICE**: Number input (must be > 0)
- **CONDITION**: Dropdown with 4 options (New, Used - Like New, Used - Good, Used - Fair)
- **DESCRIPTION**: Auto-expanding textarea (Shift+Enter for new lines)
- **CATEGORY**: Text input with autocomplete suggestions from previous entries
- **OFFER SHIPPING**: Dropdown (Yes/No)

**Adding New Listings:**
1. Click **"Add New Listing"** button
2. A blank row appears at the bottom
3. Fill in the fields by clicking each cell

**Duplicating Listings:**
1. Click the **blue copy icon** (📋) next to any row
2. An exact duplicate appears at the bottom of the table

**Deleting Listings:**
1. Click the **red trash icon** (🗑️) next to any row
2. Confirm the deletion
3. The listing is removed

### Keyboard Navigation

**Navigating Cells:**
- **Arrow Up/Down** (↑↓): Move between rows
- **Arrow Left/Right** (←→): Move between columns
- **Tab**: Move to next cell
- **Enter**: Start editing the focused cell
- **Escape**: Cancel editing

**Visual Feedback:**
- Focused cell has a **blue ring outline**
- Click any cell to focus it
- Keyboard navigation only works when not editing

### Bulk Actions

**Selecting Rows:**
1. Click the **checkbox** in the header to select/deselect all rows
2. Click **individual checkboxes** to select specific rows
3. See **"X selected"** counter when rows are selected

**Bulk Delete:**
1. Select one or more rows
2. Click the **"Delete"** button
3. Confirm the deletion
4. All selected rows are removed

**Bulk Edit:**
1. Select one or more rows
2. Click the **"Bulk Edit..."** dropdown
3. Choose an option:
   - **Set Condition**: New, Used - Like New, Used - Good, Used - Fair
   - **Set Shipping**: Yes or No
4. All selected rows are updated instantly

### Search & Filter

**Using Search:**
1. Type in the **"Search listings..."** box
2. Results filter in real-time across all fields:
   - TITLE
   - DESCRIPTION
   - CATEGORY
   - CONDITION
   - PRICE
   - OFFER SHIPPING
3. See **"X of Y listings"** count below the search box

**Clearing Search:**
- Delete text from the search box to show all listings

### Column Management

**Hiding/Showing Columns:**
1. Click the **"Columns"** button (👁️ icon)
2. Check/uncheck columns to show/hide them
3. Changes apply instantly

**Sorting Columns:**
1. Click any **column header** to sort
2. Click again to reverse sort (descending)
3. Click a third time to remove sorting
4. **Visual feedback**: Sorted column has blue background and bold text

**Resizing Columns:**
1. Hover over the **divider** between column headers
2. Cursor changes to resize cursor (↔️)
3. **Click and drag** to resize
4. Minimum width: 100px

### Undo/Redo

**Using Undo/Redo:**
- **Ctrl+Z** (or Cmd+Z on Mac): Undo last action
- **Ctrl+Y** (or Cmd+Y on Mac): Redo last undone action
- **Undo/Redo buttons** in header (curved arrow icons)

**What Can Be Undone:**
- Cell edits
- Adding new listings
- Deleting listings
- Duplicating listings
- Bulk delete
- Bulk edit
- Clearing all listings

**History Limit:**
- Last **50 actions** are tracked
- Buttons are disabled when at history limits

### Dark Mode

**Toggling Dark Mode:**
1. Click **Settings** (gear icon) in the header
2. Toggle the **Dark Mode** switch
3. Theme switches instantly
4. Preference is **saved** and persists across sessions

**Dark Mode Features:**
- All UI elements adapt to dark theme
- Reduced eye strain during long editing sessions
- Automatic localStorage persistence

### Navigation Controls

**Enabling Navigation Controls:**
1. Click **Settings** (gear icon) in the header
2. Toggle the **Navigation Controls** switch
3. A floating panel appears in the top-right corner

**Using Navigation Controls:**
- **Jump to Main Content** - Scroll to the main content area
- **Jump to Data Table** - Scroll to the listings table
- **Jump to Analytics** - Scroll to the analytics dashboard
- **Jump to Debug Logs** - Scroll to debug console (if visible)

**Closing Navigation Controls:**
- Click the **X** button on the panel, or
- Disable in **Settings** → **Navigation Controls**

**Note:** Navigation Controls are disabled by default to keep the UI clean.

### Exporting Data

**Export Preview:**
1. Click **"Export for FB"** button
2. **Preview modal** appears showing:
   - First 10 rows of data
   - Total listing count
   - Current sort order
3. Click **"Confirm Export"** to download
4. Click **"Cancel"** to close preview

**Export Features:**
- Exported file respects current **sort order**
- File format: `.xlsx` (Excel)
- Filename: `marketplace-listings-[timestamp].xlsx`
- Compatible with Facebook Marketplace bulk upload

**Clear All:**
1. Click **"Clear All"** button in header
2. Confirm the action
3. All listings are removed (can be undone with Ctrl+Z)

---

## Developer Guide

### Tech Stack

**Frontend Framework:**
- **React 19** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite 7** - Fast build tool and dev server

**Styling:**
- **Tailwind CSS v3.4.1** - Utility-first CSS framework
- **PostCSS** - CSS preprocessor
- **Dark Mode** - Class-based strategy (`dark:` prefix)

**Libraries:**
- **SheetJS (xlsx)** - Excel file reading/writing
- **React Dropzone** - Drag-and-drop file upload
- **Lucide React** - Icon library

**Deployment:**
- **GitHub Pages** - Static site hosting
- **GitHub Actions** - CI/CD pipeline

### Project Structure

```
marketplace-bulk-editor/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── vite.svg               # Public assets
├── src/
│   ├── components/
│   │   ├── DataTable.tsx      # Main table component with all features
│   │   ├── ExportButton.tsx   # Export functionality with preview
│   │   └── FileUpload.tsx     # Drag-and-drop file upload
│   ├── assets/                # Static assets
│   ├── App.tsx                # Root component with state management
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles and Tailwind imports
│   └── types.ts               # TypeScript type definitions
├── dist/                      # Build output (generated)
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── README.md                  # This file
```

### Component Architecture

#### **App.tsx** (Root Component)
**Responsibilities:**
- Global state management (listings, sort state, dark mode)
- Undo/redo history management
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Dark mode persistence (localStorage)
- Coordinating child components

**Key State:**
```typescript
const [listings, setListings] = useState<MarketplaceListing[]>([]);
const [sortField, setSortField] = useState<SortField>(null);
const [sortDirection, setSortDirection] = useState<SortDirection>(null);
const [darkMode, setDarkMode] = useState<boolean>(false);
const [history, setHistory] = useState<MarketplaceListing[][]>([]);
const [historyIndex, setHistoryIndex] = useState<number>(-1);
```

**Key Functions:**
- `updateListingsWithHistory()` - Updates listings and adds to history stack
- `handleUndo()` - Reverts to previous state
- `handleRedo()` - Moves forward in history
- `handleDataLoaded()` - Merges uploaded files with existing data
- `handleClearAll()` - Removes all listings

#### **FileUpload.tsx** (File Upload Component)
**Responsibilities:**
- Drag-and-drop file upload
- Excel/CSV file parsing
- Data validation and warnings
- Multiple file support

**Key Features:**
- Uses `react-dropzone` for drag-and-drop
- Uses `xlsx` library to parse Excel files
- Validates data on import:
  - Empty titles
  - Invalid prices (≤ 0)
  - Empty descriptions
- Generates unique IDs for each listing (`crypto.randomUUID()`)

**Props:**
```typescript
interface FileUploadProps {
  onDataLoaded: (data: MarketplaceListing[]) => void;
}
```

#### **DataTable.tsx** (Main Table Component)
**Responsibilities:**
- Inline cell editing
- Column sorting and resizing
- Search/filter functionality
- Column visibility toggle
- Keyboard navigation
- Bulk actions (select, delete, edit)
- Row operations (add, delete, duplicate)
- Auto-save indicator

**Key State:**
```typescript
const [editingCell, setEditingCell] = useState<{id: string; field: keyof MarketplaceListing} | null>(null);
const [focusedCell, setFocusedCell] = useState<{id: string; field: keyof MarketplaceListing} | null>(null);
const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
const [searchQuery, setSearchQuery] = useState<string>('');
const [visibleColumns, setVisibleColumns] = useState<Record<keyof MarketplaceListing, boolean>>({...});
const [columnWidths, setColumnWidths] = useState<Record<string, number>>({...});
const [resizing, setResizing] = useState<{column: string; startX: number; startWidth: number; colIndex: number} | null>(null);
```

**Key Features:**
- **Inline Editing**: Click cell → edit → Enter to save / Escape to cancel
- **Column Sorting**: Click header → cycles through asc/desc/none
- **Column Resizing**: Drag divider → updates width (min 100px)
- **Keyboard Navigation**: Arrow keys, Tab, Enter (useEffect with keydown listener)
- **Bulk Actions**: Checkboxes + bulk delete/edit functions
- **Search**: Real-time filtering across all fields
- **Autocomplete**: HTML5 `<datalist>` for TITLE and CATEGORY

**Props:**
```typescript
interface DataTableProps {
  data: MarketplaceListing[];
  onUpdate: (data: MarketplaceListing[]) => void;
  sortField: keyof MarketplaceListing | null;
  sortDirection: 'asc' | 'desc' | null;
  onSortChange: (field: keyof MarketplaceListing | null, direction: 'asc' | 'desc' | null) => void;
}
```

#### **ExportButton.tsx** (Export Component)
**Responsibilities:**
- Export preview modal
- Excel file generation
- Sort order preservation
- Download trigger

**Key Features:**
- **Preview Modal**: Shows first 10 rows before export
- **Sort Preservation**: Applies same sort as table
- **Excel Generation**: Uses `xlsx` library to create .xlsx file
- **Download**: Triggers browser download with timestamp filename

**Props:**
```typescript
interface ExportButtonProps {
  data: MarketplaceListing[];
  sortField: keyof MarketplaceListing | null;
  sortDirection: 'asc' | 'desc' | null;
}
```

### State Management

**State Flow:**
```
App.tsx (Root State)
  ├── listings: MarketplaceListing[]
  ├── sortField: keyof MarketplaceListing | null
  ├── sortDirection: 'asc' | 'desc' | null
  ├── darkMode: boolean
  ├── history: MarketplaceListing[][]
  └── historyIndex: number
       │
       ├──> FileUpload.tsx
       │     └── onDataLoaded(newData) → updateListingsWithHistory()
       │
       ├──> DataTable.tsx
       │     ├── data={listings}
       │     ├── onUpdate={updateListingsWithHistory}
       │     ├── sortField={sortField}
       │     ├── sortDirection={sortDirection}
       │     └── onSortChange={(field, dir) => {...}}
       │
       └──> ExportButton.tsx
             ├── data={listings}
             ├── sortField={sortField}
             └── sortDirection={sortDirection}
```

**Lifting State Up:**
- Sort state is lifted to `App.tsx` so both `DataTable` and `ExportButton` can access it
- This ensures exported file respects the current sort order

**History Management:**
- Every data change goes through `updateListingsWithHistory()`
- History stack maintains last 50 states
- Truncates future history when new action is performed after undo

### Key Features Implementation

#### **1. Inline Editing**
**Implementation:**
- Track `editingCell` state: `{id: string, field: keyof MarketplaceListing}`
- On cell click: set `editingCell` to current cell
- Render input/select/textarea based on field type
- On blur or Enter: save changes and clear `editingCell`
- On Escape: clear `editingCell` without saving

**Code Pattern:**
```typescript
{editingCell?.id === listing.id && editingCell?.field === 'TITLE' ? (
  <input
    value={listing.TITLE}
    onChange={(e) => handleCellUpdate(listing.id, 'TITLE', e.target.value)}
    onBlur={() => setEditingCell(null)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') setEditingCell(null);
      if (e.key === 'Escape') setEditingCell(null);
    }}
  />
) : (
  <span>{listing.TITLE}</span>
)}
```

#### **2. Column Sorting**
**Implementation:**
- Sort state lifted to `App.tsx`
- Click handler cycles through: `null → asc → desc → null`
- Visual feedback: blue background + bold text on sorted column
- Sort applied to filtered data before rendering

**Code Pattern:**
```typescript
const sortedData = [...filteredData].sort((a, b) => {
  if (!sortField || !sortDirection) return 0;
  const aVal = a[sortField];
  const bVal = b[sortField];
  if (aVal === bVal) return 0;
  const comparison = aVal < bVal ? -1 : 1;
  return sortDirection === 'asc' ? comparison : -comparison;
});
```

#### **3. Column Resizing**
**Implementation:**
- Track `resizing` state with column, startX, startWidth, colIndex
- On mousedown on resize handle: set `resizing` state
- Document-level mousemove listener: calculate delta and update width
- Document-level mouseup listener: clear `resizing` state
- Use `<colgroup>` and `<col>` elements for width control
- Direct DOM manipulation for immediate visual feedback

**Code Pattern:**
```typescript
useEffect(() => {
  if (!resizing) return;

  const handleMouseMove = (e: MouseEvent) => {
    const delta = e.clientX - resizing.startX;
    const newWidth = Math.max(100, resizing.startWidth + delta);
    setColumnWidths(prev => ({...prev, [resizing.column]: newWidth}));
  };

  document.addEventListener('mousemove', handleMouseMove, true);
  return () => document.removeEventListener('mousemove', handleMouseMove, true);
}, [resizing]);
```

#### **4. Keyboard Navigation**
**Implementation:**
- Track `focusedCell` state (separate from `editingCell`)
- Document-level keydown listener
- Arrow keys: calculate new row/column index
- Tab: move to next column
- Enter: start editing focused cell
- Visual feedback: blue ring outline (`ring-2 ring-blue-500 ring-inset`)

**Code Pattern:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (editingCell || !focusedCell) return;

    switch (e.key) {
      case 'ArrowUp':
        // Move to previous row
        break;
      case 'ArrowDown':
        // Move to next row
        break;
      // ... other keys
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [editingCell, focusedCell, sortedData]);
```

#### **5. Bulk Actions**
**Implementation:**
- Track `selectedRows` state: `Set<string>` of listing IDs
- Checkbox column with select all in header
- Bulk delete: filter out selected IDs
- Bulk edit: map over data and update selected rows

**Code Pattern:**
```typescript
const handleBulkDelete = () => {
  const updatedData = data.filter(item => !selectedRows.has(item.id));
  onUpdate(updatedData);
  setSelectedRows(new Set());
};

const handleBulkEdit = (field: keyof MarketplaceListing, value: any) => {
  const updatedData = data.map(item =>
    selectedRows.has(item.id) ? { ...item, [field]: value } : item
  );
  onUpdate(updatedData);
};
```

#### **6. Undo/Redo**
**Implementation:**
- Track `history` array and `historyIndex` in `App.tsx`
- Every update goes through `updateListingsWithHistory()`
- Truncate future history when new action is performed
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)
- UI buttons disabled when at history limits

**Code Pattern:**
```typescript
const updateListingsWithHistory = (newListings: MarketplaceListing[]) => {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newListings);
  if (newHistory.length > 50) newHistory.shift();

  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
  setListings(newListings);
};

const handleUndo = () => {
  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setListings(history[newIndex]);
  }
};
```

#### **7. Dark Mode**
**Implementation:**
- Track `darkMode` boolean state
- Apply/remove `dark` class to `document.documentElement`
- Persist to localStorage
- All components use `dark:` Tailwind prefix for dark styles

**Code Pattern:**
```typescript
useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('darkMode', JSON.stringify(darkMode));
}, [darkMode]);
```

**Tailwind Config:**
```javascript
export default {
  darkMode: 'class',  // Enable class-based dark mode
  // ...
}
```

#### **8. Search/Filter**
**Implementation:**
- Track `searchQuery` state
- Filter data before sorting
- Search across all fields using `toLowerCase().includes()`
- Show results count

**Code Pattern:**
```typescript
const filteredData = data.filter(listing => {
  const query = searchQuery.toLowerCase();
  return (
    listing.TITLE.toLowerCase().includes(query) ||
    listing.DESCRIPTION.toLowerCase().includes(query) ||
    listing.CATEGORY.toLowerCase().includes(query) ||
    // ... other fields
  );
});
```

### Local Development

#### Option 1: Docker Deployment (RECOMMENDED)

**Full-stack deployment with backend, database, and caching:**

**Prerequisites:**
- Docker installed and running

**Setup:**
```bash
# Clone the repository
git clone https://github.com/swipswaps/marketplace-bulk-editor.git
cd marketplace-bulk-editor

# Start all services (PostgreSQL, Redis, Backend, Frontend)
./docker-start.sh

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000
# PostgreSQL: localhost:5432
# Redis: localhost:6379

# View logs
docker logs marketplace-backend -f
docker logs marketplace-frontend -f

# Stop all services
./docker-stop.sh
```

**What's included:**
- ✅ PostgreSQL database (persistent storage)
- ✅ Redis cache (rate limiting + performance)
- ✅ Flask backend (28 API endpoints)
- ✅ React frontend (Vite dev server)
- ✅ OCR functionality (Tesseract)
- ✅ Multi-format export (CSV, JSON, XLSX, SQL, text)

**See**: [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed documentation

---

#### Option 2: Frontend Only (Simple)

**Frontend-only development without backend features:**

**Prerequisites:**
- Node.js 18+ and npm

**Setup:**
```bash
# Clone the repository
git clone https://github.com/swipswaps/marketplace-bulk-editor.git
cd marketplace-bulk-editor

# Install dependencies
npm install

# Start dev server (RECOMMENDED: use scripts)
./start.sh

# Or manually (not recommended - can leave orphaned processes)
npm run dev
```

**Note**: This mode runs only the frontend. Backend features (database, OCR, API) will not be available.

### Development Scripts

**Use these scripts for clean process management:**

```bash
# Start the dev server
./start.sh

# Stop the dev server
./stop.sh

# Interactive management (check status, restart, view logs)
./dev.sh
```

**Why use scripts instead of `npm run dev`?**

- ✅ **No port conflicts** - Automatically detects and kills orphaned processes
- ✅ **Clean shutdown** - Ensures no stray processes remain
- ✅ **PID tracking** - Knows exactly what's running
- ✅ **Log management** - Captures output to `.vite.log`
- ✅ **Status checking** - `./dev.sh` shows if server is already running

**⚠️ Important:** If you run `npm run dev` manually, always use `./stop.sh` to clean up before starting again.

**Development Server:**
- URL: http://localhost:5173
- Hot reload enabled
- TypeScript type checking in IDE

**Available Scripts:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Building & Deployment

**Build for Production:**
```bash
npm run build
```
- Output: `dist/` folder
- Optimized and minified
- Ready for static hosting

**Deploy to GitHub Pages:**

1. **Setup (one-time):**
   - Go to repository Settings → Pages
   - Set Source to "GitHub Actions"

2. **Deploy:**
   - Push to `main` branch
   - GitHub Actions automatically builds and deploys
   - Live in ~90 seconds at `https://[username].github.io/marketplace-bulk-editor/`

**GitHub Actions Workflow:**
- File: `.github/workflows/deploy.yml`
- Triggers: Push to `main` branch
- Steps: Install → Build → Deploy to `gh-pages` branch

**Manual Deployment:**
```bash
npm run build
# Upload dist/ folder to any static hosting service
```

---

## Facebook Marketplace Format

The app supports the official Facebook Marketplace bulk upload format:

| Column | Required | Type | Validation |
|--------|----------|------|------------|
| **TITLE** | ✅ Yes | Text | Max 150 characters |
| **PRICE** | ✅ Yes | Number | Must be > 0 |
| **CONDITION** | ✅ Yes | Dropdown | New, Used - Like New, Used - Good, Used - Fair |
| **DESCRIPTION** | ⚠️ Recommended | Text | Max 5000 characters |
| **CATEGORY** | ❌ Optional | Text | Free text (autocomplete available) |
| **OFFER SHIPPING** | ❌ Optional | Dropdown | Yes or No |

**Import Validation:**
- Warns if TITLE is empty
- Warns if PRICE is ≤ 0 or missing
- Warns if DESCRIPTION is empty

**Export Format:**
- File type: `.xlsx` (Excel)
- Column order: TITLE, PRICE, CONDITION, DESCRIPTION, CATEGORY, OFFER SHIPPING
- Compatible with Facebook Marketplace bulk upload

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with clear commit messages
4. **Test thoroughly** in both light and dark modes
5. **Submit a pull request**

**Code Style:**
- Use TypeScript for type safety
- Follow existing code patterns
- Use Tailwind CSS for styling (no custom CSS)
- Add dark mode support for new UI elements

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Acknowledgments

- Built with [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Excel handling by [SheetJS](https://sheetjs.com/)

---

**Made with ❤️ for Facebook Marketplace sellers**
