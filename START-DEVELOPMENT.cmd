@echo off
setlocal
cd /d "%~dp0"

if not exist "package.json" (
  echo [ERROR] Khong tim thay package.json.
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000/projects"
call npx.cmd next dev --webpack
pause
