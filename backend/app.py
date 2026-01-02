"""
Main Flask application
"""
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import get_config
from models.user import db
from models import User, Listing, Template, OCRScan, AuditLog, FileHistory

# Import blueprints
from routes.auth import auth_bp
from routes.listings import listings_bp
from routes.templates import templates_bp
from routes.ocr import ocr_bp
from routes.export import export_bp
from routes.admin import admin_bp
from routes.analytics import analytics_bp
from routes.audit import audit_bp
from routes.backup import backup_bp
from routes.users import users_bp
from routes.system import system_bp
from routes.file_history import file_history_bp


def create_app(config_name=None):
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    app.config.from_object(get_config())
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # CORS configuration
    CORS(app, 
         origins=app.config['ALLOWED_ORIGINS'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    
    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        storage_uri=app.config['RATE_LIMIT_STORAGE'] if app.config['RATE_LIMIT_ENABLED'] else None,
        default_limits=[app.config['RATE_LIMIT_DEFAULT']]
    )
    
    # Logging configuration
    logging.basicConfig(
        level=getattr(logging, app.config['LOG_LEVEL']),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(app.config['LOG_FILE']),
            logging.StreamHandler()
        ]
    )

    # Self-healing: Request logging middleware
    @app.before_request
    def log_request_info():
        """Log all incoming requests for debugging"""
        from flask import request
        app.logger.debug(f'📥 {request.method} {request.path} from {request.remote_addr}')
        if request.method in ['POST', 'PUT', 'PATCH']:
            # Log request body for debugging (be careful with sensitive data)
            if request.is_json:
                app.logger.debug(f'📦 Request body keys: {list(request.json.keys()) if request.json else "empty"}')

    @app.after_request
    def log_response_info(response):
        """Log all outgoing responses for debugging"""
        from flask import request
        app.logger.debug(f'📤 {request.method} {request.path} → {response.status_code}')
        return response
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(listings_bp, url_prefix='/api/listings')
    app.register_blueprint(templates_bp, url_prefix='/api/templates')
    app.register_blueprint(ocr_bp, url_prefix='/api/ocr')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    app.register_blueprint(backup_bp, url_prefix='/api/backup')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(file_history_bp, url_prefix='/api/file-history')
    app.register_blueprint(system_bp)  # No url_prefix, already has /api/system in blueprint
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'environment': app.config['FLASK_ENV']
        }), 200
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def index():
        """Root endpoint"""
        return jsonify({
            'message': 'Marketplace Bulk Editor API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'auth': '/api/auth',
                'listings': '/api/listings',
                'templates': '/api/templates',
                'ocr': '/api/ocr',
                'export': '/api/export',
                'admin': '/api/admin',
                'backup': '/api/backup',
                'users': '/api/users'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        # Self-healing: Log 404 errors with diagnostic information
        from flask import request
        app.logger.error('=' * 80)
        app.logger.error('🚨 SELF-HEALING DIAGNOSTIC: 404 Not Found')
        app.logger.error(f'❌ Path: {request.method} {request.path}')
        app.logger.error(f'❌ Full URL: {request.url}')
        app.logger.error(f'❌ Origin: {request.headers.get("Origin", "N/A")}')
        app.logger.error(f'❌ Referer: {request.headers.get("Referer", "N/A")}')

        # Check for common mistakes
        if not request.path.startswith('/api/') and any(request.path.startswith(p) for p in ['/auth/', '/users/', '/listings/', '/templates/']):
            app.logger.error('🔍 DIAGNOSIS: Missing /api prefix!')
            app.logger.error(f'✅ Correct path should be: /api{request.path}')
            app.logger.error('📍 Check frontend API call - add /api prefix to endpoint')

        if request.path.startswith('/api/api/'):
            app.logger.error('🔍 DIAGNOSIS: Double /api prefix!')
            app.logger.error(f'✅ Correct path should be: {request.path.replace("/api/api/", "/api/")}')

        app.logger.error('=' * 80)
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Internal error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(429)
    def ratelimit_handler(error):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    # Database initialization
    with app.app_context():
        db.create_all()
    
    return app


# Create app instance
app = create_app()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

