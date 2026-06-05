@echo off
echo Starting Prospector in DEVELOPMENT mode...
echo.
echo Features:
echo - Hot-reloading for backend and frontend
echo - Source code mounted as volumes
echo - Development dependencies included
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:3001
echo.
docker compose -f docker-compose.dev.yml up --build

@REM Made with Bob
