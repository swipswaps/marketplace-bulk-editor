"""
Admin routes for database maintenance
"""
from flask import Blueprint, jsonify
from sqlalchemy import text
from models.user import db
from models.listing import Listing
from utils.auth import token_required
from utils.audit import log_action

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/cleanup/duplicates', methods=['POST'])
@token_required
def cleanup_duplicates(current_user):
    """
    Remove duplicate listings for current user.
    Keeps the most recently updated version of each duplicate.
    
    Duplicates are identified by having the same:
    - user_id
    - title (case-insensitive)
    """
    try:
        # Find duplicates using SQL
        # Group by user_id and LOWER(title), keep only the newest (max updated_at)
        duplicate_query = text("""
            WITH ranked_listings AS (
                SELECT 
                    id,
                    user_id,
                    title,
                    updated_at,
                    ROW_NUMBER() OVER (
                        PARTITION BY user_id, LOWER(title) 
                        ORDER BY updated_at DESC, created_at DESC
                    ) as rn
                FROM listings
                WHERE user_id = :user_id
            )
            SELECT id
            FROM ranked_listings
            WHERE rn > 1
        """)
        
        result = db.session.execute(duplicate_query, {'user_id': str(current_user.id)})
        duplicate_ids = [row[0] for row in result]
        
        if not duplicate_ids:
            return jsonify({
                'message': 'No duplicate listings found',
                'removed': 0,
                'remaining': Listing.query.filter_by(user_id=current_user.id).count()
            }), 200
        
        # Delete duplicates
        removed_count = Listing.query.filter(
            Listing.id.in_(duplicate_ids)
        ).delete(synchronize_session=False)
        
        db.session.commit()
        
        remaining_count = Listing.query.filter_by(user_id=current_user.id).count()
        
        # Log the cleanup action
        log_action(
            current_user.id,
            'cleanup_duplicates',
            'listing',
            None,
            200,
            metadata={'removed': removed_count, 'remaining': remaining_count}
        )
        
        return jsonify({
            'message': f'Successfully removed {removed_count} duplicate listings',
            'removed': removed_count,
            'remaining': remaining_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Cleanup failed',
            'details': str(e)
        }), 500


@admin_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    """Get statistics about user's listings"""
    try:
        # Total listings
        total = Listing.query.filter_by(user_id=current_user.id).count()
        
        # Count potential duplicates (same title, case-insensitive)
        duplicate_query = text("""
            SELECT COUNT(*) - COUNT(DISTINCT LOWER(title)) as duplicates
            FROM listings
            WHERE user_id = :user_id
        """)
        
        result = db.session.execute(duplicate_query, {'user_id': str(current_user.id)})
        duplicates = result.scalar() or 0
        
        # Unique titles
        unique_titles = db.session.execute(text("""
            SELECT COUNT(DISTINCT LOWER(title))
            FROM listings
            WHERE user_id = :user_id
        """), {'user_id': str(current_user.id)}).scalar() or 0
        
        return jsonify({
            'total_listings': total,
            'unique_titles': unique_titles,
            'potential_duplicates': duplicates
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get stats',
            'details': str(e)
        }), 500

