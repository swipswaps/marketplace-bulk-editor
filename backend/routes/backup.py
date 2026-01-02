"""
Backup and restore routes
"""
import os
import tempfile
import logging
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from utils.auth import token_required
from utils.audit import log_action
from utils.backup_manager import BackupManager

logger = logging.getLogger(__name__)

backup_bp = Blueprint('backup', __name__)


@backup_bp.route('/create', methods=['POST'])
@token_required
def create_backup(current_user):
    """
    Create database backup
    
    Returns:
        - 200: Backup file download
        - 500: Backup failed
    """
    try:
        backup_manager = BackupManager()
        success, backup_path, error = backup_manager.create_backup()
        
        if not success:
            log_action(current_user.id, 'backup_create_failed', 'database', None, 500,
                      metadata={'error': error})
            return jsonify({'error': error}), 500
        
        log_action(current_user.id, 'backup_create', 'database', None, 200,
                  metadata={'file': os.path.basename(backup_path)})
        
        # Send file and delete after sending
        return send_file(
            backup_path,
            mimetype='application/sql',
            as_attachment=True,
            download_name=os.path.basename(backup_path)
        )
        
    except Exception as e:
        error_msg = f"Backup creation failed: {str(e)}"
        logger.error(error_msg)
        log_action(current_user.id, 'backup_create_failed', 'database', None, 500,
                  metadata={'error': error_msg})
        return jsonify({'error': error_msg}), 500


@backup_bp.route('/restore', methods=['POST'])
@token_required
def restore_backup(current_user):
    """
    Restore database from backup file
    
    Request:
        - file: Backup SQL file (multipart/form-data)
        
    Returns:
        - 200: Restore successful
        - 400: No file provided or invalid file
        - 500: Restore failed
    """
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        if not file.filename.endswith('.sql'):
            return jsonify({'error': 'Invalid file type. Only .sql files are supported'}), 400
        
        # Save uploaded file to temporary location
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)
        
        logger.info(f"Uploaded backup file saved to: {temp_path}")
        
        # Restore from backup
        backup_manager = BackupManager()
        success, error = backup_manager.restore_backup(temp_path)
        
        # Clean up temporary file
        try:
            os.remove(temp_path)
        except Exception as e:
            logger.warning(f"Failed to delete temporary file {temp_path}: {e}")
        
        if not success:
            log_action(current_user.id, 'backup_restore_failed', 'database', None, 500,
                      metadata={'error': error, 'file': filename})
            return jsonify({'error': error}), 500
        
        log_action(current_user.id, 'backup_restore', 'database', None, 200,
                  metadata={'file': filename})
        
        return jsonify({
            'message': 'Database restored successfully',
            'file': filename
        }), 200
        
    except Exception as e:
        error_msg = f"Restore failed: {str(e)}"
        logger.error(error_msg)
        log_action(current_user.id, 'backup_restore_failed', 'database', None, 500,
                  metadata={'error': error_msg})
        return jsonify({'error': error_msg}), 500


@backup_bp.route('/info', methods=['GET'])
@token_required
def backup_info(current_user):
    """
    Get backup system information
    
    Returns:
        - 200: Backup system info
    """
    try:
        backup_manager = BackupManager()
        
        info = {
            'supported': backup_manager.is_postgres,
            'database_type': 'PostgreSQL' if backup_manager.is_postgres else 'SQLite',
            'database_name': backup_manager.db_name if backup_manager.is_postgres else 'marketplace.db',
            'backup_format': 'SQL (pg_dump)' if backup_manager.is_postgres else 'Not supported',
            'restore_format': 'SQL (psql)' if backup_manager.is_postgres else 'Not supported'
        }
        
        return jsonify(info), 200
        
    except Exception as e:
        error_msg = f"Failed to get backup info: {str(e)}"
        logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

