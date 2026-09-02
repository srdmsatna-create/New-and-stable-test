@echo off
setlocal EnableExtensions EnableDelayedExpansion

title SRDM SATNA - One Click Dashboard Data Update V69

REM Portable: repository is the folder containing this BAT file.
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

cls
echo ============================================================
echo      SRDM SATNA - DASHBOARD DATA UPDATE V69
echo ============================================================
echo Repo: %REPO%
echo Production path: Local Playwright ^> Merge ^> Validate ^> Push
echo.

cd /d "%REPO%" || exit /b 1

set "PYTHON_CMD="
where py >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py"
if not defined PYTHON_CMD (
    where python >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)
if not defined PYTHON_CMD (
    echo ERROR: Python is not installed or not available in PATH.
    pause
    exit /b 1
)

echo [1/7] Python detected: %PYTHON_CMD%

if not exist "scripts_local\local_auto_update.py" (
    echo ERROR: scripts_local\local_auto_update.py not found.
    pause
    exit /b 1
)

echo [2/7] Fetching official MIS data with local Playwright...
%PYTHON_CMD% "scripts_local\local_auto_update.py"
if errorlevel 1 goto :FAIL

echo [3/7] Merging official data...
%PYTHON_CMD% "scripts\merge_official_summary.py"
if errorlevel 1 goto :FAIL

echo [4/7] Archiving daily trend snapshot...
%PYTHON_CMD% "scripts\archive_daily_snapshot.py"
if errorlevel 1 goto :FAIL

echo [5/7] Validating generated data and repository...
%PYTHON_CMD% "scripts\validate_auto_data.py"
if errorlevel 1 goto :FAIL
%PYTHON_CMD% "scripts\validate_repository.py"
if errorlevel 1 goto :FAIL
%PYTHON_CMD% -m unittest discover -s tests -v
if errorlevel 1 goto :FAIL

echo [6/7] Publishing verified changes...
if not exist ".git" (
    echo Git repository not detected. Local update is complete.
    goto :DONE
)
where git >nul 2>nul
if errorlevel 1 (
    echo Git command not found. Local update is complete.
    goto :DONE
)

git add auto-data.js auto-status.js ongoing-details.js data\official-summary.csv data\history\summary-history.csv fetch-status.json index.html app.js styles.css styles.min.css modules\ scripts\ README.md DEPLOY_V69.txt .gitignore .github\ tests\ manifest.webmanifest service-worker.js assets\
git diff --cached --quiet
if not errorlevel 1 (
    echo No verified changes to commit.
    goto :DONE
)

git commit -m "Verified dashboard data update"
if errorlevel 1 goto :FAIL

git pull --rebase
if errorlevel 1 goto :FAIL

git push
if errorlevel 1 goto :FAIL

:DONE
echo [7/7] COMPLETE
echo ============================================================
echo SUCCESS - VERIFIED DASHBOARD UPDATE COMPLETE
echo Open srdmsatna.online after GitHub Pages deploys the commit.
echo ============================================================
pause
exit /b 0

:FAIL
echo.
echo ERROR: Update stopped. No unverified data should be pushed.
pause
exit /b 1
