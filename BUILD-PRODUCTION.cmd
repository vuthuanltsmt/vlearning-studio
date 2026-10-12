@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLearning Studio 1.0 - Production Build
echo ============================================================
echo.

if not exist "package.json" (
  echo [ERROR] Khong tim thay package.json.
  echo Hay dat file nay trong thu muc goc elearning-studio.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] node_modules chua co. Dang cai dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] npm install that bai.
    pause
    exit /b 1
  )
)

echo [1/2] Xoa build cu...
if exist ".next" rmdir /s /q ".next"

echo [2/2] Build production...
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo [ERROR] BUILD THAT BAI. Khong nen dung production cho den khi sua xong loi tren.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo BUILD THANH CONG - VLearning Studio 1.0 san sang chay.
echo Chay START-VLEARNING.cmd de su dung.
echo ============================================================
pause
exit /b 0
