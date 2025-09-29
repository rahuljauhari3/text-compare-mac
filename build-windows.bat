@echo off
echo ========================================
echo Text Compare - Windows Build Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH.
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Building for Windows...
echo.

REM Clean previous builds
if exist out (
    echo Cleaning previous builds (out)...
    rmdir /s /q out
)
if exist dist (
    echo Cleaning previous builds (dist)...
    rmdir /s /q dist
)

REM Build Windows installer using electron-builder
echo Building Windows installer...
call npx electron-builder --win
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build Windows installer.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Windows installer created in: dist\
echo.
echo To install:
echo 1. Navigate to the 'dist' folder
echo 2. Run the 'Text Compare Setup.exe' file
echo 3. Follow the installation wizard
echo 4. The app will appear in Start Menu and Add/Remove Programs
echo.
pause