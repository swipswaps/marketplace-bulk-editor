#!/bin/bash

# Automated API Test Script for Backup/Restore Functionality
# Tests all backup endpoints with curl

set -e  # Exit on error

API_BASE="http://localhost:5000"
TEST_EMAIL="test_backup_$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"
TEST_NAME="Backup Test User"
BACKUP_FILE="/tmp/test_backup_$(date +%s).sql"

echo "========================================="
echo "Marketplace Backup API Test"
echo "========================================="
echo "Date: $(date)"
echo "API Base: $API_BASE"
echo "Test Email: $TEST_EMAIL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        exit 1
    fi
}

# Step 1: Check backend is running
echo "Step 1: Checking backend health..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Backend is healthy"
else
    print_result 1 "Backend health check failed"
fi
echo ""

# Step 2: Register user
echo "Step 2: Registering test user..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"full_name\":\"$TEST_NAME\"}")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n-1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "201" ]; then
    ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    print_result 0 "User registered successfully"
    echo "Access Token: ${ACCESS_TOKEN:0:20}..."
else
    print_result 1 "User registration failed"
fi
echo ""

# Step 3: Get backup info
echo "Step 3: Getting backup system info..."
BACKUP_INFO_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE/api/backup/info" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_CODE=$(echo "$BACKUP_INFO_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$BACKUP_INFO_RESPONSE" | head -n-1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    SUPPORTED=$(echo "$RESPONSE_BODY" | grep -o '"supported":[^,]*' | cut -d':' -f2)
    DB_TYPE=$(echo "$RESPONSE_BODY" | grep -o '"database_type":"[^"]*' | cut -d'"' -f4)
    print_result 0 "Backup info retrieved"
    echo "Database Type: $DB_TYPE"
    echo "Backup Supported: $SUPPORTED"
    
    if [ "$SUPPORTED" != "true" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Backup not supported for $DB_TYPE${NC}"
        echo "Backup/restore tests will be skipped"
        exit 0
    fi
else
    print_result 1 "Failed to get backup info"
fi
echo ""

# Step 4: Create some test data
echo "Step 4: Creating test listings..."
for i in {1..3}; do
    LISTING_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/listings" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"Test Product $i\",\"price\":$((100 + i * 10)),\"condition\":\"New\",\"description\":\"Test description $i\",\"category\":\"Electronics\",\"offer_shipping\":\"Yes\"}")
    
    HTTP_CODE=$(echo "$LISTING_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "201" ]; then
        echo "  ✅ Created listing $i"
    else
        echo "  ❌ Failed to create listing $i"
    fi
done
echo ""

# Step 5: Create backup
echo "Step 5: Creating database backup..."
BACKUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/backup/create" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -o "$BACKUP_FILE")

HTTP_CODE=$(echo "$BACKUP_RESPONSE" | tail -n1)

echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    if [ -f "$BACKUP_FILE" ]; then
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_result 0 "Backup created successfully"
        echo "Backup file: $BACKUP_FILE"
        echo "File size: $FILE_SIZE"
        
        # Show first few lines of backup
        echo ""
        echo "Backup file preview (first 10 lines):"
        head -n 10 "$BACKUP_FILE"
    else
        print_result 1 "Backup file not created"
    fi
else
    print_result 1 "Backup creation failed"
fi
echo ""

# Step 6: Delete a listing (to test restore)
echo "Step 6: Deleting a test listing..."
LISTINGS_RESPONSE=$(curl -s -X GET "$API_BASE/api/listings" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

FIRST_LISTING_ID=$(echo "$LISTINGS_RESPONSE" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4)

if [ -n "$FIRST_LISTING_ID" ]; then
    DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/api/listings/$FIRST_LISTING_ID" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Listing deleted (ID: $FIRST_LISTING_ID)"
    else
        print_result 1 "Failed to delete listing"
    fi
else
    echo "⚠️  No listings found to delete"
fi
echo ""

# Step 7: Restore backup
echo "Step 7: Restoring database from backup..."
RESTORE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/backup/restore" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -F "file=@$BACKUP_FILE")

HTTP_CODE=$(echo "$RESTORE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESTORE_RESPONSE" | head -n-1)

echo "Response: $RESPONSE_BODY"
echo "HTTP Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Backup restored successfully"
else
    print_result 1 "Backup restore failed"
fi
echo ""

# Step 8: Verify data was restored
echo "Step 8: Verifying restored data..."
VERIFY_RESPONSE=$(curl -s -X GET "$API_BASE/api/listings" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

LISTING_COUNT=$(echo "$VERIFY_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)

echo "Listings found: $LISTING_COUNT"

if [ "$LISTING_COUNT" -ge 3 ]; then
    print_result 0 "Data restored correctly (found $LISTING_COUNT listings)"
else
    print_result 1 "Data not restored correctly (expected 3, found $LISTING_COUNT)"
fi
echo ""

# Cleanup
echo "Cleanup: Removing backup file..."
rm -f "$BACKUP_FILE"
echo "✅ Backup file removed"
echo ""

echo "========================================="
echo "✅ ALL API TESTS PASSED"
echo "========================================="

