"""
API routes
"""
from .auth import auth_bp
from .listings import listings_bp
from .templates import templates_bp
from .ocr import ocr_bp
from .export import export_bp
from .admin import admin_bp
from .analytics import analytics_bp
from .audit import audit_bp

__all__ = [
    'auth_bp',
    'listings_bp',
    'templates_bp',
    'ocr_bp',
    'export_bp',
    'admin_bp',
    'analytics_bp',
    'audit_bp'
]

