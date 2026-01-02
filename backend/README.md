# Marketplace Bulk Editor - Backend

Secure Flask backend API for the Marketplace Bulk Editor application.

**✅ VERIFIED**: All features tested with complete end-to-end workflow (2025-12-19)
**📄 Evidence**: See [../COMPLETE_WORKFLOW_EVIDENCE.md](../COMPLETE_WORKFLOW_EVIDENCE.md) for full terminal output, API responses, database queries, and screenshots

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
  - Access tokens: **15 minutes** (900 seconds)
  - Refresh tokens: **7 days** (604800 seconds)
  - Account lockout: **5 failed attempts = 30 min lock**
- 🗄️ **PostgreSQL Database** - Persistent data storage
  - 5 tables: Users, Listings, Templates, OCRScans, AuditLogs
  - SQL export support (INSERT statements)
- ⚡ **Redis Caching** - Fast rate limiting and caching
  - General API: **100 requests/minute**
  - File uploads: **10 uploads/minute**
  - Exports: **50 exports/hour**
- 🔒 **Security** - Rate limiting, CORS, input validation, CSRF protection
- 📊 **Multi-Format Export** - Text, CSV, XLSX, JSON, SQL
- 🔍 **OCR Integration** - Tesseract OCR for product catalog processing
- 📝 **Audit Logging** - Complete action tracking for compliance
- 🐳 **Docker Ready** - Containerized deployment (Python 3.11)

---

## 🎯 Complete Workflow (Tested End-to-End)

All steps below have been tested and verified with evidence in [../COMPLETE_WORKFLOW_EVIDENCE.md](../COMPLETE_WORKFLOW_EVIDENCE.md):

### 1. Setup (Docker)
```bash
./docker-start.sh
```
**Result**: 4 containers running (PostgreSQL, Redis, Backend, Frontend)

### 2. User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!","first_name":"Test","last_name":"User"}'
```
**Result**: JWT tokens issued (access: 15 min, refresh: 7 days)

### 3. Create Listing
```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Solar Panel 300W","price":150,"condition":"New",...}'
```
**Result**: Listing saved to PostgreSQL

### 4. Verify in Database
```bash
docker exec marketplace-postgres psql -U marketplace_user -d marketplace_db \
  -c "SELECT * FROM listings;"
```
**Result**: Data persisted in PostgreSQL

### 5. Create Template
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Solar Panel Template","template_data":{...}}'
```
**Result**: Template saved for reuse

### 6. Export to SQL
```bash
curl -X POST http://localhost:5000/api/export/sql \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"listings":[...]}' --output export.sql
```
**Result**: SQL INSERT statements generated

### 7. Test Rate Limiting
```bash
for i in {1..101}; do curl http://localhost:5000/api/listings; done
```
**Result**: 429 error after 101 requests (100/min limit enforced)

**See [../COMPLETE_WORKFLOW_EVIDENCE.md](../COMPLETE_WORKFLOW_EVIDENCE.md) for full terminal output and API responses.**

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Tesseract OCR

### Installation

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize database**
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

6. **Run development server**
```bash
flask run --debug
```

The API will be available at `http://localhost:5000`

---

## Docker Deployment

### Using Docker Compose (Recommended)

From the project root:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Standalone Docker

```bash
# Build image
docker build -t marketplace-backend .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://host:6379/0 \
  marketplace-backend
```

---

## API Endpoints (37 Total)

**✅ VERIFIED**: Core endpoints tested and confirmed working (2025-12-19)
**🆕 NEW**: Analytics and Audit endpoints added (2025-12-27)

### Root Endpoint
- `GET /` - API information and endpoint list
  ```json
  {
    "message": "Marketplace Bulk Editor API",
    "version": "1.0.0",
    "endpoints": {
      "auth": "/api/auth",
      "export": "/api/export",
      "health": "/health",
      "listings": "/api/listings",
      "ocr": "/api/ocr",
      "templates": "/api/templates"
    }
  }
  ```

