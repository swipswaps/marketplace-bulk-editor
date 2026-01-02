# Security Features

This document outlines the security features implemented in the Marketplace Bulk Editor authentication system.

## Authentication Security

### Password Requirements

All passwords must meet the following criteria:
- **Minimum length**: 8 characters
- **Maximum length**: 128 characters
- **Complexity requirements**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one digit (0-9)
  - At least one special character (!@#$%^&*(),.?":{}|<>)

### Password Hashing

- **Algorithm**: scrypt (OWASP recommended)
- **Parameters**: N=32768, r=8, p=1
- **Salt**: Automatically generated per password
- **Timing attack protection**: Constant-time comparison

### Account Lockout

- **Failed attempts threshold**: 5 consecutive failed login attempts
- **Lockout duration**: 30 minutes
- **Auto-unlock**: Account automatically unlocks after lockout period
- **Manual unlock**: Administrators can reset failed attempts using the password reset utility

### Email Handling

- **Case-insensitive**: Emails are normalized to lowercase for storage and lookup
- **Validation**: RFC 5322 compliant email format validation
- **Uniqueness**: Enforced at database level with unique constraint

### Session Management

- **Access token lifetime**: 15 minutes
- **Refresh token lifetime**: 7 days
- **Token type**: JWT (JSON Web Tokens)
- **Token validation**: Signature verification, expiration check, type check
- **Automatic refresh**: Frontend automatically refreshes expired access tokens

### IP Tracking

- **Last login IP**: Stored for audit purposes
- **Proxy support**: Handles X-Forwarded-For and X-Real-IP headers
- **IPv6 support**: Supports both IPv4 and IPv6 addresses

### Logging

All authentication events are logged:
- ✅ Successful login (with IP address)
- ❌ Failed login attempts (with IP address and attempt number)
- 🔒 Account lockouts (with IP address)
- 🔄 Token refresh (with IP address)
- 📝 User registration (with IP address)
- ⚠️ Inactive account access attempts
- ⚠️ Non-existent user login attempts

## Best Practices Implemented

### OWASP Top 10 Compliance

1. **A01:2021 – Broken Access Control**
   - ✅ Token-based authentication
   - ✅ Role-based access control (admin flag)
   - ✅ Account status checks (active/inactive)

2. **A02:2021 – Cryptographic Failures**
   - ✅ Strong password hashing (scrypt)
   - ✅ Secure token generation (JWT with HS256)
   - ✅ No plaintext password storage

3. **A03:2021 – Injection**
   - ✅ Parameterized database queries (SQLAlchemy ORM)
   - ✅ Input validation (Marshmallow schemas)

4. **A04:2021 – Insecure Design**
   - ✅ Account lockout mechanism
   - ✅ Password strength requirements
   - ✅ Rate limiting (via account lockout)

5. **A05:2021 – Security Misconfiguration**
   - ✅ Secure defaults (accounts inactive until verified)
   - ✅ Detailed error logging
   - ✅ Generic error messages to users (prevent enumeration)

6. **A07:2021 – Identification and Authentication Failures**
   - ✅ Strong password policy
   - ✅ Account lockout
   - ✅ Session management
   - ✅ Multi-factor authentication ready (email_verified flag)

### Additional Security Measures

- **User enumeration prevention**: Same error message for invalid email and invalid password
- **Timing attack protection**: Constant-time password comparison
- **Brute force protection**: Account lockout after 5 failed attempts
- **Session fixation prevention**: New tokens generated on each login
- **CSRF protection**: Token-based authentication (stateless)
- **XSS protection**: JSON responses only (no HTML rendering)

## Administrative Tools

### Password Reset Utility

Reset a user's password and unlock their account:

```bash
docker exec marketplace-backend python scripts/reset_password.py user@example.com NewPassword123!
```

### Database Migration

Apply security enhancements to existing database:

```bash
docker exec marketplace-postgres psql -U marketplace_user -d marketplace_db -f /app/migrations/add_security_columns.sql
```

## Security Checklist for Deployment

- [ ] Change default admin password
- [ ] Set strong JWT secret keys (JWT_SECRET_KEY, JWT_REFRESH_SECRET)
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly (restrict allowed origins)
- [ ] Set up rate limiting at reverse proxy level
- [ ] Enable database connection encryption (SSL/TLS)
- [ ] Configure secure session cookies (httpOnly, secure, sameSite)
- [ ] Set up monitoring and alerting for failed login attempts
- [ ] Implement email verification workflow
- [ ] Set up backup and recovery procedures
- [ ] Configure log rotation and retention
- [ ] Implement IP-based rate limiting (Redis)
- [ ] Set up intrusion detection system (IDS)
- [ ] Regular security audits and penetration testing

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Do not** create public GitHub issues for security vulnerabilities.

