"""
Listings routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from models.user import db
from models.listing import Listing
from schemas.listing_schema import (
    ListingSchema, ListingCreateSchema, ListingUpdateSchema,
    BulkListingCreateSchema, BulkListingDeleteSchema
)
from utils.auth import token_required
from utils.audit import log_action

listings_bp = Blueprint('listings', __name__)

listing_schema = ListingSchema()
listings_schema = ListingSchema(many=True)
listing_create_schema = ListingCreateSchema()
listing_update_schema = ListingUpdateSchema()
bulk_create_schema = BulkListingCreateSchema()
bulk_delete_schema = BulkListingDeleteSchema()


@listings_bp.route('', methods=['GET'])
@token_required
def get_listings(current_user):
    """Get all listings for current user"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    # Query listings
    pagination = Listing.query.filter_by(user_id=current_user.id).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'listings': listings_schema.dump(pagination.items),
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages
    }), 200


@listings_bp.route('/<listing_id>', methods=['GET'])
@token_required
def get_listing(current_user, listing_id):
    """Get listing by ID"""
    listing = Listing.query.filter_by(id=listing_id, user_id=current_user.id).first()
    
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404
    
    return jsonify(listing_schema.dump(listing)), 200


@listings_bp.route('', methods=['POST'])
@token_required
def create_listing(current_user):
    """Create new listing"""
    try:
        data = listing_create_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400
    
    # Create listing
    listing = Listing(
        user_id=current_user.id,
        title=data['title'],
        price=data['price'],
        condition=data['condition'],
        description=data.get('description'),
        category=data.get('category'),
        offer_shipping=data.get('offer_shipping', 'No'),
        source=data.get('source', 'manual'),
        ocr_scan_id=data.get('ocr_scan_id'),
        extra_data=data.get('extra_data')  # Fixed: was 'metadata' (Rule 16 - ORM reserved keyword)
    )
    
    try:
        db.session.add(listing)
        db.session.commit()
        
        log_action(current_user.id, 'create_listing', 'listing', listing.id, 201)
        
        return jsonify({
            'message': 'Listing created successfully',
            'listing': listing_schema.dump(listing)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create listing', 'details': str(e)}), 500


@listings_bp.route('/<listing_id>', methods=['PUT'])
@token_required
def update_listing(current_user, listing_id):
    """Update listing"""
    listing = Listing.query.filter_by(id=listing_id, user_id=current_user.id).first()
    
    if not listing:
        return jsonify({'error': 'Listing not found'}), 404
    
    try:
        data = listing_update_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400
    
    # Update fields
    for key, value in data.items():
        setattr(listing, key, value)
    
    try:
        db.session.commit()
        
        log_action(current_user.id, 'update_listing', 'listing', listing.id, 200)
        
        return jsonify({
            'message': 'Listing updated successfully',
            'listing': listing_schema.dump(listing)
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update listing', 'details': str(e)}), 500


@listings_bp.route('/<listing_id>', methods=['DELETE'])
@token_required
def delete_listing(current_user, listing_id):
    """Delete listing"""
    listing = Listing.query.filter_by(id=listing_id, user_id=current_user.id).first()

    if not listing:
        return jsonify({'error': 'Listing not found'}), 404

    try:
        db.session.delete(listing)
        db.session.commit()

        log_action(current_user.id, 'delete_listing', 'listing', listing_id, 200)

        return jsonify({'message': 'Listing deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete listing', 'details': str(e)}), 500


@listings_bp.route('/bulk', methods=['POST'])
@token_required
def bulk_create_listings(current_user):
    """Bulk create/update listings (upsert)"""
    try:
        data = bulk_create_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    created_listings = []
    updated_listings = []
    errors = []

    for idx, listing_data in enumerate(data['listings']):
        try:
            listing_id = listing_data.get('id')

            if listing_id:
                # Try to find existing listing (UPDATE)
                listing = Listing.query.filter_by(
                    id=listing_id,
                    user_id=current_user.id
                ).first()

                if listing:
                    # UPDATE existing listing
                    listing.title = listing_data['title']
                    listing.price = listing_data['price']
                    listing.condition = listing_data['condition']
                    listing.description = listing_data.get('description')
                    listing.category = listing_data.get('category')
                    listing.offer_shipping = listing_data.get('offer_shipping', 'No')
                    listing.source = listing_data.get('source', 'manual')
                    listing.ocr_scan_id = listing_data.get('ocr_scan_id')
                    listing.extra_data = listing_data.get('extra_data')
                    listing.updated_at = datetime.utcnow()
                    updated_listings.append(listing)
                else:
                    # CREATE new listing (ID provided but doesn't exist)
                    listing = Listing(
                        user_id=current_user.id,
                        title=listing_data['title'],
                        price=listing_data['price'],
                        condition=listing_data['condition'],
                        description=listing_data.get('description'),
                        category=listing_data.get('category'),
                        offer_shipping=listing_data.get('offer_shipping', 'No'),
                        source=listing_data.get('source', 'import'),
                        ocr_scan_id=listing_data.get('ocr_scan_id'),
                        extra_data=listing_data.get('extra_data')
                    )
                    db.session.add(listing)
                    created_listings.append(listing)
            else:
                # CREATE new listing (no ID provided)
                listing = Listing(
                    user_id=current_user.id,
                    title=listing_data['title'],
                    price=listing_data['price'],
                    condition=listing_data['condition'],
                    description=listing_data.get('description'),
                    category=listing_data.get('category'),
                    offer_shipping=listing_data.get('offer_shipping', 'No'),
                    source=listing_data.get('source', 'import'),
                    ocr_scan_id=listing_data.get('ocr_scan_id'),
                    extra_data=listing_data.get('extra_data')
                )
                db.session.add(listing)
                created_listings.append(listing)
        except Exception as e:
            errors.append({'index': idx, 'error': str(e)})

    try:
        db.session.commit()

        creates = len(created_listings)
        updates = len(updated_listings)

        log_action(current_user.id, 'bulk_upsert_listings', 'listing', None, 201,
                   metadata={'created': creates, 'updated': updates})

        all_listings = created_listings + updated_listings

        return jsonify({
            'message': f'{creates} listings created, {updates} listings updated',
            'listings': listings_schema.dump(all_listings),
            'errors': errors
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Bulk upsert failed', 'details': str(e)}), 500


@listings_bp.route('/bulk', methods=['DELETE'])
@token_required
def bulk_delete_listings(current_user):
    """Bulk delete listings"""
    try:
        data = bulk_delete_schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Validation failed', 'details': err.messages}), 400

    deleted_count = 0

    for listing_id in data['listing_ids']:
        listing = Listing.query.filter_by(id=listing_id, user_id=current_user.id).first()
        if listing:
            db.session.delete(listing)
            deleted_count += 1

    try:
        db.session.commit()

        log_action(current_user.id, 'bulk_delete_listings', 'listing', None, 200,
                   metadata={'count': deleted_count})

        return jsonify({
            'message': f'{deleted_count} listings deleted successfully',
            'deleted_count': deleted_count
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Bulk delete failed', 'details': str(e)}), 500

