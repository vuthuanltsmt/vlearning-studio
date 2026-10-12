@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING STUDIO A17 - CLOUD DATA FOUNDATION
echo PostgreSQL + Project Ownership + Cloud Sync
echo ============================================================
echo.

echo [1/7] Configure PostgreSQL connection...
call node scripts\configure-a17-cloud.mjs
if errorlevel 1 goto :error

echo.
echo [2/7] Install Prisma packages...
call npm.cmd install @prisma/client@6
if errorlevel 1 goto :error
call npm.cmd install -D prisma@6
if errorlevel 1 goto :error

echo.
echo [3/7] Generate existing A16 auth Prisma Client...
call npx.cmd prisma generate --schema prisma\schema.prisma
if errorlevel 1 goto :error

echo.
echo [4/7] Generate A17 Cloud Prisma Client...
call npx.cmd prisma generate --schema prisma\cloud\schema.prisma
if errorlevel 1 goto :error

echo.
echo [5/7] Create/update PostgreSQL CloudProject table...
call npx.cmd prisma db push --schema prisma\cloud\schema.prisma
if errorlevel 1 goto :error

echo.
echo [6/7] Test PostgreSQL connection...
call node scripts\check-a17-cloud.mjs
if errorlevel 1 goto :error

echo.
echo [7/7] Clean build...
if exist ".next" rmdir /s /q ".next"
call npm.cmd run build
if errorlevel 1 goto :error

echo.
echo ============================================================
echo A17 CLOUD DATA FOUNDATION READY
echo ============================================================
echo.
echo Start VLearning:
echo   START-VLEARNING.cmd
echo.
echo Open:
echo   http://localhost:3000/projects
echo.
echo Then login as ADMIN/TEACHER and use:
echo   DAY LEN CLOUD
echo   TAI TU CLOUD
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo A17 SETUP FAILED
echo Send the FIRST error shown above.
echo ============================================================
echo.
pause
exit /b 1
