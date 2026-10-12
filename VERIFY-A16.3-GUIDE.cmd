@echo off
cd /d "%~dp0"
echo ============================================================
echo VLEARNING A16.3 - GUIDE OPEN FIX VERIFY
echo ============================================================
findstr /C:"A16.3 GUIDE OPEN FIX" app\projects\page.tsx
if errorlevel 1 (
  echo.
  echo KHONG TIM THAY BAN SUA A16.3 TRONG page.tsx
  echo Hay giai nen lai ZIP vao dung C:\Users\Admin\elearning-studio
) else (
  echo.
  echo A16.3 DA DUOC CHEP DUNG VAO page.tsx
)
echo.
pause
