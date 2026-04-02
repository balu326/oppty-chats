@echo off
title Oppty Chats - Backend Server
color 0A
echo.
echo ========================================
echo    Oppty Chats - Backend Server
echo ========================================
echo.
echo Starting MongoDB Atlas Connection...
echo Server will run on: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0backend"

if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting backend in development mode...
call npm run dev

pause
