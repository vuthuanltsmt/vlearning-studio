@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING STUDIO A15 - SERVER AUTH + SQLITE SETUP
echo ============================================================
echo.
echo 1/4 Installing Prisma Client...
call npm.cmd install @prisma/client@6
if errorlevel 1 goto :error

echo.
echo 2/4 Installing Prisma CLI...
call npm.cmd install -D prisma@6
if errorlevel 1 goto :error

echo.
echo 3/4 Generating Prisma Client...
call npx.cmd prisma generate
if errorlevel 1 goto :error

echo.
echo 4/4 Creating/updating SQLite database...
call npx.cmd prisma db push
if errorlevel 1 goto :error

echo.
echo ============================================================
echo A15 AUTH DATABASE READY
echo Database: prisma\vlearning.db
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo SETUP FAILED
echo Review the error above, then run this file again.
echo ============================================================
echo.
pause
exit /b 1
