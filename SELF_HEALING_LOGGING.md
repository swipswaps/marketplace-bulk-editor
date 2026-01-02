# Self-Healing Logging System

**Date**: 2026-01-01  
**Purpose**: Automatically detect and diagnose common errors without manual intervention

---

## Overview

The application now includes comprehensive self-healing diagnostics that automatically detect common configuration errors and provide actionable troubleshooting steps.

---

## Frontend Self-Healing (src/utils/api.ts)

### 1. Endpoint Path Validation

**Detects:**
- Missing `/api` prefix on auth/user endpoints
- Double `/api/api/` prefix
- Missing leading slash

**Example Output:**
```
🚨 SELF-HEALING DIAGNOSTIC: Invalid endpoint path detected!
❌ Endpoint: /auth/change-password
❌ Missing /api prefix - this will cause CORS/404 errors
✅ Correct path should be: /api/auth/change-password
📍 Check the component making this API call and add /api prefix
📍 Stack trace: [shows exact file and line number]
🌐 Will attempt: http://localhost:5000/auth/change-password
✅ Should be: http://localhost:5000/api/auth/change-password
```

### 2. Network/CORS Error Diagnosis

**Detects:**
- "Failed to fetch" errors
- CORS policy violations
- Backend connectivity issues

**Example Output:**
```
🚨 SELF-HEALING DIAGNOSTIC: Network/CORS Error Detected
❌ This usually means:
   1. Backend is not running
   2. CORS policy blocking the request
   3. Endpoint does not exist (404 triggers CORS preflight failure)
   4. Wrong URL path (missing /api prefix)

🔍 Troubleshooting steps:
   1. Check if backend is running: docker ps | grep marketplace-backend
   2. Check backend logs: docker logs marketplace-backend --tail 50
   3. Verify endpoint exists: curl -X POST http://localhost:5000/api/auth/change-password
   4. Check if endpoint path has /api prefix
```

---

## Backend Self-Healing (backend/app.py)

### 1. Request/Response Logging Middleware

**Logs all requests at DEBUG level:**
```
📥 POST /api/auth/login from 172.22.0.1
📦 Request body keys: ['email', 'password']
📤 POST /api/auth/login → 200
```

**Enable with:**
```bash
# In docker-compose.yml
environment:
  - LOG_LEVEL=DEBUG
```

### 2. Enhanced 404 Error Handler

**Detects:**
- Missing `/api` prefix
- Double `/api/api/` prefix
- Shows full request context

**Example Output:**
```
================================================================================
🚨 SELF-HEALING DIAGNOSTIC: 404 Not Found
❌ Path: POST /auth/change-password
❌ Full URL: http://localhost:5000/auth/change-password
❌ Origin: http://localhost:5174
❌ Referer: http://localhost:5174/
🔍 DIAGNOSIS: Missing /api prefix!
✅ Correct path should be: /api/auth/change-password
📍 Check frontend API call - add /api prefix to endpoint
================================================================================
```

---

## How It Works

### Frontend Validation Flow
```
1. Component calls: api.post('/auth/change-password', data)
2. ApiClient.request() calls validateEndpoint('/auth/change-password')
3. validateEndpoint() detects missing /api prefix
4. Logs diagnostic error with:
   - What's wrong
   - What it should be
   - Where to fix it (stack trace)
5. Request proceeds (still fails, but with clear diagnostics)
```

### Backend Logging Flow
```
1. Request arrives: POST /auth/change-password
2. before_request middleware logs: 📥 POST /auth/change-password
3. Flask routing fails (no route matches)
4. 404 error handler triggered
5. Logs diagnostic error with:
   - Full request details
   - Missing /api prefix detection
   - Correct path suggestion
6. after_request middleware logs: 📤 POST /auth/change-password → 404
```

---

## Benefits

### Before Self-Healing
```
❌ Error: "Failed to change password"
❌ Console: "Failed to fetch"
❌ No indication of what's wrong
❌ Developer must manually debug
```

### After Self-Healing
```
✅ Frontend logs: Missing /api prefix detected
✅ Frontend logs: Should be /api/auth/change-password
✅ Frontend logs: Stack trace shows UserSettings.tsx:74
✅ Backend logs: 404 on /auth/change-password
✅ Backend logs: Missing /api prefix - should be /api/auth/change-password
✅ Developer knows exactly what to fix
```

---

## Configuration

### Enable DEBUG Logging

**docker-compose.yml:**
```yaml
backend:
  environment:
    - LOG_LEVEL=DEBUG  # Shows all request/response logs
```

**Restart backend:**
```bash
docker compose restart backend
```

---

## Testing Self-Healing

### Test 1: Missing /api Prefix
```typescript
// In any component
await api.post('/auth/test', {});  // Wrong - missing /api

// Console will show:
// 🚨 SELF-HEALING DIAGNOSTIC: Invalid endpoint path detected!
// ✅ Correct path should be: /api/auth/test
```

### Test 2: CORS Error
```bash
# Stop backend
docker compose stop backend

# Try to use app
# Console will show:
# 🚨 SELF-HEALING DIAGNOSTIC: Network/CORS Error Detected
# 🔍 Troubleshooting steps: [detailed steps]
```

---

## Files Modified

1. **src/utils/api.ts**
   - Added `validateEndpoint()` method
   - Enhanced error handling for "Failed to fetch"
   - Added diagnostic logging

2. **backend/app.py**
   - Added request/response logging middleware
   - Enhanced 404 error handler
   - Added LOG_LEVEL=DEBUG support

3. **docker-compose.yml**
   - Added LOG_LEVEL=DEBUG environment variable

---

**Status**: ✅ Self-healing logging system active  
**Next Steps**: Monitor logs for automatic error detection and diagnosis

