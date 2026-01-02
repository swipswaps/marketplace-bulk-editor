"""
OCR Scan model for tracking OCR processing
"""
import uuid
from datetime import datetime
from models.user import db


class OCRScan(db.Model):
    """OCR scan model for tracking image/PDF processing"""
    
    __tablename__ = 'ocr_scans'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # File information
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    file_type = db.Column(db.String(50), nullable=True)
    thumbnail_path = db.Column(db.String(500), nullable=True)  # Preview image path

    # OCR processing
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, processing, completed, failed
    ocr_engine = db.Column(db.String(20), nullable=True)  # paddleocr, tesseract, both
    ocr_text = db.Column(db.Text, nullable=True)
    extracted_data = db.Column(db.JSON, nullable=True)  # Parsed product data
    error_message = db.Column(db.Text, nullable=True)

    # Processing metadata
    processing_time = db.Column(db.Float, nullable=True)  # seconds
    items_extracted = db.Column(db.Integer, default=0, nullable=False)
    confidence_score = db.Column(db.Float, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    listings = db.relationship('Listing', backref='ocr_scan', lazy='dynamic')
    
    def to_dict(self):
        """Convert OCR scan to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'filename': self.filename,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'thumbnail_path': self.thumbnail_path,
            'status': self.status,
            'ocr_engine': self.ocr_engine,
            'ocr_text': self.ocr_text,
            'extracted_data': self.extracted_data,
            'error_message': self.error_message,
            'processing_time': self.processing_time,
            'items_extracted': self.items_extracted,
            'confidence_score': self.confidence_score,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }
    
    def __repr__(self):
        return f'<OCRScan {self.filename} - {self.status}>'

