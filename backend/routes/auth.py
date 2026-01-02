"""
Authentication routes with enhanced security
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from models.user import db, User
from schemas.user_schema import (
    RegisterSchema, LoginSchema, UserSchema,
    ChangePasswordSchema, UpdateProfileSchema,
    PasswordResetSchema, PasswordResetConfirmSchema
)
from utils.auth import generate_access_token, generate_refresh_token, verify_token, token_required
from utils.audit import log_action
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

register_schema = RegisterSchema()
login_schema = LoginSchema()
user_schema = UserSchema()


def get_client_ip():
    """Get client IP address from request (handles proxies)"""
    # Check X-Forwarded-For header (for proxies/load balancers)
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    # Check X-Real-IP header (nginx)
    if request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    # Fallback to remote_addr
    return request.remote_addr or 'unknown'


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user with enhanced validation"""
    try:
        # Validate input schema
        data = register_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"Registration validation failed: {err.messages}")
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    # Normalize and validate email
    email = User.normalize_email(data['email'])
    if not User.validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    # Check if user exists (case-insensitive email check)
    existing_user = User.query.filter(User.email == email).first()
    if existing_user:
        logger.warning(f"Registration attempt with existing email: {email}")
        return jsonify({'error': 'Email already registered'}), 409

    # Validate password strength
    is_valid, error_msg = User.validate_password_strength(data['password'])
    if not is_valid:
        return jsonify({'error': error_msg}), 400

    # Create user
    user = User(
        email=email,  # Store normalized (lowercase) email
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )

    try:
        user.set_password(data['password'])
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    # Set initial login info
    user.last_login_ip = get_client_ip()

    try:
        db.session.add(user)
        db.session.commit()

        logger.info(f"New user registered: {email} (ID: {user.id})")

        # Log action
        log_action(user.id, 'register', 'user', user.id, 201)

        # Generate tokens
        access_token = generate_access_token(user.id)
        refresh_token = generate_refresh_token(user.id)

        return jsonify({
            'message': 'User registered successfully',
            'user': user_schema.dump(user),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration failed for {email}: {str(e)}")
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with enhanced security checks"""
    try:
        # Validate input schema
        data = login_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"Login validation failed: {err.messages}")
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    # Normalize email for lookup
    email = User.normalize_email(data['email'])
    client_ip = get_client_ip()

    # Find user (case-insensitive email lookup using normalized email)
    user = User.query.filter(User.email == email).first()

    # Use constant-time comparison to prevent user enumeration timing attacks
    if not user:
        logger.warning(f"Login attempt for non-existent user: {email} from IP: {client_ip}")
        # Return same error as invalid password to prevent user enumeration
        return jsonify({'error': 'Invalid credentials'}), 401

    # Check if account is locked
    if user.is_locked():
        remaining = (user.locked_until - datetime.utcnow()).total_seconds() / 60
        logger.warning(f"Login attempt for locked account: {email} from IP: {client_ip}")
        return jsonify({
            'error': f'Account is locked due to multiple failed login attempts. Try again in {int(remaining)} minutes.'
        }), 403

    # Check if user is active
    if not user.is_active:
        logger.warning(f"Login attempt for inactive account: {email} from IP: {client_ip}")
        return jsonify({'error': 'Account is inactive. Please contact support.'}), 403

    # Check password
    if not user.check_password(data['password']):
        logger.warning(f"Failed login attempt for {email} from IP: {client_ip} (attempt #{user.failed_login_attempts + 1})")

        # Increment failed login attempts and potentially lock account
        user.increment_failed_login()
        db.session.commit()

        log_action(user.id, 'login_failed', 'user', user.id, 401)

        # Inform user about remaining attempts before lockout
        remaining_attempts = 5 - user.failed_login_attempts
        if remaining_attempts > 0:
            return jsonify({
                'error': 'Invalid credentials',
                'remaining_attempts': remaining_attempts
            }), 401
        else:
            return jsonify({
                'error': 'Account locked due to multiple failed login attempts. Try again in 30 minutes.'
            }), 403

    # Successful login - reset failed attempts
    user.reset_failed_login()
    user.last_login = datetime.utcnow()
    user.last_login_ip = client_ip
    db.session.commit()

    logger.info(f"Successful login for {email} from IP: {client_ip}")

    # Log action
    log_action(user.id, 'login', 'user', user.id, 200)

    # Generate tokens
    access_token = generate_access_token(user.id)
    refresh_token = generate_refresh_token(user.id)

    return jsonify({
        'message': 'Login successful',
        'user': user_schema.dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token with security checks"""
    refresh_token = request.json.get('refresh_token')
    client_ip = get_client_ip()

    if not refresh_token:
        logger.warning(f"Refresh token missing from IP: {client_ip}")
        return jsonify({'error': 'Refresh token is missing'}), 401

    # Verify refresh token
    payload = verify_token(refresh_token, 'refresh')
    if not payload:
        logger.warning(f"Invalid refresh token from IP: {client_ip}")
        return jsonify({'error': 'Invalid or expired refresh token'}), 401

    # Get user
    user = User.query.get(payload['user_id'])
    if not user:
        logger.warning(f"Refresh token for non-existent user ID: {payload['user_id']} from IP: {client_ip}")
        return jsonify({'error': 'User not found'}), 401

    if not user.is_active:
        logger.warning(f"Refresh token for inactive user: {user.email} from IP: {client_ip}")
        return jsonify({'error': 'Account is inactive'}), 403

    # Check if account is locked
    if user.is_locked():
        logger.warning(f"Refresh token for locked account: {user.email} from IP: {client_ip}")
        return jsonify({'error': 'Account is locked'}), 403

    # Generate new access token
    access_token = generate_access_token(user.id)

    logger.info(f"Access token refreshed for {user.email} from IP: {client_ip}")

    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user"""
    # Log action
    log_action(current_user.id, 'logout', 'user', current_user.id, 200)
    
    # Note: With JWT, logout is handled client-side by removing tokens
    # For server-side logout, implement token blacklist with Redis
    
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user info"""
    return jsonify(user_schema.dump(current_user)), 200


@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password (requires current password)"""
    change_password_schema = ChangePasswordSchema()
    client_ip = get_client_ip()

    try:
        data = change_password_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"Password change validation failed for {current_user.email}: {err.messages}")
        return jsonify({'error': err.messages}), 400

    # Verify current password
    if not current_user.check_password(data['current_password']):
        logger.warning(f"Failed password change attempt for {current_user.email} from IP: {client_ip} (incorrect current password)")
        log_action(current_user.id, 'password_change_failed', 'user', current_user.id, 401)
        return jsonify({'error': 'Current password is incorrect'}), 401

    # Check if new password is same as current
    if current_user.check_password(data['new_password']):
        return jsonify({'error': 'New password must be different from current password'}), 400

    # Set new password
    try:
        current_user.set_password(data['new_password'])
        db.session.commit()

        logger.info(f"Password changed successfully for {current_user.email} from IP: {client_ip}")
        log_action(current_user.id, 'password_changed', 'user', current_user.id, 200)

        return jsonify({'message': 'Password changed successfully'}), 200
    except ValueError as e:
        logger.warning(f"Password change failed for {current_user.email}: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error changing password for {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile (name only)"""
    update_profile_schema = UpdateProfileSchema()
    client_ip = get_client_ip()

    try:
        data = update_profile_schema.load(request.json)
    except ValidationError as err:
        logger.warning(f"Profile update validation failed for {current_user.email}: {err.messages}")
        return jsonify({'error': err.messages}), 400

    # Update fields
    if 'first_name' in data:
        current_user.first_name = data['first_name']
    if 'last_name' in data:
        current_user.last_name = data['last_name']

    try:
        db.session.commit()

        logger.info(f"Profile updated for {current_user.email} from IP: {client_ip}")
        log_action(current_user.id, 'profile_updated', 'user', current_user.id, 200)

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_schema.dump(current_user)
        }), 200
    except Exception as e:
        logger.error(f"Error updating profile for {current_user.email}: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500

