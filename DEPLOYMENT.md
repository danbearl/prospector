# Deployment Guide

## Overview

The Prospector application supports two deployment modes:
- **Development Mode**: Hot-reloading, source code volumes, debugging tools
- **Production Mode**: Optimized builds, no volumes, production-ready

## Quick Start

### Windows

**Development Mode**:
```bash
start-dev.bat
```

**Production Mode**:
```bash
start-prod.bat
```

**Stop All Containers**:
```bash
stop.bat
```

### Linux/Mac

**First time setup** (make scripts executable):
```bash
chmod +x start-dev.sh start-prod.sh start.sh stop.sh
```

**Development Mode**:
```bash
./start-dev.sh
```

**Production Mode**:
```bash
./start-prod.sh
```

**Stop All Containers**:
```bash
./stop.sh
```

## Deployment Modes

### Development Mode

**Purpose**: Local development with hot-reloading and debugging

**Features**:
- ✅ Hot-reloading for backend (nodemon)
- ✅ Hot-reloading for frontend (Vite HMR)
- ✅ Source code mounted as volumes
- ✅ All dependencies installed (including dev dependencies)
- ✅ Detailed error messages and stack traces
- ✅ Development JWT secret (not secure)

**Ports**:
- Frontend: http://localhost:3000 (Vite dev server on port 5173)
- Backend: http://localhost:3001

**Configuration File**: `docker-compose.dev.yml`

**Dockerfiles**:
- Backend: `backend/Dockerfile.dev`
- Frontend: `frontend/Dockerfile.dev`

**Start Command**:
```bash
start-dev.bat
# OR
docker compose -f docker-compose.dev.yml up --build
```

**Benefits**:
- Changes to code are immediately reflected (no rebuild needed)
- Faster development iteration
- Easy debugging with source maps
- Console logs visible in real-time

**Drawbacks**:
- Slower performance than production
- Larger container sizes
- Not suitable for public deployment
- Uses development JWT secret

---

### Production Mode

**Purpose**: Optimized deployment for production environments

**Features**:
- ✅ Optimized production builds
- ✅ Minified and bundled code
- ✅ Production-only dependencies
- ✅ Nginx serving static frontend files
- ✅ Smaller container sizes
- ✅ Better performance
- ✅ Configurable JWT secret

**Ports**:
- Frontend: http://localhost (Nginx on port 80)
- Backend: http://localhost:3001

**Configuration File**: `docker-compose.prod.yml` (also copied to `docker-compose.yml`)

**Dockerfiles**:
- Backend: `backend/Dockerfile`
- Frontend: `frontend/Dockerfile`

**Start Command**:
```bash
start-prod.bat
# OR
docker compose -f docker-compose.prod.yml up --build
# OR (uses default docker-compose.yml)
docker compose up --build
```

**Benefits**:
- Optimized for performance
- Smaller container sizes
- Production-ready security
- Suitable for public deployment

**Drawbacks**:
- No hot-reloading (requires rebuild for changes)
- Longer build times
- Less detailed error messages

---

## File Structure

```
prospector/
├── docker-compose.yml           # Default (production)
├── docker-compose.prod.yml      # Production configuration
├── docker-compose.dev.yml       # Development configuration
├── start.sh                     # Linux/Mac start script (production)
├── start-dev.bat               # Start in development mode
├── start-prod.bat              # Start in production mode
├── stop.bat                    # Stop all containers
├── backend/
│   ├── Dockerfile              # Production Dockerfile
│   ├── Dockerfile.dev          # Development Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   ├── database.js
│   └── auth.js
└── frontend/
    ├── Dockerfile              # Production Dockerfile (multi-stage)
    ├── Dockerfile.dev          # Development Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
```

## Environment Variables

### Development Mode

**Backend** (`docker-compose.dev.yml`):
```yaml
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-key-change-in-production
```

**Frontend** (`docker-compose.dev.yml`):
```yaml
NODE_ENV=development
```

### Production Mode

**Backend** (`docker-compose.prod.yml`):
```yaml
NODE_ENV=production
PORT=3001
JWT_SECRET=change-this-secret-in-production-use-long-random-string
```

**Frontend** (`docker-compose.prod.yml`):
- No environment variables needed (static build)

### Customizing Environment Variables

To customize environment variables for production:

1. Edit `docker-compose.prod.yml`
2. Update the `JWT_SECRET` to a long, random string:
   ```yaml
   JWT_SECRET=your-very-long-random-secret-key-here-at-least-32-characters
   ```
3. Rebuild and restart:
   ```bash
   docker compose -f docker-compose.prod.yml up --build
   ```

## Volume Management

### Development Mode

**Source Code Volumes**:
```yaml
volumes:
  - ./backend:/app          # Backend source code
  - /app/node_modules       # Exclude node_modules
  - ./frontend:/app         # Frontend source code
  - /app/node_modules       # Exclude node_modules
  - backend-data:/app/data  # Database persistence
```

Changes to source code are immediately reflected in the running containers.

### Production Mode

**Data Volume Only**:
```yaml
volumes:
  - backend-data:/app/data  # Database persistence only
```

No source code volumes - code is baked into the container images.

### Database Persistence

Both modes use the same `backend-data` volume for database persistence:
- Database file: `/app/data/prospector.db`
- Persists across container restarts
- Shared between development and production modes

**To reset the database**:
```bash
docker volume rm prospector_backend-data
```

## Port Configuration

