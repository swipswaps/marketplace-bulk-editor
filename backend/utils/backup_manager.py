"""
Database backup and restore utilities
"""
import os
import subprocess
import tempfile
import logging
from datetime import datetime
from typing import Optional, Tuple
from flask import current_app

logger = logging.getLogger(__name__)


class BackupManager:
    """Manages database backup and restore operations"""
    
    def __init__(self):
        """Initialize backup manager with database connection info"""
        self.db_url = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
        self.is_postgres = self.db_url.startswith('postgresql://')
        
        if self.is_postgres:
            # Parse PostgreSQL connection string
            # Format: postgresql://user:password@host:port/database
            parts = self.db_url.replace('postgresql://', '').split('@')
            user_pass = parts[0].split(':')
            host_db = parts[1].split('/')
            host_port = host_db[0].split(':')
            
            self.db_user = user_pass[0]
            self.db_password = user_pass[1] if len(user_pass) > 1 else ''
            self.db_host = host_port[0]
            self.db_port = host_port[1] if len(host_port) > 1 else '5432'
            self.db_name = host_db[1]
        else:
            logger.warning("Database is not PostgreSQL - backup/restore not supported for SQLite")
    
    def create_backup(self) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Create database backup using pg_dump
        
        Returns:
            Tuple of (success, backup_file_path, error_message)
        """
        if not self.is_postgres:
            return False, None, "Backup only supported for PostgreSQL databases"
        
        try:
            # Generate backup filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f'marketplace_backup_{timestamp}.sql'
            backup_path = os.path.join(tempfile.gettempdir(), backup_filename)
            
            logger.info(f"Creating backup: {backup_path}")
            
            # Set environment variable for password (pg_dump uses PGPASSWORD)
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password
            
            # Run pg_dump command
            # Using --clean to include DROP statements
            # Using --if-exists to avoid errors if objects don't exist
            # Using --no-owner to avoid ownership issues on restore
            # Using --no-privileges to avoid privilege issues on restore
            cmd = [
                'pg_dump',
                '-h', self.db_host,
                '-p', self.db_port,
                '-U', self.db_user,
                '-d', self.db_name,
                '--clean',
                '--if-exists',
                '--no-owner',
                '--no-privileges',
                '-f', backup_path
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                error_msg = f"pg_dump failed: {result.stderr}"
                logger.error(error_msg)
                return False, None, error_msg
            
            # Verify backup file was created and has content
            if not os.path.exists(backup_path):
                return False, None, "Backup file was not created"
            
            file_size = os.path.getsize(backup_path)
            if file_size == 0:
                return False, None, "Backup file is empty"
            
            logger.info(f"Backup created successfully: {backup_path} ({file_size} bytes)")
            return True, backup_path, None
            
        except subprocess.TimeoutExpired:
            return False, None, "Backup operation timed out (>5 minutes)"
        except Exception as e:
            error_msg = f"Backup failed: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
    
    def restore_backup(self, backup_file_path: str) -> Tuple[bool, Optional[str]]:
        """
        Restore database from backup file using psql
        
        Args:
            backup_file_path: Path to backup SQL file
            
        Returns:
            Tuple of (success, error_message)
        """
        if not self.is_postgres:
            return False, "Restore only supported for PostgreSQL databases"
        
        if not os.path.exists(backup_file_path):
            return False, f"Backup file not found: {backup_file_path}"
        
        try:
            logger.info(f"Restoring backup from: {backup_file_path}")
            
            # Set environment variable for password
            env = os.environ.copy()
            env['PGPASSWORD'] = self.db_password
            
            # Run psql command to restore
            cmd = [
                'psql',
                '-h', self.db_host,
                '-p', self.db_port,
                '-U', self.db_user,
                '-d', self.db_name,
                '-f', backup_file_path
            ]
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                error_msg = f"psql restore failed: {result.stderr}"
                logger.error(error_msg)
                return False, error_msg
            
            logger.info("Backup restored successfully")
            return True, None
            
        except subprocess.TimeoutExpired:
            return False, "Restore operation timed out (>5 minutes)"
        except Exception as e:
            error_msg = f"Restore failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

