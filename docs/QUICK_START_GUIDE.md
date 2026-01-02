# Quick Start Guide - Marketplace Bulk Editor Improvements

## 🚀 Getting Started

This guide helps you begin implementing the improvements outlined in `IMPROVEMENT_PLAN.md`.

---

## Prerequisites

### Required Software
- **Docker** 24.0+ and **Docker Compose** 2.20+
- **Node.js** 20+ and **npm** 10+
- **Python** 3.11+
- **Git**

### Optional (for local development without Docker)
- **PostgreSQL** 15+
- **Redis** 7+
- **Tesseract OCR** 5+

---

## Step 1: Set Up Development Environment

### Clone and Prepare Repository

```bash
cd marketplace-bulk-editor

# Create backend directory
mkdir -p backend/{migrations,tests}

# Create frontend directory (rename existing src)
mkdir -p frontend
mv src frontend/src
mv public frontend/public
mv index.html frontend/
mv package.json frontend/
mv vite.config.ts frontend/
mv tsconfig.* frontend/

# Create environment file
cp .env.example .env
```

### Configure Environment Variables

Edit `.env` file:

```bash
# Backend
FLASK_ENV=development
FLASK_SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Database
DATABASE_URL=postgresql://marketplace_user:secure_password@postgres:5432/marketplace
POSTGRES_USER=marketplace_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=marketplace

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_BASE_URL=http://localhost:5000
```

---

## Step 2: Create Backend Structure

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

# Install Tesseract OCR
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0"]
```

### Backend Requirements

Create `backend/requirements.txt`:

```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
psycopg2-binary==2.9.9
redis==5.0.1
PyJWT==2.8.0
bcrypt==4.1.2
marshmallow==3.20.1
python-dotenv==1.0.0
Pillow==10.1.0
pytesseract==0.3.10
bleach==6.1.0
```

### Basic Flask App

Create `backend/app.py`:

```python
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY')

# CORS
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri=os.getenv('REDIS_URL'),
    default_limits=["100 per minute"]
)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'version': '2.0.0'}), 200

@app.route('/api/listings', methods=['GET'])
@limiter.limit("50 per minute")
def get_listings():
    # TODO: Implement
    return jsonify({'listings': [], 'total': 0}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

---

## Step 3: Create Frontend Structure

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
```

---

## Step 4: Docker Compose Setup

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      - FLASK_ENV=${FLASK_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "5000:5000"
    volumes:
      - ./backend:/app
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    environment:
      - VITE_API_BASE_URL=${VITE_API_BASE_URL}
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Step 5: Start Development Environment

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

---

## Step 6: Verify Setup

### Test Backend

```bash
curl http://localhost:5000/api/health
# Expected: {"status":"healthy","version":"2.0.0"}
```

### Test Frontend

Open http://localhost:5173 in browser - should see the existing marketplace editor.

---

## Next Steps

1. ✅ **Environment is ready!**
2. ⏳ **Implement authentication** - See `IMPROVEMENT_PLAN.md` Section 6.1
3. ⏳ **Create database schema** - See `IMPROVEMENT_PLAN.md` Section 2.3
4. ⏳ **Build API endpoints** - See `IMPROVEMENT_PLAN.md` Section 5
5. ⏳ **Add export tabs** - See `IMPROVEMENT_PLAN.md` Section 3
6. ⏳ **Integrate OCR** - See `IMPROVEMENT_PLAN.md` Section 4

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Redis Connection Issues
```bash
# Test Redis connection
docker-compose exec redis redis-cli ping
# Expected: PONG
```

---

## Development Workflow

```bash
# Make changes to backend code
# Flask auto-reloads on file changes

# Make changes to frontend code  
# Vite HMR updates browser automatically

# Run tests
docker-compose exec backend pytest
docker-compose exec frontend npm test

# View database
docker-compose exec postgres psql -U marketplace_user -d marketplace
```

---

**Ready to start implementing!** 🎉

