# Database Features User Guide

**Date**: 2025-12-19  
**Features Added**: Save/Load Database buttons, SQL Export

---

## 🎯 Overview

Three new features have been added to integrate with the Docker backend:

1. **Save to Database** - Save all listings to PostgreSQL database
2. **Load from Database** - Load listings from PostgreSQL database
3. **Export to SQL** - Download SQL INSERT statements

**Requirements**: You must be logged in to use these features.

---

## 📸 Feature Locations

### 1. Save/Load Database Buttons

**Location**: Header (right side, after Settings button)

**Appearance**:
- **Save to DB** button (green) - Uploads icon
- **Load from DB** button (blue) - Download icon

**Visibility**: Only visible when logged in

---

### 2. SQL Export Option

**Location**: Export button dropdown menu

**Appearance**:
- Click the dropdown arrow (▼) next to "Export for FB" button
- Menu shows:
  - **Export to Excel** (green spreadsheet icon) - Facebook Marketplace format
  - **Export to SQL** (blue database icon) - Database INSERT statements

**Visibility**: SQL export only visible when logged in

---

## 🚀 How to Use

### Step 1: Login

1. Click **Login** button in header (top right)
2. Enter your credentials:
   - Email: `user@example.com`
   - Password: `SecurePass123!`
3. Click **Login**

**OR** Register a new account:
1. Click **Register** tab
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Password (must meet strength requirements)
   - Confirm Password
3. Click **Register**

---

### Step 2: Save Listings to Database

**When to use**: After editing listings, save them to the database for persistence

**Steps**:
1. Make sure you have listings loaded (upload Excel file or create manually)
2. Click **Save to DB** button (green, top right)
3. Wait for confirmation: "✅ Listings saved to database successfully!"

**What happens**:
- All listings are sent to PostgreSQL database
- Data is transformed from frontend format (UPPERCASE) to backend format (lowercase)
- Each listing gets a unique ID
- Sync status shows "Synced just now"

**Note**: Button is disabled when:
- No listings to save
- Currently syncing

---

### Step 3: Load Listings from Database

**When to use**: Retrieve previously saved listings

**Steps**:
1. Click **Load from DB** button (blue, top right)
2. Wait for confirmation: "✅ Loaded X listings from database!"

**What happens**:
- Fetches all your listings from PostgreSQL
- Data is transformed from backend format (lowercase) to frontend format (UPPERCASE)
- Listings appear in the table
- If you have local listings, they are merged with database listings (no duplicates)

**Note**: Button is disabled when currently syncing

---

### Step 4: Export to SQL

**When to use**: Download SQL INSERT statements for importing into another database

**Steps**:
1. Make sure you have listings loaded
2. Click the dropdown arrow (▼) next to "Export for FB" button
3. Click **Export to SQL**
4. File downloads: `marketplace-listings-[timestamp].sql`

**What's in the SQL file**:
```sql
-- Marketplace Listings Export
-- Generated: 2025-12-19T20:35:56.811468
-- Total listings: 1

CREATE TABLE IF NOT EXISTS marketplace_listings (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    offer_shipping VARCHAR(3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO marketplace_listings (id, title, price, condition, description, category, offer_shipping) VALUES (
    '5d275ead-cf16-4cf4-aaed-4c345323465a',
    'Solar Panel 300W Monocrystalline',
    150.00,
    'New',
    'High efficiency solar panel',
    'Electronics',
    'Yes'
);
```

**Use cases**:
- Import into MySQL, PostgreSQL, SQLite
- Backup listings as SQL
- Share listings with other developers
- Migrate data between systems

---

## 🔄 Auto-Sync Feature

**What it does**: Automatically syncs listings to database every 30 seconds (when logged in)

**How to see it**:
- Look at **Sync Status** indicator (next to Backend Status)
- Shows: "Synced just now" | "Syncing..." | "Sync failed"

**When it runs**:
- Only when logged in
- Every 30 seconds
- In the background (doesn't interrupt your work)

**What it syncs**:
- All listings in the table
- Sends to PostgreSQL database
- Updates existing listings or creates new ones

---

## ⚠️ Important Notes

### 1. Login Required

All database features require authentication:
- ❌ Not logged in: Buttons hidden or show "Login to use" message
- ✅ Logged in: All features available

### 2. Data Format Transformation

**Frontend** (what you see in UI):
- UPPERCASE field names: `TITLE`, `PRICE`, `CONDITION`, etc.
- Facebook Marketplace compatible

**Backend** (what's stored in database):
- lowercase field names: `title`, `price`, `condition`, etc.
- Python/SQL conventions

**Transformation is automatic** - you don't need to do anything!

### 3. Merge Behavior

When loading from database:
- If you have local listings AND database listings:
  - Both are merged
  - Duplicates removed (by ID)
  - Remote (database) takes precedence
- If only database listings: Replaces local
- If only local listings: Keeps local

---

## 🐛 Troubleshooting

### "Please login to save to database"

**Problem**: Not authenticated  
**Solution**: Click Login button and enter credentials

### "Failed to save to database"

**Problem**: Backend not running or network error  
**Solution**:
1. Check Backend Status indicator (should be green "Docker Backend Connected")
2. If red, run `./docker-start.sh`
3. Wait 10 seconds and try again

### "No listings found in database"

**Problem**: No listings saved yet  
**Solution**: Save some listings first using "Save to DB" button

### SQL Export shows "Login to export to SQL"

**Problem**: Not authenticated  
**Solution**: Login first, then try export again

---

## 📊 Summary

| Feature | Button Location | Requires Login | What It Does |
|---------|----------------|----------------|--------------|
| Save to DB | Header (green) | ✅ Yes | Upload listings to PostgreSQL |
| Load from DB | Header (blue) | ✅ Yes | Download listings from PostgreSQL |
| Export to SQL | Export dropdown | ✅ Yes | Download SQL INSERT statements |
| Auto-Sync | Background | ✅ Yes | Sync every 30 seconds |

---

**Next Steps**: See [HOW_TO_USE_DOCKER_BACKEND.md](./HOW_TO_USE_DOCKER_BACKEND.md) for complete backend API documentation.

