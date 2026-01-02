"""
File history model for tracking imports, exports, and OCR operations
"""
import uuid
from datetime import datetime
from models.user import db


class FileHistory(db.Model):
    """File history model"""
    
    __tablename__ = 'file_history'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # File information
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # import, export, ocr, template
    file_format = db.Column(db.String(20), nullable=False)  # xlsx, csv, json, txt, sql, image
    file_size = db.Column(db.Integer, nullable=True)  # bytes
    row_count = db.Column(db.Integer, nullable=True)  # number of listings
    
    # Operation details
    operation = db.Column(db.String(50), nullable=False)  # upload, download, scan
    status = db.Column(db.String(20), nullable=False)  # success, failed, processing
    error_message = db.Column(db.Text, nullable=True)
    
    # Additional data (renamed from metadata to avoid SQLAlchemy reserved word)
    extra_data = db.Column('metadata', db.JSON, nullable=True)  # template info, OCR results, etc.
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert file history to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'file_format': self.file_format,
            'file_size': self.file_size,
            'row_count': self.row_count,
            'operation': self.operation,
            'status': self.status,
            'error_message': self.error_message,
            'metadata': self.extra_data,  # Map extra_data back to metadata for API
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def log_import(user_id, file_name, file_format, file_size, row_count, status='success', error_message=None, metadata=None):
        """Log file import operation"""
        file_history = FileHistory(
            user_id=user_id,
            file_name=file_name,
            file_type='import',
            file_format=file_format,
            file_size=file_size,
            row_count=row_count,
            operation='upload',
            status=status,
            error_message=error_message,
            extra_data=metadata
        )
        db.session.add(file_history)
        db.session.commit()
        return file_history
    
    @staticmethod
    def log_export(user_id, file_name, file_format, row_count, status='success', error_message=None, metadata=None):
        """Log file export operation"""
        file_history = FileHistory(
            user_id=user_id,
            file_name=file_name,
            file_type='export',
            file_format=file_format,
            file_size=None,  # Will be set after file is generated
            row_count=row_count,
            operation='download',
            status=status,
            error_message=error_message,
            extra_data=metadata
        )
        db.session.add(file_history)
        db.session.commit()
        return file_history
    
    @staticmethod
    def log_ocr(user_id, file_name, file_format, file_size, status='success', error_message=None, metadata=None):
        """Log OCR operation"""
        file_history = FileHistory(
            user_id=user_id,
            file_name=file_name,
            file_type='ocr',
            file_format=file_format,
            file_size=file_size,
            row_count=None,  # Will be set after OCR processing
            operation='scan',
            status=status,
            error_message=error_message,
            extra_data=metadata
        )
        db.session.add(file_history)
        db.session.commit()
        return file_history
    
    def __repr__(self):
        return f'<FileHistory {self.file_name} ({self.file_type})>'