### Health Check
- `GET /health` - Health check endpoint
  ```json
  {
    "status": "healthy",
    "environment": "development"
  }
  ```

### Authentication (5 endpoints)
- `POST /api/auth/register` - Register new user
  - Returns: `access_token` (15 min), `refresh_token` (7 days)
- `POST /api/auth/login` - Login user
  - Account lockout: 5 failed attempts = 30 min lock
- `POST /api/auth/logout` - Logout user (client-side token removal)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### Listings (7 endpoints)
- `GET /api/listings` - Get all listings (paginated)
- `POST /api/listings` - Create listing
- `GET /api/listings/:id` - Get listing by ID
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/bulk` - Bulk create listings (max 100)
- `DELETE /api/listings/bulk` - Bulk delete listings

### Templates (6 endpoints)
- `GET /api/templates` - Get all templates (user's own + public)
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template by ID
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/use` - Increment use count

### OCR (5 endpoints)
- `POST /api/ocr/upload` - Upload file for OCR processing
  - Supported: PDF, PNG, JPEG, HEIC
  - Max size: 10MB
  - Rate limit: 10 uploads/minute
- `GET /api/ocr/scans` - Get OCR scan history (paginated)
- `GET /api/ocr/scans/:id` - Get OCR scan by ID
- `POST /api/ocr/scans/:id/correct` - Manually correct OCR results
- `DELETE /api/ocr/scans/:id` - Delete scan

### Export (5 endpoints)
- `POST /api/export/text` - Export as tab-delimited text
- `POST /api/export/csv` - Export as CSV
- `POST /api/export/xlsx` - Export as Excel (styled)
- `POST /api/export/json` - Export as JSON
- `POST /api/export/sql` - Export as SQL INSERT statements
- **Rate limit**: 50 exports/hour

### Admin (2 endpoints)
- `POST /api/admin/cleanup/duplicates` - Remove duplicate listings
  - Keeps most recently updated version
  - Identifies duplicates by user_id + title (case-insensitive)
- `GET /api/admin/stats` - Get user's listing statistics
  - Returns: total, duplicates, unique titles

### Analytics (4 endpoints) 🆕
- `GET /api/analytics/summary` - Get summary statistics
  - Returns: total_listings, average_price, total_value, price_range
  - Includes: condition_counts, category_counts, shipping_counts
- `GET /api/analytics/price-distribution` - Get price distribution for histogram
  - Query params: `bins` (default: 10)
  - Returns: bins with min/max/count/percentage, statistics (mean, median)
- `GET /api/analytics/time-series` - Get listings created over time
  - Query params: `period` (day/week/month), `days` (default: 30)
  - Returns: Array of {date, count, total_value}
- `GET /api/analytics/trends` - Get trend analysis
  - Returns: top_categories, top_conditions, recent_activity

### Audit (3 endpoints) 🆕
- `GET /api/audit/logs` - Get audit logs (paginated)
  - Query params: `page`, `per_page`, `action`, `date_from`, `date_to`, `resource_type`
  - Returns: logs array with pagination metadata
- `GET /api/audit/logs/actions` - Get list of unique action types
  - Returns: Array of action names
- `GET /api/audit/logs/stats` - Get audit log statistics
  - Returns: total_logs, action_counts, recent_activity (last 24h)

---

## Database Schema

### Users
- Authentication and user management
- Password hashing with bcrypt
- Email verification
- Account lockout protection

### Listings
- Marketplace item data
- Facebook Marketplace format compliance
- OCR source tracking
- Flexible metadata storage

### Templates
- Reusable listing configurations
- Public/private sharing
- Usage tracking

### OCR Scans
- File upload tracking
- OCR processing status
- Extracted data storage
- Confidence scoring

### Audit Logs
- Complete action tracking
- IP address and user agent logging
- GDPR compliance
- Security monitoring

---

## Security Features

