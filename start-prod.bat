@echo off
echo Starting Prospector in PRODUCTION mode...
echo.
echo Features:
echo - Optimized builds
echo - No source code volumes
echo - Production-only dependencies
echo - Nginx serving static frontend
echo - Frontend: http://localhost
echo - Backend: http://localhost:3001
echo.
docker compose -f docker-compose.prod.yml up --build

@REM Made with Bob
