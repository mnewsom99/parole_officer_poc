@echo off
setlocal
echo ===================================================
echo   Starting Parole Officer System
echo ===================================================
echo.

:: 1. Navigate to the project folder
cd /d "c:\Users\mnews\OneDrive\Documents\AI_Projects\parole-officer-poc"

:: 2. Check for Docker
echo [*] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker is NOT running.
    echo [*] Attempting to start Docker Desktop...
    
    :: Try standard installation paths
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo [!] Could not find Docker Desktop executable. Please start Docker manually.
        pause
        exit /b 1
    )
    
    echo [*] Waiting for Docker to initialize (this may take a minute^)...
    :WAIT_LOOP
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto WAIT_LOOP
    echo [*] Docker is now running!
) else (
    echo [*] Docker is already running.
)

:: 3. Start Database Containers
echo.
echo [*] Starting Database ^& Redis Containers...
docker-compose up -d db redis
if %errorlevel% neq 0 (
    echo [!] Failed to start containers. Please check Docker logs.
    pause
    exit /b 1
)

:: 4. Run the manager script
echo.
echo [*] Launching Application Manager...
python manage.py

:: 5. Pause on exit
pause
