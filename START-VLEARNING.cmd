@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLearning Studio 1.0
echo ============================================================
echo.

if not exist "package.json" (
  echo [ERROR] Khong tim thay package.json.
  echo Hay dat file nay trong thu muc goc elearning-studio.
  pause
  exit /b 1
)

if not exist ".next\BUILD_ID" (
  echo [INFO] Chua co production build.
  echo Dang chay BUILD-PRODUCTION.cmd...
  call "%~dp0BUILD-PRODUCTION.cmd"
  if errorlevel 1 exit /b 1
)

echo Dang khoi dong tai http://localhost:3000/projects
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000/projects"

call npx.cmd next start -p 3000

echo.
echo Server da dung.
pause
