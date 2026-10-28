@echo off
cd /d "%~dp0"
echo Menjalankan SiMagang MVP v3 dengan autentikasi Supabase...
start "SiMagang" cmd /k "npm run demo"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4173/#/auth"
exit /b
