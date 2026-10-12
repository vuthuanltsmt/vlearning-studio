@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING A16.4 - REPAIR EDITOR STYLE
echo ============================================================
echo.

echo 1/5 Stopping server on port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 /nobreak >nul

echo.
echo 2/5 Removing old .next build...
if exist ".next" rmdir /s /q ".next"

echo.
echo 3/5 Building VLearning...
call npm.cmd run build
if errorlevel 1 goto :error

echo.
echo 4/5 Checking generated CSS...
dir /s /b ".next\static\*.css" > "%TEMP%\vlearning-css-list.txt" 2>nul
for %%A in ("%TEMP%\vlearning-css-list.txt") do if %%~zA==0 (
  echo WARNING: No generated CSS file was found under .next\static.
) else (
  echo CSS files were generated.
)

echo.
echo 5/5 Starting VLearning...
start "" "%~dp0START-VLEARNING.cmd"

echo.
echo ============================================================
echo REPAIR COMPLETE
echo Open: http://localhost:3000/editor/demo
echo Then press Ctrl+F5
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo BUILD FAILED
echo Please send the FIRST error shown above.
echo ============================================================
echo.
pause
exit /b 1