### Default Ports

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | 3000 → 5173 | 3000 → 80 |
| Backend | 3001 → 3001 | 3001 → 3001 |

### Changing Ports

Edit the respective `docker compose` file:

```yaml
services:
  frontend:
    ports:
      - "8080:5173"  # Development: host:container
      # OR
      - "8080:80"    # Production: host:container
  
  backend:
    ports:
      - "8081:3001"  # host:container
```

## Building and Running

### Development Mode

**Build and start**:
```bash
docker compose -f docker-compose.dev.yml up --build
```

**Start without rebuilding**:
```bash
docker compose -f docker-compose.dev.yml up
```

**Run in background**:
```bash
docker compose -f docker-compose.dev.yml up -d
```

**View logs**:
```bash
docker compose -f docker-compose.dev.yml logs -f
```

**Stop**:
```bash
docker compose -f docker-compose.dev.yml down
```

### Production Mode

**Build and start**:
```bash
docker compose -f docker-compose.prod.yml up --build
```

**Start without rebuilding**:
```bash
docker compose -f docker-compose.prod.yml up
```

**Run in background**:
```bash
docker compose -f docker-compose.prod.yml up -d
```

**View logs**:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Stop**:
```bash
docker compose -f docker-compose.prod.yml down
```

## Switching Between Modes

### From Development to Production

1. Stop development containers:
   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

2. Start production containers:
   ```bash
   docker compose -f docker-compose.prod.yml up --build
   ```

**Note**: Database persists across mode switches (same volume).

### From Production to Development

1. Stop production containers:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

2. Start development containers:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

## Troubleshooting

### Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**:
1. Stop all containers: `stop.bat`
2. Check for processes using the port:
   ```bash
   netstat -ano | findstr :3000
   ```
3. Kill the process or change the port in docker compose file

### Hot-Reloading Not Working (Development)

**Symptoms**: Changes to code don't reflect in the browser

**Solutions**:
1. Ensure you're using development mode: `start-dev.bat`
2. Check that volumes are mounted correctly:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
3. Restart containers:
   ```bash
   docker compose -f docker-compose.dev.yml restart
   ```

### Build Failures

**Error**: `npm install` fails or native module compilation errors

**Solutions**:
1. Clear Docker cache:
   ```bash
   docker compose -f docker-compose.dev.yml build --no-cache
   ```
2. Remove node_modules locally:
   ```bash
   rm -rf backend/node_modules frontend/node_modules
   ```
3. Rebuild:
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

### Database Issues

**Problem**: Database not persisting or corrupted

**Solutions**:
1. Check volume exists:
   ```bash
   docker volume ls | findstr backend-data
   ```
2. Inspect volume:
   ```bash
   docker volume inspect prospector_backend-data
   ```
3. Reset database (WARNING: deletes all data):
   ```bash
   docker compose down
   docker volume rm prospector_backend-data
   docker compose up --build
   ```

## Production Deployment Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Update Admin password from temporary password
- [ ] Configure proper CORS settings if needed
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Test all authentication flows
- [ ] Test user isolation
- [ ] Verify data persistence
- [ ] Load test the application
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure environment-specific settings

## Performance Optimization

### Production Mode

Already optimized with:
- Minified JavaScript bundles
- Gzip compression (Nginx)
- Production React build
- Optimized Docker images
- Multi-stage builds

### Additional Optimizations

1. **Enable Nginx caching**:
   Edit `frontend/nginx.conf` to add cache headers

2. **Use CDN for static assets**:
   Configure Nginx to serve from CDN

3. **Database optimization**:
   - Add indexes for frequently queried columns
   - Regular VACUUM operations for SQLite

4. **Container resource limits**:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

## Security Considerations

### Development Mode
- ⚠️ Uses weak JWT secret
- ⚠️ Detailed error messages exposed
- ⚠️ Source code accessible
- ⚠️ Not suitable for public access

### Production Mode
- ✅ Strong JWT secret (must be configured)
- ✅ Minimal error information exposed
- ✅ Source code not accessible
- ✅ Suitable for public deployment

### Additional Security Measures

1. **Use HTTPS**: Deploy behind a reverse proxy with SSL
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Input Validation**: Already implemented, but review regularly
4. **Regular Updates**: Keep dependencies updated
5. **Security Headers**: Add security headers in Nginx
6. **Database Encryption**: Consider encrypting sensitive data
7. **Audit Logging**: Log security-relevant events

## Monitoring and Logging

### View Logs

**All services**:
```bash
docker compose logs -f
```

**Specific service**:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

**Last N lines**:
```bash
docker compose logs --tail=100 backend
```

### Log to File

```bash
docker compose logs > logs.txt
```

### Production Logging

Consider using:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana + Loki**
- **CloudWatch** (AWS)
- **Stackdriver** (GCP)

## Backup and Recovery

### Database Backup

**Manual backup**:
```bash
docker cp prospector-backend:/app/data/prospector.db ./backup-$(date +%Y%m%d).db
```

**Automated backup script** (create `backup.bat`):
```batch
@echo off
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
docker cp prospector-backend:/app/data/prospector.db ./backups/prospector-%TIMESTAMP%.db
echo Backup created: prospector-%TIMESTAMP%.db
```

### Database Restore

```bash
docker cp ./backup.db prospector-backend:/app/data/prospector.db
docker compose restart backend
```

## Support

For deployment issues:
1. Check this documentation
2. Review Docker logs
3. Verify environment variables
4. Check port availability
5. Ensure Docker is running
6. Verify network connectivity