"""
Analytics routes for data visualization and insights
"""
from flask import Blueprint, jsonify, request
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from models.user import db
from models.listing import Listing
from utils.auth import token_required
from utils.audit import log_action

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/summary', methods=['GET'])
@token_required
def get_summary(current_user):
    """
    Get summary statistics for user's listings
    
    Returns:
        - total_listings: Total number of listings
        - average_price: Average price across all listings
        - total_value: Sum of all listing prices
        - price_range: Min and max prices
        - condition_counts: Count by condition
        - category_counts: Count by category
        - shipping_counts: Count by shipping option
    """
    try:
        listings = Listing.query.filter_by(user_id=current_user.id).all()
        
        if not listings:
            return jsonify({
                'total_listings': 0,
                'average_price': 0,
                'total_value': 0,
                'price_range': {'min': 0, 'max': 0},
                'condition_counts': {},
                'category_counts': {},
                'shipping_counts': {}
            }), 200
        
        prices = [float(l.price) for l in listings if l.price]
        total_value = sum(prices)
        average_price = total_value / len(prices) if prices else 0
        
        # Count by condition
        condition_counts = db.session.query(
            Listing.condition,
            func.count(Listing.id)
        ).filter_by(user_id=current_user.id).group_by(Listing.condition).all()
        
        # Count by category
        category_counts = db.session.query(
            Listing.category,
            func.count(Listing.id)
        ).filter_by(user_id=current_user.id).group_by(Listing.category).all()
        
        # Count by shipping
        shipping_counts = db.session.query(
            Listing.offer_shipping,
            func.count(Listing.id)
        ).filter_by(user_id=current_user.id).group_by(Listing.offer_shipping).all()
        
        log_action(current_user.id, 'view_analytics_summary', 'analytics', None, 200)
        
        return jsonify({
            'total_listings': len(listings),
            'average_price': round(average_price, 2),
            'total_value': round(total_value, 2),
            'price_range': {
                'min': round(min(prices), 2) if prices else 0,
                'max': round(max(prices), 2) if prices else 0
            },
            'condition_counts': {cond: count for cond, count in condition_counts if cond},
            'category_counts': {cat: count for cat, count in category_counts if cat},
            'shipping_counts': {ship: count for ship, count in shipping_counts if ship}
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get summary', 'details': str(e)}), 500


@analytics_bp.route('/price-distribution', methods=['GET'])
@token_required
def get_price_distribution(current_user):
    """
    Get price distribution data for histogram visualization

    Query params:
        - bins: Number of bins (default: 10)

    Returns:
        - bins: Array of {min, max, count, percentage}
        - statistics: {mean, median, std_dev, quartiles}
    """
    try:
        bins_count = int(request.args.get('bins', 10))

        listings = Listing.query.filter_by(user_id=current_user.id).all()
        prices = sorted([float(l.price) for l in listings if l.price])

        if not prices:
            return jsonify({'bins': [], 'statistics': {}}), 200

        # Calculate bin edges
        min_price = min(prices)
        max_price = max(prices)
        bin_width = (max_price - min_price) / bins_count if bins_count > 0 else 1

        # Create bins
        bins = []
        for i in range(bins_count):
            bin_min = min_price + (i * bin_width)
            bin_max = min_price + ((i + 1) * bin_width)
            count = sum(1 for p in prices if bin_min <= p < bin_max or (i == bins_count - 1 and p == bin_max))
            bins.append({
                'min': round(bin_min, 2),
                'max': round(bin_max, 2),
                'count': count,
                'percentage': round((count / len(prices)) * 100, 2)
            })

        # Calculate statistics
        mean = sum(prices) / len(prices)
        median = prices[len(prices) // 2]

        log_action(current_user.id, 'view_price_distribution', 'analytics', None, 200)

        return jsonify({
            'bins': bins,
            'statistics': {
                'mean': round(mean, 2),
                'median': round(median, 2),
                'count': len(prices),
                'min': round(min_price, 2),
                'max': round(max_price, 2)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to get price distribution', 'details': str(e)}), 500


@analytics_bp.route('/time-series', methods=['GET'])
@token_required
def get_time_series(current_user):
    """
    Get time-series data for listings created over time

    Query params:
        - period: 'day', 'week', 'month' (default: 'day')
        - days: Number of days to look back (default: 30)

    Returns:
        - data: Array of {date, count, total_value}
        - period: The grouping period used
    """
    try:
        period = request.args.get('period', 'day')
        days_back = int(request.args.get('days', 30))

        # Limit days_back to prevent abuse
        days_back = min(days_back, 365)

        start_date = datetime.utcnow() - timedelta(days=days_back)

        # Query listings created since start_date
        listings = Listing.query.filter(
            Listing.user_id == current_user.id,
            Listing.created_at >= start_date
        ).order_by(Listing.created_at).all()

        if not listings:
            return jsonify({'data': [], 'period': period}), 200

        # Group by period
        time_series = {}
        for listing in listings:
            if period == 'day':
                key = listing.created_at.strftime('%Y-%m-%d')
            elif period == 'week':
                # ISO week format
                key = listing.created_at.strftime('%Y-W%U')
            elif period == 'month':
                key = listing.created_at.strftime('%Y-%m')
            else:
                key = listing.created_at.strftime('%Y-%m-%d')

            if key not in time_series:
                time_series[key] = {'count': 0, 'total_value': 0}

            time_series[key]['count'] += 1
            time_series[key]['total_value'] += float(listing.price or 0)

        # Convert to array and sort
        data = [
            {
                'date': date,
                'count': values['count'],
                'total_value': round(values['total_value'], 2)
            }
            for date, values in sorted(time_series.items())
        ]

        log_action(current_user.id, 'view_time_series', 'analytics', None, 200)

        return jsonify({
            'data': data,
            'period': period,
            'days_back': days_back
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to get time series', 'details': str(e)}), 500


@analytics_bp.route('/trends', methods=['GET'])
@token_required
def get_trends(current_user):
    """
    Get trend analysis for listings

    Returns:
        - top_categories: Most common categories
        - top_conditions: Most common conditions
        - price_trends: Price changes over time
        - recent_activity: Recent listing creation activity
    """
    try:
        # Top 10 categories
        top_categories = db.session.query(
            Listing.category,
            func.count(Listing.id).label('count'),
            func.avg(Listing.price).label('avg_price')
        ).filter_by(
            user_id=current_user.id
        ).group_by(
            Listing.category
        ).order_by(
            func.count(Listing.id).desc()
        ).limit(10).all()

        # Condition distribution
        top_conditions = db.session.query(
            Listing.condition,
            func.count(Listing.id).label('count'),
            func.avg(Listing.price).label('avg_price')
        ).filter_by(
            user_id=current_user.id
        ).group_by(
            Listing.condition
        ).order_by(
            func.count(Listing.id).desc()
        ).all()

        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = Listing.query.filter(
            Listing.user_id == current_user.id,
            Listing.created_at >= seven_days_ago
        ).count()

        log_action(current_user.id, 'view_trends', 'analytics', None, 200)

        return jsonify({
            'top_categories': [
                {
                    'category': cat,
                    'count': count,
                    'avg_price': round(float(avg_price or 0), 2)
                }
                for cat, count, avg_price in top_categories if cat
            ],
            'top_conditions': [
                {
                    'condition': cond,
                    'count': count,
                    'avg_price': round(float(avg_price or 0), 2)
                }
                for cond, count, avg_price in top_conditions if cond
            ],
            'recent_activity': {
                'last_7_days': recent_count
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to get trends', 'details': str(e)}), 500

