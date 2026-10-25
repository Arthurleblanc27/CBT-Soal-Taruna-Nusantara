@echo off
title TN Trainer
cd /d "%~dp0"

if not exist "node_modules" (
  echo Memasang dependensi...
  call npm install
)

echo.
echo Membangun TN Trainer...
call npm run build
if errorlevel 1 (
  echo Build gagal. Periksa pesan di atas.
  pause
  exit /b 1
)

echo.
echo Menjalankan server di http://localhost:4321
start "" "http://localhost:4321"
call npm run preview
pause
