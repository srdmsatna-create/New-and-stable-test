@echo off
setlocal
cd /d "%~dp0"
title SRDM SATNA V69 - One Time Setup

echo ===============================================
echo   SRDM SATNA V69 - ONE-TIME LOCAL SETUP
echo ===============================================
echo Installing Python dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if errorlevel 1 goto :FAIL

echo.
echo Installing Chromium for local Playwright MIS fetch...
python -m playwright install chromium
if errorlevel 1 goto :FAIL

echo.
echo ===============================================
echo SETUP COMPLETE
echo Daily production updater:
echo ONE_CLICK_DASHBOARD_DATA_UPDATE.bat
echo ===============================================
pause
exit /b 0

:FAIL
echo.
echo SETUP FAILED. Read the error above and try again.
pause
exit /b 1
