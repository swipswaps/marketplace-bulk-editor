"""
File history routes for tracking imports, exports, and OCR operations
"""
from flask import Blueprint, request, jsonify
from models.user import db
from models.file_history import FileHistory
from utils.auth import token_required
from utils.audit import log_action

file_history_bp = Blueprint('file_history', __name__)


@file_history_bp.route('', methods=['GET'])
@token_required
def get_file_history(current_user):
    """
    Get file history for current user
    
    Query params:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
        - file_type: Filter by file type (import, export, ocr, template)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    file_type = request.args.get('file_type', type=str)
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    # Build query
    query = FileHistory.query.filter_by(user_id=current_user.id)
    
    if file_type:
        query = query.filter_by(file_type=file_type)
    
    # Paginate
    pagination = query.order_by(FileHistory.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'file_history': [fh.to_dict() for fh in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page
    }), 200


@file_history_bp.route('/<file_history_id>', methods=['GET'])
@token_required
def get_file_history_by_id(current_user, file_history_id):
    """Get single file history record"""
    file_history = FileHistory.query.filter_by(
        id=file_history_id,
        user_id=current_user.id
    ).first()
    
    if not file_history:
        return jsonify({'error': 'File history not found'}), 404
    
    return jsonify(file_history.to_dict()), 200


@file_history_bp.route('', methods=['POST'])
@token_required
def create_file_history(current_user):
    """
    Create file history record
    
    Request body:
        - file_name: str (required)
        - file_type: str (required) - import, export, ocr, template
        - file_format: str (required) - xlsx, csv, json, txt, sql, image
        - file_size: int (optional)
        - row_count: int (optional)
        - operation: str (required) - upload, download, scan
        - status: str (required) - success, failed, processing
        - error_message: str (optional)
        - metadata: dict (optional)
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['file_name', 'file_type', 'file_format', 'operation', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create file history record
    file_history = FileHistory(
        user_id=current_user.id,
        file_name=data['file_name'],
        file_type=data['file_type'],
        file_format=data['file_format'],
        file_size=data.get('file_size'),
        row_count=data.get('row_count'),
        operation=data['operation'],
        status=data['status'],
        error_message=data.get('error_message'),
        extra_data=data.get('metadata')
    )
    
    db.session.add(file_history)
    db.session.commit()
    
    # Log action
    log_action(
        current_user.id,
        'file_history_create',
        'file_history',
        file_history.id,
        201,
        metadata={'file_name': file_history.file_name, 'file_type': file_history.file_type}
    )
    
    return jsonify(file_history.to_dict()), 201


@file_history_bp.route('/<file_history_id>', methods=['PUT'])
@token_required
def update_file_history(current_user, file_history_id):
    """Update file history record (e.g., update status after processing)"""
    file_history = FileHistory.query.filter_by(
        id=file_history_id,
        user_id=current_user.id
    ).first()
    
    if not file_history:
        return jsonify({'error': 'File history not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['status', 'error_message', 'metadata', 'row_count', 'file_size']
    for field in allowed_fields:
        if field in data:
            setattr(file_history, field, data[field])
    
    db.session.commit()
    
    return jsonify(file_history.to_dict()), 200


@file_history_bp.route('/<file_history_id>', methods=['DELETE'])
@token_required
def delete_file_history(current_user, file_history_id):
    """Delete file history record"""
    file_history = FileHistory.query.filter_by(
        id=file_history_id,
        user_id=current_user.id
    ).first()
    
    if not file_history:
        return jsonify({'error': 'File history not found'}), 404
    
    db.session.delete(file_history)
    db.session.commit()
    
    return jsonify({'message': 'File history deleted'}), 200