**✅ VERIFIED**: All security features tested and confirmed (2025-12-19)

### Authentication & Authorization
- ✅ **JWT tokens** - Access (15 min) + Refresh (7 days)
- ✅ **Password hashing** - bcrypt with 12 rounds
- ✅ **Account lockout** - 5 failed attempts = 30 min lock
- ✅ **Token verification** - Decorator-based protection

### Rate Limiting (Redis-backed)
- ✅ **General API**: 100 requests/minute
- ✅ **File uploads**: 10 uploads/minute
- ✅ **Exports**: 50 exports/hour
- ✅ **Distributed**: Works across multiple backend instances

### Input Validation
- ✅ **Marshmallow schemas** - Type validation and sanitization
- ✅ **SQL injection prevention** - SQLAlchemy ORM
- ✅ **XSS prevention** - Input sanitization
- ✅ **File upload validation** - Type, size, extension checks

### CORS & CSRF
- ✅ **CORS** - Strict origin whitelist (configurable)
- ✅ **CSRF protection** - Token-based
- ✅ **Secure cookies** - HttpOnly, Secure, SameSite=Lax

### Audit & Compliance
- ✅ **Audit logging** - All actions tracked with IP, user agent, metadata
- ✅ **GDPR compliance** - Data retention policies (30 days default)
- ✅ **Security monitoring** - Failed login tracking

---

## Development

### Running Tests
```bash
pytest
pytest --cov=. --cov-report=html
```

### Code Formatting
```bash
black .
flake8 .
mypy .
```

### Database Migrations
```bash
# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade
```

---

## Environment Variables

**✅ VERIFIED**: All configuration options tested (2025-12-19)

See `.env.example` for all available configuration options.

### Critical Variables
- `DATABASE_URL` - PostgreSQL connection string
  - Example: `postgresql://user:pass@localhost:5432/marketplace_db`
- `REDIS_URL` - Redis connection string (database 0)
  - Example: `redis://localhost:6379/0`
- `RATE_LIMIT_STORAGE` - Redis for rate limiting (database 1)
  - Example: `redis://localhost:6379/1`
  - **CRITICAL**: Must be set separately from `REDIS_URL`
- `JWT_SECRET_KEY` - JWT signing key (change in production!)
- `JWT_REFRESH_SECRET` - JWT refresh token key (change in production!)
- `SECRET_KEY` - Flask secret key (change in production!)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
  - Example: `http://localhost:5173,http://localhost:3000`

### Token Expiration (Verified from config.py)
- `JWT_ACCESS_TOKEN_EXPIRES` - **900 seconds (15 minutes)**
- `JWT_REFRESH_TOKEN_EXPIRES` - **604800 seconds (7 days)**

### Rate Limiting (Verified from config.py)
- `RATE_LIMIT_DEFAULT` - **100 per minute** (general API)
- `RATE_LIMIT_UPLOAD` - **10 per minute** (file uploads)
- `RATE_LIMIT_EXPORT` - **50 per hour** (exports)

### File Upload
- `MAX_FILE_SIZE` - **10485760 bytes (10MB)**
- `UPLOAD_FOLDER` - Upload directory path
- `ALLOWED_EXTENSIONS` - `xlsx,xls,csv,png,jpg,jpeg,pdf`

### OCR
- `TESSERACT_PATH` - Path to Tesseract binary
  - Default: `/usr/bin/tesseract`
- `OCR_LANGUAGES` - OCR languages (default: `eng`)

### Security
- `BCRYPT_LOG_ROUNDS` - **12** (password hashing strength)
- `SESSION_COOKIE_SECURE` - `true` (HTTPS only in production)
- `SESSION_COOKIE_HTTPONLY` - `true` (prevent XSS)
- `SESSION_COOKIE_SAMESITE` - `Lax` (CSRF protection)

### Data Retention
- `DATA_RETENTION_DAYS` - **30 days** (audit log retention)

---

## License

MIT License - See LICENSE file for details

