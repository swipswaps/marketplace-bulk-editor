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
from models import User, Listing, Template, OCRScan, AuditLog

# Import blueprints
from routes.auth import auth_bp
from routes.listings import listings_bp
from routes.templates import templates_bp
from routes.ocr import ocr_bp
from routes.export import export_bp
from routes.admin import admin_bp


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
    
    # Create upload folder
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(listings_bp, url_prefix='/api/listings')
    app.register_blueprint(templates_bp, url_prefix='/api/templates')
    app.register_blueprint(ocr_bp, url_prefix='/api/ocr')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
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
                'admin': '/api/admin'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
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

