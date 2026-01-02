"""
System management routes
Handles system-level operations like starting/stopping services
"""

from flask import Blueprint, jsonify, current_app
import subprocess
import os

system_bp = Blueprint('system', __name__, url_prefix='/api/system')

@system_bp.route('/start-scraper', methods=['POST'])
def start_scraper():
    """
    Auto-start the scraper backend

    This is called by the frontend when the scraper backend is not responding.
    It attempts to start the backend-scraper service automatically.
    """
    try:
        # Path to scraper backend
        scraper_dir = '/workspace/backend-scraper'

        # Check if directory exists
        if not os.path.exists(scraper_dir):
            return jsonify({
                'success': False,
                'error': f'Scraper directory not found: {scraper_dir}'
            }), 404

        # Check if package.json exists
        package_json = os.path.join(scraper_dir, 'package.json')
        if not os.path.exists(package_json):
            return jsonify({
                'success': False,
                'error': f'package.json not found in {scraper_dir}'
            }), 404

        # Check if node_modules exists
        node_modules = os.path.join(scraper_dir, 'node_modules')
        if not os.path.exists(node_modules):
            return jsonify({
                'success': False,
                'error': 'Dependencies not installed. Run: cd backend-scraper && npm install'
            }), 400

        # Start node server in background using shell command
        # Use nohup to detach from parent process
        # Use 'node server.js' directly instead of 'npm start' to avoid PATH issues
        log_file = os.path.join(scraper_dir, 'scraper.log')

        # Find node executable
        node_path = subprocess.run(
            'which node',
            shell=True,
            capture_output=True,
            text=True,
            timeout=2
        ).stdout.strip()

        if not node_path:
            return jsonify({
                'success': False,
                'error': 'Node.js not found in PATH. Please install Node.js.'
            }), 500

        cmd = f'cd {scraper_dir} && nohup {node_path} server.js > {log_file} 2>&1 &'

        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return jsonify({
                'success': False,
                'error': f'Failed to start scraper: {result.stderr or result.stdout}'
            }), 500

        return jsonify({
            'success': True,
            'message': 'Scraper backend starting... Check backend-scraper/scraper.log for details'
        })

    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'error': 'Start command timed out after 5 seconds'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }), 500

@system_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy'
    })

