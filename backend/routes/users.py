"""
Admin user management routes
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from sqlalchemy import or_
from models.user import db, User
from schemas.user_schema import (
    AdminUserSchema, AdminCreateUserSchema, 
    AdminUpdateUserSchema, AdminResetPasswordSchema
)
from utils.auth import token_required, admin_required
from utils.audit import log_action
import logging

users_bp = Blueprint('users', __name__)
logger = logging.getLogger(__name__)

admin_user_schema = AdminUserSchema()
admin_users_schema = AdminUserSchema(many=True)
admin_create_user_schema = AdminCreateUserSchema()
admin_update_user_schema = AdminUpdateUserSchema()
admin_reset_password_schema = AdminResetPasswordSchema()


def get_client_ip():
    """Get client IP address from request"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr


@users_bp.route('', methods=['GET'])
@token_required
@admin_required
def list_users(current_user):
    """
    List all users (admin only)
    
    Query params:
        - page: Page number (default: 1)
        - per_page: Items per page (default: 20, max: 100)
        - search: Search by email, first_name, or last_name
        - is_active: Filter by active status (true/false)
        - is_admin: Filter by admin status (true/false)
        - sort_by: Sort field (email, created_at, last_login) (default: created_at)
        - sort_order: Sort order (asc/desc) (default: desc)
    """
    try:
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        # Search
        search = request.args.get('search', '').strip()
        
        # Filters
        is_active = request.args.get('is_active', type=str)
        is_admin = request.args.get('is_admin', type=str)
        
        # Sorting
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = User.query
        
        # Apply search
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                or_(
                    User.email.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern)
                )
            )
        
        # Apply filters
        if is_active is not None:
            query = query.filter(User.is_active == (is_active.lower() == 'true'))
        
        if is_admin is not None:
            query = query.filter(User.is_admin == (is_admin.lower() == 'true'))
        
        # Apply sorting
        if sort_by == 'email':
            sort_column = User.email
        elif sort_by == 'last_login':
            sort_column = User.last_login
        else:
            sort_column = User.created_at
        
        if sort_order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'users': admin_users_schema.dump(pagination.items),
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Error listing users: {str(e)}")
        return jsonify({'error': 'Failed to list users'}), 500


