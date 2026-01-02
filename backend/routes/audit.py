"""
Audit routes for viewing audit logs
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from models.user import db
from models.audit_log import AuditLog
from utils.auth import token_required

audit_bp = Blueprint('audit', __name__)


@audit_bp.route('/logs', methods=['GET'])
@token_required
def get_audit_logs(current_user):
    """
    Get audit logs for current user
    
    Query params:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 50, max: 100)
        - action: Filter by action type
        - date_from: Filter by start date (ISO format)
        - date_to: Filter by end date (ISO format)
        - resource_type: Filter by resource type
    
    Returns:
        - logs: Array of audit log entries
        - total: Total count
        - page: Current page
        - per_page: Items per page
        - pages: Total pages
    """
    try:
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        per_page = min(per_page, 100)  # Limit to prevent abuse
        
        # Build query
        query = AuditLog.query.filter_by(user_id=current_user.id)
        
        # Filter by action
        action = request.args.get('action')
        if action:
            query = query.filter_by(action=action)
        
        # Filter by resource type
        resource_type = request.args.get('resource_type')
        if resource_type:
            query = query.filter_by(resource_type=resource_type)
        
        # Filter by date range
        date_from = request.args.get('date_from')
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(AuditLog.created_at >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use ISO format.'}), 400
        
        date_to = request.args.get('date_to')
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(AuditLog.created_at <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use ISO format.'}), 400
        
        # Order by most recent first
        query = query.order_by(AuditLog.created_at.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Convert to dict
        logs = [log.to_dict() for log in pagination.items]
        
        return jsonify({
            'logs': logs,
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch audit logs', 'details': str(e)}), 500


@audit_bp.route('/logs/actions', methods=['GET'])
@token_required
def get_available_actions(current_user):
    """
    Get list of unique action types for current user
    
    Returns:
        - actions: Array of unique action types
    """
    try:
        actions = db.session.query(AuditLog.action).filter_by(
            user_id=current_user.id
        ).distinct().order_by(AuditLog.action).all()
        
        return jsonify({
            'actions': [action[0] for action in actions if action[0]]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch actions', 'details': str(e)}), 500


@audit_bp.route('/logs/stats', methods=['GET'])
@token_required
def get_audit_stats(current_user):
    """
    Get statistics about audit logs
    
    Returns:
        - total_logs: Total number of audit log entries
        - action_counts: Count by action type
        - recent_activity: Count of logs in last 24 hours
    """
    try:
        from sqlalchemy import func
        from datetime import timedelta
        
        # Total logs
        total_logs = AuditLog.query.filter_by(user_id=current_user.id).count()
        
        # Count by action
        action_counts = db.session.query(
            AuditLog.action,
            func.count(AuditLog.id).label('count')
        ).filter_by(
            user_id=current_user.id
        ).group_by(AuditLog.action).all()
        
        # Recent activity (last 24 hours)
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_count = AuditLog.query.filter(
            AuditLog.user_id == current_user.id,
            AuditLog.created_at >= yesterday
        ).count()
        
        return jsonify({
            'total_logs': total_logs,
            'action_counts': {action: count for action, count in action_counts if action},
            'recent_activity': recent_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch audit stats', 'details': str(e)}), 500

