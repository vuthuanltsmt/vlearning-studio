@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING STUDIO A16 - RBAC + DATABASE SETUP
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
echo 4/4 Updating SQLite database for A16 roles...
call npx.cmd prisma db push
if errorlevel 1 goto :error

echo.
echo ============================================================
echo A16 DATABASE READY
echo ============================================================
echo.
echo New database:
echo   - The FIRST registered account automatically becomes ADMIN.
echo.
echo Existing A15 database:
echo   - Existing accounts receive TEACHER access by default.
echo   - If there is no ADMIN, run PROMOTE-A16-ADMIN.cmd once.
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo A16 SETUP FAILED
echo Review the error above and run this file again.
echo ============================================================
echo.
pause
exit /b 1
