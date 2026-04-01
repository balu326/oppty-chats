@echo off
echo Installing multer for file uploads...
cd /d "%~dp0backend"
npm install multer
echo.
echo ✅ Multer installed successfully!
echo.
echo You can now upload files (photos, videos, documents) and share links.
pause
