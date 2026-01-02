# Features to Borrow from Similar Repositories

**Date**: 2025-12-26  
**Analysis**: Comparison of marketplace-bulk-editor with similar projects

---

## 1. Facebook Marketplace Bot (GeorgiKeranov)

**Repository**: https://github.com/GeorgiKeranov/facebook-marketplace-bot  
**Stars**: 195 | **Language**: Python + Selenium  
**Purpose**: Automates Facebook Marketplace listing removal and re-upload from CSV

### Features We Should Borrow

| Feature | Their Implementation | How We Can Use It | Priority |
|---------|---------------------|-------------------|----------|
| **CSV-based bulk operations** | Reads items/vehicles from CSV files | ✅ Already have this | - |
| **Auto-remove and re-upload** | Removes existing listings, then re-uploads to bump to top | Add "Bump Listings" feature to refresh timestamps | HIGH |
| **Multiple photo upload** | Photos folder path + semicolon-separated filenames | Add photo upload support (currently missing) | HIGH |
| **Group posting** | Post to multiple Facebook groups (semicolon-separated) | Add multi-marketplace posting (eBay + Facebook + Amazon) | MEDIUM |
| **Cookie-based auto-login** | Saves cookies after first manual login using Pickle | Add session persistence for backend auth | MEDIUM |
| **Exact option matching** | Type exact name for dropdowns (Category, Condition, etc.) | ✅ Already have this with validation | - |

### Code to Borrow

```python
# Photo handling from their CSV structure
photos_folder = "C:\\Pictures"
photos_names = "Photo 1.JPG; Photo 2.png; Photo3.jpg"

# Split and construct full paths
photo_paths = [
    os.path.join(photos_folder, name.strip()) 
    for name in photos_names.split(';')
]
```

**Benefit**: Photo upload is critical for marketplace listings - we currently don't support this.

---

## 2. Handsontable (JavaScript Data Grid)

**Repository**: https://github.com/handsontable/handsontable  
**Stars**: 21.7k | **Language**: JavaScript/TypeScript  
**Purpose**: Spreadsheet-like data grid with Excel-like editing

### Features We Should Borrow

| Feature | Their Implementation | How We Can Use It | Priority |
|---------|---------------------|-------------------|----------|
| **Keyboard shortcuts** | Excel/Google Sheets compliant (Ctrl+C, Ctrl+V, Ctrl+Z) | ✅ Already have undo/redo, add more shortcuts | LOW |
| **Cell validation** | Built-in validators for data types | Enhance our validation with visual feedback | MEDIUM |
| **Dropdown editors** | Type-ahead dropdown with autocomplete | ✅ Already have this | - |
| **Numeric formatting** | Format numbers, currencies, percentages | Add price formatting ($1,234.56) | MEDIUM |
| **Date picker** | Built-in date selection component | Add date picker for listing dates | LOW |
| **Formula support** | 400+ spreadsheet formulas via HyperFormula | Add basic formulas (SUM, COUNT for analytics) | LOW |
| **Column resizing** | Drag column borders to resize | ✅ Already have this | - |
| **Row/column freezing** | Freeze headers while scrolling | ✅ Already have sticky header | - |
| **Context menu** | Right-click menu for common actions | Add right-click menu (duplicate, delete, copy) | MEDIUM |
| **Multi-column sorting** | Sort by multiple columns | ✅ Already have this | - |
| **Conditional formatting** | Highlight cells based on rules | Add color coding for price ranges, conditions | HIGH |
| **Clipboard operations** | Enhanced copy/paste with formatting | Improve our clipboard handling | MEDIUM |

### Code to Borrow

```javascript
// Conditional formatting example
const gridOptions = {
  cells: function(row, col) {
    const cellProperties = {};
    const data = this.instance.getDataAtRowProp(row, 'price');
    
    // Highlight expensive items
    if (data > 1000) {
      cellProperties.className = 'price-high';
    } else if (data < 100) {
      cellProperties.className = 'price-low';
    }
    
    return cellProperties;
  }
};
```

**Benefit**: Conditional formatting would help users quickly identify pricing issues or high-value items.

---

## 3. AG Grid (Enterprise Data Grid)

**Repository**: https://github.com/ag-grid/ag-grid  
**Stars**: 14.9k | **Language**: TypeScript  
**Purpose**: Enterprise-grade data grid with advanced features

### Features We Should Borrow

| Feature | Their Implementation | How We Can Use It | Priority |
|---------|---------------------|-------------------|----------|
| **Integrated charting** | Built-in charts from grid data | Add analytics dashboard (price distribution, category breakdown) | MEDIUM |
| **Excel export** | Export to .xlsx with formatting | ✅ Already have this | - |
| **CSV import/export** | Import/export CSV files | ✅ Already have this | - |
| **Advanced filtering** | Set filters, text filters, number filters | Enhance our search with filter builder | MEDIUM |
| **Row grouping** | Group rows by column values | Add grouping by category/condition | LOW |
| **Aggregation** | Sum, average, count, min, max | Add summary row with totals | MEDIUM |
| **Pivoting** | Pivot table functionality | Add pivot view for analytics | LOW |
| **Master/Detail** | Expandable rows with detail panels | Add detail panel for photos/description | HIGH |
| **Infinite scrolling** | Virtual scrolling for large datasets | ✅ Already have virtualization | - |
| **Column pinning** | Pin columns to left/right | Add pin TITLE and PRICE columns | MEDIUM |
| **Cell range selection** | Select multiple cells like Excel | Add range selection for bulk edit | HIGH |
| **Status bar** | Show aggregations at bottom | Add status bar with count/sum | MEDIUM |
| **Tool panels** | Side panels for columns/filters | Add side panel for quick filters | LOW |

