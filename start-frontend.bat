@echo off
title Oppty Chats - Frontend
color 0B
echo.
echo ========================================
echo    Oppty Chats - Frontend
echo ========================================
echo.
echo Starting Vite Development Server...
echo Application will run on: http://localhost:5173
echo.
echo Make sure backend is already running!
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0frontend"

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting frontend development server...
call npm run dev

pause
