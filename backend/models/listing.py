"""
Listing model for marketplace items
"""
import uuid
from datetime import datetime
from models.user import db


class Listing(db.Model):
    """Marketplace listing model"""
    
    __tablename__ = 'listings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Facebook Marketplace fields
    title = db.Column(db.String(150), nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=False)  # Max: 9,999,999,999.99 (9.9 billion)
    condition = db.Column(db.String(50), nullable=False)  # New, Used - Like New, Used - Good, Used - Fair
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    offer_shipping = db.Column(db.String(3), nullable=True)  # Yes, No
    
    # Metadata
    source = db.Column(db.String(50), nullable=True)  # manual, ocr, import
    ocr_scan_id = db.Column(db.String(36), db.ForeignKey('ocr_scans.id', ondelete='SET NULL'), nullable=True)
    extra_data = db.Column(db.JSON, nullable=True)  # Additional flexible data (renamed from metadata to avoid SQLAlchemy conflict)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert listing to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'price': float(self.price) if self.price else None,
            'condition': self.condition,
            'description': self.description,
            'category': self.category,
            'offer_shipping': self.offer_shipping,
            'source': self.source,
            'ocr_scan_id': self.ocr_scan_id,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def to_facebook_format(self):
        """Convert to Facebook Marketplace format"""
        return {
            'TITLE': self.title,
            'PRICE': float(self.price) if self.price else '',
            'CONDITION': self.condition,
            'DESCRIPTION': self.description or '',
            'CATEGORY': self.category or '',
            'OFFER SHIPPING': self.offer_shipping or 'No'
        }
    
    @staticmethod
    def validate_condition(condition):
        """Validate condition value"""
        valid_conditions = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair']
        return condition in valid_conditions
    
    @staticmethod
    def validate_shipping(shipping):
        """Validate shipping value"""
        return shipping in ['Yes', 'No']
    
    def __repr__(self):
        return f'<Listing {self.title[:30]}>'

