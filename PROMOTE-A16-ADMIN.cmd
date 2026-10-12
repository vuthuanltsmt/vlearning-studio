@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLEARNING STUDIO A16 - PROMOTE ADMIN
echo ============================================================
echo.
call node scripts\promote-admin.mjs
echo.
pause
