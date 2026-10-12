@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo VLearning Studio 1.0 - Quick Check
echo ============================================================
echo.

set FAIL=0

call :checkfile "components\preview\PreviewPlayer.tsx"
call :checkfile "lib\scormExport.ts"
call :checkfile "components\editor\DesignModal.tsx"
call :checkfile "lib\projectTheme.ts"
call :checkfile "lib\certificateTemplates.ts"
call :checkfile "types\theme.ts"

findstr /c:"Xem lại nội dung" "components\preview\PreviewPlayer.tsx" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Preview chua co Review Mode V12.4C
  set FAIL=1
) else (
  echo [OK] Review Mode Preview
)

findstr /c:"enterReviewMode" "lib\scormExport.ts" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] SCORM chua co Review Mode V12.4C
  set FAIL=1
) else (
  echo [OK] Review Mode SCORM
)

findstr /c:"courseOutroEnabled" "lib\projectTheme.ts" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Chua co Course Outro
  set FAIL=1
) else (
  echo [OK] Course Outro
)

findstr /c:"courseIntroEnabled" "lib\projectTheme.ts" >nul 2>&1
if errorlevel 1 (
  echo [FAIL] Chua co Course Intro
  set FAIL=1
) else (
  echo [OK] Course Intro
)

echo.
if "%FAIL%"=="1" (
  echo [RESULT] CHUA DAT - co file/tinh nang thieu.
  pause
  exit /b 1
)

echo [RESULT] KIEM TRA NHANH DAT.
echo Tiep theo chay BUILD-PRODUCTION.cmd.
pause
exit /b 0

:checkfile
if not exist %1 (
  echo [FAIL] Thieu %~1
  set FAIL=1
) else (
  echo [OK] %~1
)
exit /b 0
