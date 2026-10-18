@echo off
cd /d "%~dp0"
echo Menjalankan SiMagang MVP v3 DEMO (tanpa npm install)...
start "SiMagang Demo Server" cmd /k "node scripts\dev-server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://localhost:4173/#/home"
exit /b
