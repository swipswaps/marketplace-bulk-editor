#!/bin/bash

# Automated Database Backup Script
# This script creates a backup of the PostgreSQL database and stores it with a timestamp
# Can be run manually or scheduled with cron

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/marketplace}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-marketplace_user}"
DB_PASSWORD="${DB_PASSWORD:-marketplace_pass}"
DB_NAME="${DB_NAME:-marketplace_db}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/marketplace_backup_$TIMESTAMP.sql"

echo "=== Marketplace Database Backup ==="
echo "Date: $(date)"
echo "Backup file: $BACKUP_FILE"
echo ""

# Set password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Create backup using pg_dump
echo "Creating backup..."
pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  -f "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully"
  
  # Get file size
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "Backup size: $FILE_SIZE"
  
  # Compress backup (optional)
  if command -v gzip &> /dev/null; then
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    COMPRESSED_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Compressed size: $COMPRESSED_SIZE"
  fi
  
  # Clean up old backups (older than RETENTION_DAYS)
  echo ""
  echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
  find "$BACKUP_DIR" -name "marketplace_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete
  
  # List remaining backups
  echo ""
  echo "Current backups:"
  ls -lh "$BACKUP_DIR"/marketplace_backup_*.sql* 2>/dev/null || echo "No backups found"
  
  echo ""
  echo "✅ Backup completed successfully"
  exit 0
else
  echo "❌ Backup failed"
  exit 1
fi

# Unset password
unset PGPASSWORD

# Example cron job (run daily at 2 AM):
# 0 2 * * * /path/to/automated_backup.sh >> /var/log/marketplace_backup.log 2>&1

# Example cron job (run every 6 hours):
# 0 */6 * * * /path/to/automated_backup.sh >> /var/log/marketplace_backup.log 2>&1

# Example cron job (run weekly on Sunday at 3 AM):
# 0 3 * * 0 /path/to/automated_backup.sh >> /var/log/marketplace_backup.log 2>&1

