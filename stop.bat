@echo off
echo Stopping Prospector containers...
echo.
echo Checking for development containers...
docker-compose -f docker-compose.dev.yml down
echo.
echo Checking for production containers...
docker-compose -f docker-compose.prod.yml down
echo.
echo All containers stopped.

@REM Made with Bob
