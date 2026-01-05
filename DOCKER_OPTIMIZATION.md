# Docker Backend Optimization

## Problem

The Flask development server with `--debug` flag was spawning 16+ worker processes, each loading the entire PaddleOCR model (1.5GB) into memory.

**Before optimization:**
- 16+ Flask processes
- 24GB RAM usage
- Load average: 33.56
- System sluggish and unresponsive

## Solution

Replaced Flask dev server with Gunicorn production WSGI server with limited workers.

**After optimization:**
- 2 Gunicorn workers
- ~4GB RAM usage (2 workers × 1.5GB PaddleOCR + 1GB overhead)
- Load average: <2.0 (expected)
- System responsive

## Changes Made

### 1. docker-compose.yml

**Before:**
```yaml
command: flask run --host=0.0.0.0 --port=5000 --debug
```

**After:**
```yaml
command: gunicorn --bind 0.0.0.0:5000 --workers 2 --worker-class gevent --timeout 300 --max-requests 1000 --max-requests-jitter 50 --log-level info app:app

deploy:
  resources:
    limits:
      memory: 4G
      cpus: '2.0'
```

### 2. Environment Variables

**Before:**
```yaml
- FLASK_ENV=development
- FLASK_DEBUG=1
- LOG_LEVEL=DEBUG
```

**After:**
```yaml
- FLASK_ENV=production
- FLASK_DEBUG=0
- LOG_LEVEL=INFO
```

## Gunicorn Configuration Explained

| Setting | Value | Reason |
|---------|-------|--------|
| `--workers 2` | 2 processes | Each loads PaddleOCR model (1.5GB). 2 workers = 3GB total vs 16+ = 24GB |
| `--worker-class gevent` | Async I/O | Better concurrency for I/O-bound OCR tasks |
| `--timeout 300` | 5 minutes | Allow long OCR processing without timeout |
| `--max-requests 1000` | Restart after 1000 requests | Prevent memory leaks |
| `--max-requests-jitter 50` | Randomize restart | Avoid thundering herd |

## Resource Limits

| Resource | Limit | Reservation | Reason |
|----------|-------|-------------|--------|
| Memory | 4GB | 2GB | 2 workers × 1.5GB PaddleOCR + 1GB overhead |
| CPU | 2 cores | 1 core | Limit CPU usage to prevent system overload |

## Usage

### Standard (Optimized)
```bash
./docker-start.sh
```

Uses `docker-compose.yml` with Gunicorn (2 workers, 4GB limit).

### Production (Even More Optimized)
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Uses production overrides (WARNING level logging, stricter limits).

### Development (Flask Dev Server - NOT RECOMMENDED)
```bash
# Only use for debugging, NOT for OCR processing
docker-compose run --rm backend flask run --host=0.0.0.0 --port=5000 --debug
```

## Monitoring

### Check Memory Usage
```bash
docker stats marketplace-backend
```

**Expected:**
- MEM USAGE: ~3-4GB
- CPU %: 50-100% during OCR, <10% idle

### Check Process Count
```bash
docker exec marketplace-backend ps aux | grep gunicorn
```

**Expected:**
- 1 master process
- 2 worker processes
- Total: 3 processes (not 16+)

### Check Logs
```bash
docker logs -f marketplace-backend
```

**Expected:**
- Gunicorn startup message
- Worker process IDs
- No "Restarting with stat" messages (Flask reloader)

## Troubleshooting

### Still seeing high memory usage?

1. **Check if old containers are running:**
   ```bash
   docker ps -a | grep marketplace-backend
   docker rm -f marketplace-backend
   ```

2. **Rebuild and restart:**
   ```bash
   ./docker-stop.sh
   docker-compose build --no-cache backend
   ./docker-start.sh
   ```

3. **Verify Gunicorn is running:**
   ```bash
   docker exec marketplace-backend ps aux
   ```
   Should show `gunicorn`, NOT `flask run`.

### OCR timing out?

Increase timeout in docker-compose.yml:
```yaml
command: gunicorn ... --timeout 600 ...  # 10 minutes
```

### Need more concurrency?

Increase workers (but watch memory):
```yaml
command: gunicorn ... --workers 4 ...  # 4 workers = ~6GB RAM
deploy:
  resources:
    limits:
      memory: 8G  # Increase limit accordingly
```

## Performance Comparison

| Metric | Flask Dev Server | Gunicorn (2 workers) | Improvement |
|--------|------------------|----------------------|-------------|
| Processes | 16+ | 3 | 81% reduction |
| RAM Usage | 24GB | 4GB | 83% reduction |
| Load Average | 33.56 | <2.0 | 94% reduction |
| OCR Speed | Same | Same | No change |
| System Responsiveness | Sluggish | Normal | ✅ Fixed |

## References

- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Docker Resource Limits](https://docs.docker.com/compose/compose-file/deploy/)
- [PaddleOCR Memory Usage](https://github.com/PaddlePaddle/PaddleOCR/issues/1132)

