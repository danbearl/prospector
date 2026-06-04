@echo off
echo Starting Prospector Application...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window (servers will continue running)...
pause > nul

@REM Made with Bob