@users_bp.route('', methods=['POST'])
@token_required
@admin_required
def create_user(current_user):
    """Create new user (admin only)"""
    client_ip = get_client_ip()
    
    try:
        data = admin_create_user_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"User creation validation failed by admin {current_user.email}: {err.messages}")
        return jsonify({'error': err.messages}), 400
    
    # Normalize email
    email = User.normalize_email(data['email'])
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        logger.warning(f"Admin {current_user.email} attempted to create duplicate user: {email}")
        return jsonify({'error': 'User with this email already exists'}), 409
    
    # Create user
    try:
        user = User(
            email=email,
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            is_admin=data.get('is_admin', False),
            is_active=data.get('is_active', True),
            email_verified=True  # Admin-created users are auto-verified
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        logger.info(f"Admin {current_user.email} created user {email} from IP: {client_ip}")
        log_action(current_user.id, 'user_created', 'user', user.id, 201, {
            'created_user_email': email,
            'is_admin': user.is_admin
        })

        return jsonify({
            'message': 'User created successfully',
            'user': admin_user_schema.dump(user)
        }), 201

    except ValueError as e:
        logger.warning(f"User creation failed by admin {current_user.email}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating user by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500


@users_bp.route('/<user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(current_user, user_id):
    """Get user details (admin only)"""
    user = User.query.get(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(admin_user_schema.dump(user)), 200


@users_bp.route('/<user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update user (admin only)"""
    client_ip = get_client_ip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        data = admin_update_user_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"User update validation failed by admin {current_user.email}: {err.messages}")
        return jsonify({'error': err.messages}), 400

    # Prevent admin from demoting themselves
    if user.id == current_user.id and 'is_admin' in data and not data['is_admin']:
        return jsonify({'error': 'Cannot remove your own admin privileges'}), 403

    # Prevent admin from deactivating themselves
    if user.id == current_user.id and 'is_active' in data and not data['is_active']:
        return jsonify({'error': 'Cannot deactivate your own account'}), 403

    # Update fields
    changes = {}
    if 'email' in data:
        new_email = User.normalize_email(data['email'])
        if new_email != user.email:
            # Check if new email already exists
            if User.query.filter_by(email=new_email).first():
                return jsonify({'error': 'User with this email already exists'}), 409
            changes['email'] = {'old': user.email, 'new': new_email}
            user.email = new_email

    if 'first_name' in data:
        changes['first_name'] = {'old': user.first_name, 'new': data['first_name']}
        user.first_name = data['first_name']

    if 'last_name' in data:
        changes['last_name'] = {'old': user.last_name, 'new': data['last_name']}
        user.last_name = data['last_name']

    if 'is_admin' in data:
        changes['is_admin'] = {'old': user.is_admin, 'new': data['is_admin']}
        user.is_admin = data['is_admin']

    if 'is_active' in data:
        changes['is_active'] = {'old': user.is_active, 'new': data['is_active']}
        user.is_active = data['is_active']

    if 'email_verified' in data:
        changes['email_verified'] = {'old': user.email_verified, 'new': data['email_verified']}
        user.email_verified = data['email_verified']

    try:
        db.session.commit()

        logger.info(f"Admin {current_user.email} updated user {user.email} from IP: {client_ip}")
        log_action(current_user.id, 'user_updated', 'user', user.id, 200, {
            'updated_user_email': user.email,
            'changes': changes
        })

        return jsonify({
            'message': 'User updated successfully',
            'user': admin_user_schema.dump(user)
        }), 200

    except Exception as e:
        logger.error(f"Error updating user {user.email} by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user'}), 500


@users_bp.route('/<user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Delete user (admin only)"""
    client_ip = get_client_ip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 403

    try:
        user_email = user.email
        db.session.delete(user)
        db.session.commit()

        logger.info(f"Admin {current_user.email} deleted user {user_email} from IP: {client_ip}")
        log_action(current_user.id, 'user_deleted', 'user', user_id, 200, {
            'deleted_user_email': user_email
        })

        return jsonify({'message': 'User deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Error deleting user {user.email} by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user'}), 500


@users_bp.route('/<user_id>/toggle-admin', methods=['POST'])
@token_required
@admin_required
def toggle_admin(current_user, user_id):
    """Toggle admin status (admin only)"""
    client_ip = get_client_ip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Prevent admin from demoting themselves
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot modify your own admin privileges'}), 403

    try:
        old_status = user.is_admin
        user.is_admin = not user.is_admin
        db.session.commit()

        action = 'granted' if user.is_admin else 'revoked'
        logger.info(f"Admin {current_user.email} {action} admin privileges for {user.email} from IP: {client_ip}")
        log_action(current_user.id, f'admin_{action}', 'user', user.id, 200, {
            'target_user_email': user.email,
            'old_status': old_status,
            'new_status': user.is_admin
        })

        return jsonify({
            'message': f'Admin privileges {action} successfully',
            'user': admin_user_schema.dump(user)
        }), 200

    except Exception as e:
        logger.error(f"Error toggling admin for {user.email} by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle admin status'}), 500


@users_bp.route('/<user_id>/toggle-active', methods=['POST'])
@token_required
@admin_required
def toggle_active(current_user, user_id):
    """Toggle active status (admin only)"""
    client_ip = get_client_ip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Prevent admin from deactivating themselves
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot modify your own active status'}), 403

    try:
        old_status = user.is_active
        user.is_active = not user.is_active
        db.session.commit()

        action = 'activated' if user.is_active else 'deactivated'
        logger.info(f"Admin {current_user.email} {action} user {user.email} from IP: {client_ip}")
        log_action(current_user.id, f'user_{action}', 'user', user.id, 200, {
            'target_user_email': user.email,
            'old_status': old_status,
            'new_status': user.is_active
        })

        return jsonify({
            'message': f'User {action} successfully',
            'user': admin_user_schema.dump(user)
        }), 200

    except Exception as e:
        logger.error(f"Error toggling active status for {user.email} by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to toggle active status'}), 500


@users_bp.route('/<user_id>/unlock', methods=['POST'])
@token_required
@admin_required
def unlock_account(current_user, user_id):
    """Unlock user account (admin only)"""
    client_ip = get_client_ip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        user.reset_failed_login()
        db.session.commit()

        logger.info(f"Admin {current_user.email} unlocked account for {user.email} from IP: {client_ip}")
        log_action(current_user.id, 'account_unlocked', 'user', user.id, 200, {
            'target_user_email': user.email
        })

        return jsonify({
            'message': 'Account unlocked successfully',
            'user': admin_user_schema.dump(user)
        }), 200

    except Exception as e:
        logger.error(f"Error unlocking account for {user.email} by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to unlock account'}), 500


@users_bp.route('/<user_id>/reset-password', methods=['POST'])
@token_required
@admin_required
def admin_reset_password(current_user, user_id):
    """Reset user password (admin only)"""
    client_ip = get_client_ip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        data = admin_reset_password_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"Password reset validation failed by admin {current_user.email}: {err.messages}")
        return jsonify({'error': err.messages}), 400

    try:
        user.set_password(data['new_password'])
        user.reset_failed_login()  # Also unlock account
        db.session.commit()

        logger.info(f"Admin {current_user.email} reset password for {user.email} from IP: {client_ip}")
        log_action(current_user.id, 'password_reset_by_admin', 'user', user.id, 200, {
            'target_user_email': user.email
        })

        return jsonify({
            'message': 'Password reset successfully',
            'user': admin_user_schema.dump(user)
        }), 200

    except ValueError as e:
        logger.warning(f"Password reset failed by admin {current_user.email}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error resetting password for {user.email} by admin {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500