### Code to Borrow

```typescript
// Master/Detail expandable rows
const gridOptions = {
  masterDetail: true,
  detailCellRendererParams: {
    detailGridOptions: {
      columnDefs: [
        { field: 'photo', cellRenderer: 'agGroupCellRenderer' },
        { field: 'description' },
        { field: 'tags' }
      ]
    },
    getDetailRowData: (params) => {
      params.successCallback(params.data.details);
    }
  }
};
```

**Benefit**: Master/Detail would let users see full descriptions and photos without leaving the grid.

---

## Priority Implementation Plan

### HIGH Priority (Implement First)

1. **Photo Upload Support** (from Facebook Marketplace Bot)
   - Add photo column to data table
   - File upload component
   - Preview thumbnails in grid
   - Export photos with listings

2. **Conditional Formatting** (from Handsontable)
   - Color-code prices (red > $1000, green < $100)
   - Highlight empty required fields
   - Show validation errors in red

3. **Master/Detail Rows** (from AG Grid)
   - Expandable rows for full description
   - Photo gallery in detail panel
   - Edit details without modal

4. **Cell Range Selection** (from AG Grid)
   - Select multiple cells
   - Bulk edit selected cells
   - Copy/paste ranges

### MEDIUM Priority (Implement Next)

5. **Auto-Bump Listings** (from Facebook Marketplace Bot)
   - Remove and re-upload to refresh timestamps
   - Schedule automatic bumps
   - Track last bump date

6. **Advanced Filtering** (from AG Grid)
   - Filter builder UI
   - Save filter presets
   - Quick filters sidebar

7. **Aggregation/Summary Row** (from AG Grid)
   - Show total count
   - Average price
   - Price range (min/max)

8. **Context Menu** (from Handsontable)
   - Right-click for quick actions
   - Duplicate row
   - Delete row
   - Copy/paste

9. **Column Pinning** (from AG Grid)
   - Pin TITLE and PRICE columns
   - Always visible while scrolling

### LOW Priority (Future Enhancements)

10. **Integrated Charts** (from AG Grid)
    - Price distribution histogram
    - Category pie chart
    - Condition breakdown

11. **Formula Support** (from Handsontable)
    - Calculate totals
    - Price adjustments
    - Bulk price changes

12. **Row Grouping** (from AG Grid)
    - Group by category
    - Group by condition
    - Collapsible groups

---

## Implementation Notes

### Photo Upload Architecture

```typescript
interface Listing {
  title: string;
  price: number;
  condition: string;
  description: string;
  photos: Photo[];  // NEW
}

interface Photo {
  id: string;
  url: string;
  file?: File;
  order: number;
}

// Component structure
<FileUpload
  accept="image/*"
  multiple
  maxFiles={10}
  onUpload={(files) => handlePhotoUpload(files)}
/>

<PhotoGallery
  photos={listing.photos}
  onReorder={(photos) => updatePhotoOrder(photos)}
  onDelete={(photoId) => deletePhoto(photoId)}
/>
```

### Conditional Formatting CSS

```css
/* Price-based highlighting */
.price-high {
  background-color: #fee;
  color: #c00;
}

.price-low {
  background-color: #efe;
  color: #060;
}

.price-medium {
  background-color: #ffc;
  color: #660;
}

/* Validation errors */
.cell-error {
  border: 2px solid #f00;
  background-color: #fee;
}

/* Required field empty */
.cell-required-empty {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
}
```

### Master/Detail Implementation

```typescript
// Add expandable row component
const DetailPanel = ({ data }: { data: Listing }) => (
  <div className="detail-panel">
    <div className="detail-photos">
      {data.photos.map(photo => (
        <img key={photo.id} src={photo.url} alt="" />
      ))}
    </div>
    <div className="detail-description">
      <h4>Full Description</h4>
      <p>{data.description}</p>
    </div>
    <div className="detail-metadata">
      <p>Created: {data.createdAt}</p>
      <p>Last Updated: {data.updatedAt}</p>
    </div>
  </div>
);
```

---

## Estimated Effort

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Photo Upload | 3-5 days | File storage (S3/local), image processing |
| Conditional Formatting | 1-2 days | CSS, cell renderer updates |
| Master/Detail | 2-3 days | Row expansion logic, detail component |
| Cell Range Selection | 3-4 days | Selection state management, keyboard handling |
| Auto-Bump | 2-3 days | Backend API, scheduling |
| Advanced Filtering | 4-5 days | Filter builder UI, query logic |
| Aggregation | 2-3 days | Calculation logic, summary row component |
| Context Menu | 1-2 days | Right-click handler, menu component |
| Column Pinning | 2-3 days | Table layout updates, scroll handling |

**Total Estimated Effort**: 20-30 days for HIGH + MEDIUM priority features

---

## Next Steps

1. Review this document with stakeholders
2. Prioritize features based on user feedback
3. Create GitHub issues for each feature
4. Start with HIGH priority items
5. Test each feature thoroughly before moving to next

---

**Status**: ✅ Analysis complete  
**Repositories Analyzed**: 3  
**Features Identified**: 25+  
**Priority Features**: 9 (HIGH + MEDIUM)

