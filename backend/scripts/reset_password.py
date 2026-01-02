#!/usr/bin/env python3
"""
Password reset utility for administrators
Usage: python reset_password.py <email> <new_password>
"""
import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.user import db, User


def reset_password(email, new_password):
    """Reset user password"""
    app = create_app()
    
    with app.app_context():
        # Normalize email
        email = User.normalize_email(email)
        
        # Find user
        user = User.query.filter(User.email == email).first()
        
        if not user:
            print(f"❌ Error: User with email '{email}' not found")
            return False
        
        # Validate password strength
        is_valid, error_msg = User.validate_password_strength(new_password)
        if not is_valid:
            print(f"❌ Error: {error_msg}")
            return False
        
        try:
            # Set new password
            user.set_password(new_password)
            
            # Reset failed login attempts and unlock account
            user.reset_failed_login()
            
            # Commit changes
            db.session.commit()
            
            print(f"✅ Password successfully reset for user: {user.email}")
            print(f"   User ID: {user.id}")
            print(f"   Name: {user.first_name} {user.last_name}")
            print(f"   Account unlocked: Yes")
            print(f"   Failed login attempts reset: Yes")
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error resetting password: {str(e)}")
            return False


def main():
    """Main entry point"""
    if len(sys.argv) != 3:
        print("Usage: python reset_password.py <email> <new_password>")
        print("\nPassword requirements:")
        print("  - At least 8 characters long")
        print("  - At least one uppercase letter")
        print("  - At least one lowercase letter")
        print("  - At least one digit")
        print("  - At least one special character (!@#$%^&*(),.?\":{}|<>)")
        sys.exit(1)
    
    email = sys.argv[1]
    new_password = sys.argv[2]
    
    success = reset_password(email, new_password)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

