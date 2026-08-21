```bat
@echo off

echo ========================================
echo       Starting Placement App
echo ========================================

REM ========================================
REM Start Postgres (Docker) so local API/worker can connect
REM ========================================

echo.
echo Starting Postgres via Docker Compose...
docker compose up -d postgres

REM ========================================
REM Start Redis inside WSL
REM ========================================

echo.
echo Starting Redis in WSL...

wsl sudo service redis-server start

echo Checking Redis...

wsl redis-cli ping

REM ========================================
REM Start Backend
REM ========================================

echo.
echo Starting Backend...

start "Placement Backend" cmd /k "cd /d %~dp0backend && go run cmd/main.go"

REM ========================================
REM Start Frontend
REM ========================================

echo.
echo Starting Frontend...

start "Placement Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

REM ========================================
REM Start Worker
REM ========================================

echo.
echo Starting Worker...

start "Placement Worker" cmd /k "cd /d %~dp0worker && call Venv\Scripts\activate && python main.py"

echo.
echo ========================================
echo       Placement App Started
echo ========================================
echo.
echo Redis   : WSL
echo Backend : Windows
echo Frontend: Windows
echo Worker  : Windows
echo.
pause
```
