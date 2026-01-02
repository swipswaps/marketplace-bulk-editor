# Developer Quick Start Guide

Get the Marketplace Bulk Editor backend running in 5 minutes.

---

## Option 1: Docker Compose (Recommended)

**Prerequisites:**
- Docker
- Docker Compose

**Steps:**

```bash
# 1. Clone repository (if not already)
cd /home/owner/Documents/694533e8-ac54-8329-bbf9-22069a0d424e/marketplace-bulk-editor

# 2. Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up -d

# 3. View logs
docker-compose logs -f backend

# 4. Test API
curl http://localhost:5000/health

# 5. Access frontend
# Open browser to http://localhost:5173
```

**Stop services:**
```bash
docker-compose down
```

---

## Option 2: Local Development

**Prerequisites:**
- Python 3.11+
- PostgreSQL 15+ (or use SQLite for testing)
- Redis 7+ (optional, for rate limiting)

**Steps:**

```bash
# 1. Navigate to backend
cd backend

# 2. Run startup script (includes pre-flight checks)
chmod +x run.sh
./run.sh
```

The script will:
- **Run pre-flight checks** (Python version, required files, linting)
- Create virtual environment
- Install dependencies
- Copy .env.example to .env
- Initialize database
- Start Flask server

**To skip pre-flight checks:**
```bash
./run.sh --skip-checks
```

**Manual steps (if run.sh doesn't work):**

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env if needed

# Initialize database
python init_db.py

# Start server
python app.py
```

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "development"
}
```

### 2. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Save the `access_token` from the response.

### 4. Create Listing

```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Solar Panel 300W",
    "price": "199.99",
    "condition": "New",
    "description": "High-efficiency solar panel",
    "category": "Electronics",
    "offer_shipping": "Yes"
  }'
```

### 5. Export to Excel

```bash
curl -X POST http://localhost:5000/api/export/xlsx \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  --output listings.xlsx
```

---

## Automated Testing

Run the comprehensive test script:

```bash
cd backend
python test_api.py
```

This will:
- Test health endpoint
- Register a user
- Login
- Create a listing
- Get listings
- Export to Excel

---

## Common Issues

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Database Connection Error

If using PostgreSQL, make sure it's running:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

For development, you can use SQLite instead:
```bash
# In .env file
DATABASE_URL=sqlite:///marketplace.db
```

### Redis Connection Error

Rate limiting requires Redis. To disable:

```bash
# In .env file
RATE_LIMIT_ENABLED=false
```

---

## Environment Variables

Key variables in `.env`:

```bash
# Flask
FLASK_ENV=development
SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/marketplace_db
# Or use SQLite for testing:
# DATABASE_URL=sqlite:///marketplace.db

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ACCESS_TOKEN_EXPIRES=900  # 15 minutes

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
RATE_LIMIT_ENABLED=true

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Listings
- `GET /api/listings` - Get all listings
- `POST /api/listings` - Create listing
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/bulk` - Bulk create
- `DELETE /api/listings/bulk` - Bulk delete

### Export
- `POST /api/export/text` - Export as text
- `POST /api/export/csv` - Export as CSV
- `POST /api/export/json` - Export as JSON
- `POST /api/export/xlsx` - Export as Excel
- `POST /api/export/sql` - Export as SQL

See `backend/README.md` for complete API documentation.

---

## Next Steps

1. ✅ Backend is running
2. Test API endpoints
3. Integrate with frontend
4. Implement OCR processing
5. Deploy to production

---

## Support

- **Documentation**: See `IMPROVEMENT_PLAN.md` for complete technical specs
- **Backend README**: See `backend/README.md` for API details
- **Progress**: See `PHASE_1_PROGRESS.md` for implementation status

