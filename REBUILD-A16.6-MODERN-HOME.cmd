@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING STUDIO A16.6 - MODERN HOME UI
echo ============================================================
echo.
echo 1/3 Removing old .next build...
if exist ".next" rmdir /s /q ".next"

echo.
echo 2/3 Building VLearning...
call npm.cmd run build
if errorlevel 1 goto :error

echo.
echo 3/3 Starting VLearning...
start "" "%~dp0START-VLEARNING.cmd"

echo.
echo ============================================================
echo A16.6 MODERN HOME READY
echo Open: http://localhost:3000/projects
echo Then press Ctrl+F5
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo BUILD FAILED
echo Send the FIRST build error shown above.
echo ============================================================
echo.
pause
exit /b 1
