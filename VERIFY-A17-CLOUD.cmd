@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VERIFY VLEARNING A17 CLOUD
echo ============================================================
echo.

findstr /C:"A17 CLOUD DATA FOUNDATION" "app\projects\page.tsx" >nul
if errorlevel 1 (
  echo FAIL: A17 projects page is not installed.
  goto :error
)
echo OK: A17 Projects UI installed.

if not exist "prisma\cloud\schema.prisma" (
  echo FAIL: prisma\cloud\schema.prisma missing.
  goto :error
)
echo OK: PostgreSQL schema exists.

if not exist "generated\cloud-prisma\index.js" (
  echo FAIL: Cloud Prisma Client has not been generated.
  echo Run SETUP-A17-CLOUD.cmd first.
  goto :error
)
echo OK: Cloud Prisma Client generated.

findstr /B /C:"CLOUD_DATABASE_URL=" ".env" >nul 2>nul
if errorlevel 1 (
  echo FAIL: CLOUD_DATABASE_URL not found in .env.
  goto :error
)
echo OK: CLOUD_DATABASE_URL configured.

echo.
call node scripts\check-a17-cloud.mjs
if errorlevel 1 goto :error

echo.
echo ============================================================
echo A17 VERIFY: ALL CORE CHECKS PASSED
echo ============================================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================================
echo A17 VERIFY FAILED
echo ============================================================
echo.
pause
exit /b 1
