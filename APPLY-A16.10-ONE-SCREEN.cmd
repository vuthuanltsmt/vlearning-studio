@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING A16.10 - APPLY ONE SCREEN UI
echo ============================================================
echo.

echo [1/5] Verify A16.10 source...
findstr /C:"A16.10 ONE SCREEN DASHBOARD" "app\projects\page.tsx" >nul
if errorlevel 1 (
  echo ERROR: A16.10 page.tsx was NOT copied into this project.
  echo Re-extract the ZIP to C:\Users\Admin\elearning-studio with -Force.
  goto :error
)
echo Source OK.

echo.
echo [2/5] Stop any old server on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 /nobreak >nul

echo.
echo [3/5] Remove old .next build...
if exist ".next" rmdir /s /q ".next"

echo.
echo [4/5] Build A16.10...
call npm.cmd run build
if errorlevel 1 goto :error

echo.
echo [5/5] Start VLearning...
start "" "%~dp0START-VLEARNING.cmd"

echo.
echo ============================================================
echo A16.10 APPLIED SUCCESSFULLY
echo Open: http://localhost:3000/projects
echo Press Ctrl+F5
echo.
echo You should see:
echo - VLEARNING STUDIO on ONE line
echo - very short top banner
echo - two cards about 122px high
echo - "Bai giang moi nhat" visible directly below
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo A16.10 INSTALL/BUILD FAILED
echo Send the FIRST error shown above.
echo ============================================================
echo.
pause
exit /b 1
