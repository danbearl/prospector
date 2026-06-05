@echo off
echo Starting Prospector with HTTPS (Let's Encrypt)...
echo.
echo Prerequisites:
echo 1. Domain name pointing to this server
echo 2. Ports 80 and 443 open in firewall
echo 3. .env.https file configured
echo.

if not exist .env.https (
    echo ERROR: .env.https file not found!
    echo Please copy .env.https.example to .env.https and configure it.
    exit /b 1
)

echo Loading environment variables from .env.https...
for /f "tokens=*" %%a in ('type .env.https ^| findstr /v "^#"') do set %%a

echo.
echo Configuration:
echo - Domain: %DOMAIN%
echo - Let's Encrypt Email: %LETSENCRYPT_EMAIL%
echo.
echo Starting services...
echo - Frontend: https://%DOMAIN%
echo - Backend API: https://%DOMAIN%/api
echo - Traefik Dashboard: http://localhost:8080
echo.

docker compose -f docker-compose.https.yml up --build

@REM Made with Bob
