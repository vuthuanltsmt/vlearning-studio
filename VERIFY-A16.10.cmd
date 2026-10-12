@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo VERIFY VLEARNING A16.10
echo ============================================================
findstr /C:"A16.10 ONE SCREEN DASHBOARD" "app\projects\page.tsx" >nul
if errorlevel 1 (
  echo FAIL: page.tsx is NOT A16.10.
  echo The old interface is still installed.
  pause
  exit /b 1
)
echo OK: A16.10 source is installed.
echo.
findstr /C:"h-[122px]" "app\projects\page.tsx" >nul
if errorlevel 1 (
  echo WARNING: compact card marker not found.
) else (
  echo OK: 122px compact cards found.
)
echo.
pause
