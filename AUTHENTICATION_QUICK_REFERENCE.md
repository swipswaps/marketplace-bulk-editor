# Authentication Quick Reference

## User Credentials

### Current Test Account
- **Email**: `ihydrocarbon@gmail.com`
- **Password**: `Test123!@#`
- **Name**: Jose Melendez
- **Status**: Active, unlocked

### Admin Account
- **Email**: `admin@marketplace.local`
- **Password**: `Admin123!@#`
- **Name**: Admin User
- **Status**: Active, admin privileges

## Password Requirements

✅ **Valid Password Example**: `Test123!@#`

**Requirements**:
- ✅ At least 8 characters
- ✅ At least one uppercase letter (T)
- ✅ At least one lowercase letter (est)
- ✅ At least one digit (123)
- ✅ At least one special character (!@#)

❌ **Invalid Passwords**:
- `test123` - No uppercase, no special char
- `TEST123!` - No lowercase
- `TestTest!` - No digit
- `Test123` - No special char
- `Test1!` - Too short (< 8 chars)

## Login Examples

### Via API (curl)
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ihydrocarbon@gmail.com","password":"Test123!@#"}'

# Response
{
  "message": "Login successful",
  "user": {
    "id": "609a25f6-35e9-4f8d-8071-f246b613647a",
    "email": "ihydrocarbon@gmail.com",
    "first_name": "Jose",
    "last_name": "Melendez",
    "is_active": true,
    "is_admin": false
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```

### Via UI
1. Open http://localhost:5173
2. Click "Login" button
3. Enter email: `ihydrocarbon@gmail.com`
4. Enter password: `Test123!@#`
5. Click "Login"

## Common Scenarios

### Forgot Password
```bash
# Reset password (requires Docker access)
docker exec marketplace-backend python scripts/reset_password.py \
  ihydrocarbon@gmail.com "NewPassword123!"
```

### Account Locked
**Cause**: 5 failed login attempts

**Solution 1** - Wait 30 minutes for automatic unlock

**Solution 2** - Reset password (unlocks immediately):
```bash
docker exec marketplace-backend python scripts/reset_password.py \
  ihydrocarbon@gmail.com "NewPassword123!"
```

### Case-Insensitive Login
All of these work:
- `ihydrocarbon@gmail.com` ✅
- `Ihydrocarbon@gmail.com` ✅
- `IHYDROCARBON@GMAIL.COM` ✅

### Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### Refresh Access Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

### Get Current User Info
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Error Messages

### Invalid Credentials
```json
{
  "error": "Invalid credentials",
  "remaining_attempts": 3
}
```
**Meaning**: Wrong password, 3 attempts remaining before lockout

### Account Locked
```json
{
  "error": "Account is locked due to multiple failed login attempts. Try again in 25 minutes."
}
```
**Meaning**: Too many failed attempts, wait or reset password

### Weak Password
```json
{
  "error": "Password must contain at least one uppercase letter"
}
```
**Meaning**: Password doesn't meet requirements

### Email Already Registered
```json
{
  "error": "Email already registered"
}
```
**Meaning**: Email already exists in database

### Invalid Email Format
```json
{
  "error": "Invalid email format"
}
```
**Meaning**: Email doesn't match RFC 5322 format

## Database Queries

### Check User Status
```bash
docker exec marketplace-postgres psql -U marketplace_user -d marketplace_db -c "
  SELECT email, is_active, failed_login_attempts, locked_until, last_login, last_login_ip
  FROM users
  WHERE email = 'ihydrocarbon@gmail.com';
"
```

### View All Users
```bash
docker exec marketplace-postgres psql -U marketplace_user -d marketplace_db -c "
  SELECT id, email, first_name, last_name, is_active, is_admin, failed_login_attempts
  FROM users;
"
```

### View Audit Logs
```bash
docker exec marketplace-postgres psql -U marketplace_user -d marketplace_db -c "
  SELECT created_at, action, ip_address, status_code
  FROM audit_logs
  WHERE user_id = '609a25f6-35e9-4f8d-8071-f246b613647a'
  ORDER BY created_at DESC
  LIMIT 10;
"
```

## Troubleshooting

### Login Not Working
1. Check email is correct (case doesn't matter)
2. Check password meets requirements
3. Check account isn't locked
4. Check backend is running: `docker ps | grep marketplace-backend`
5. Check backend logs: `docker logs marketplace-backend --tail 50`

### Account Locked
1. Wait 30 minutes for automatic unlock
2. OR reset password: `docker exec marketplace-backend python scripts/reset_password.py EMAIL PASSWORD`

### Backend Not Responding
```bash
# Restart backend
docker restart marketplace-backend

# Check logs
docker logs marketplace-backend --tail 50
```

## Security Notes

⚠️ **Development Only**
- These credentials are for development/testing only
- Change all passwords before deploying to production
- Use environment variables for secrets in production

⚠️ **Password Storage**
- Never store passwords in plain text
- Never commit passwords to git
- Use password managers for production credentials

⚠️ **Token Security**
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Store tokens securely (httpOnly cookies in production)

