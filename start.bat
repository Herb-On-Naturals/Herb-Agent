@echo off
echo ==========================================
echo       Starting DealPilot CRM
echo ==========================================

:: Start Backend
echo Starting Backend Server...
start "DealPilot Backend" cmd /k "npm start"

:: Start Frontend
echo Starting Frontend (Vite) Dev Server...
start "DealPilot Frontend" cmd /k "cd client && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo You can access the app at http://localhost:5173
echo.
pause
