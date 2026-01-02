"""
User validation schemas
"""
from marshmallow import Schema, fields, validate, validates, ValidationError
import re


class UserSchema(Schema):
    """User serialization schema"""
    id = fields.Str(dump_only=True)
    email = fields.Email(required=True)
    first_name = fields.Str(allow_none=True)
    last_name = fields.Str(allow_none=True)
    is_active = fields.Bool(dump_only=True)
    is_admin = fields.Bool(dump_only=True)
    email_verified = fields.Bool(dump_only=True)
    last_login = fields.DateTime(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class RegisterSchema(Schema):
    """User registration schema"""
    email = fields.Email(required=True, validate=validate.Length(max=255))
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8, max=128))
    first_name = fields.Str(validate=validate.Length(max=100))
    last_name = fields.Str(validate=validate.Length(max=100))
    
    @validates('password')
    def validate_password(self, value):
        """Validate password strength"""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')


class LoginSchema(Schema):
    """User login schema"""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class PasswordResetSchema(Schema):
    """Password reset schema"""
    email = fields.Email(required=True)


class PasswordResetConfirmSchema(Schema):
    """Password reset confirmation schema"""
    token = fields.Str(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8, max=128))

    @validates('password')
    def validate_password(self, value):
        """Validate password strength"""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')


class ChangePasswordSchema(Schema):
    """Change password schema (requires current password)"""
    current_password = fields.Str(required=True, load_only=True)
    new_password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8, max=128))

    @validates('new_password')
    def validate_password(self, value):
        """Validate password strength"""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')


class UpdateProfileSchema(Schema):
    """Update user profile schema"""
    first_name = fields.Str(validate=validate.Length(max=100), allow_none=True)
    last_name = fields.Str(validate=validate.Length(max=100), allow_none=True)


class AdminUserSchema(Schema):
    """Admin user schema with sensitive fields"""
    id = fields.Str(dump_only=True)
    email = fields.Email(required=True)
    first_name = fields.Str(allow_none=True)
    last_name = fields.Str(allow_none=True)
    is_active = fields.Bool()
    is_admin = fields.Bool()
    email_verified = fields.Bool()
    failed_login_attempts = fields.Int(dump_only=True)
    locked_until = fields.DateTime(dump_only=True, allow_none=True)
    last_login = fields.DateTime(dump_only=True, allow_none=True)
    last_login_ip = fields.Str(dump_only=True, allow_none=True)
    password_changed_at = fields.DateTime(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class AdminCreateUserSchema(Schema):
    """Admin create user schema"""
    email = fields.Email(required=True, validate=validate.Length(max=255))
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8, max=128))
    first_name = fields.Str(validate=validate.Length(max=100), allow_none=True)
    last_name = fields.Str(validate=validate.Length(max=100), allow_none=True)
    is_admin = fields.Bool(missing=False)
    is_active = fields.Bool(missing=True)

    @validates('password')
    def validate_password(self, value):
        """Validate password strength"""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')


class AdminUpdateUserSchema(Schema):
    """Admin update user schema"""
    email = fields.Email(validate=validate.Length(max=255))
    first_name = fields.Str(validate=validate.Length(max=100), allow_none=True)
    last_name = fields.Str(validate=validate.Length(max=100), allow_none=True)
    is_admin = fields.Bool()
    is_active = fields.Bool()
    email_verified = fields.Bool()


class AdminResetPasswordSchema(Schema):
    """Admin reset user password schema"""
    new_password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8, max=128))

    @validates('new_password')
    def validate_password(self, value):
        """Validate password strength"""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')

