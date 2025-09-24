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
    echo Cleaning previous builds...
    rmdir /s /q out
)

REM Build for both 64-bit and 32-bit
echo Building 64-bit version...
call npx electron-packager . "Text Compare" --platform=win32 --arch=x64 --out=out --overwrite
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build 64-bit version.
    pause
    exit /b 1
)

echo.
echo Building 32-bit version...
call npx electron-packager . "Text Compare" --platform=win32 --arch=ia32 --out=out --overwrite
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build 32-bit version.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Executable locations:
echo   64-bit: out\Text Compare-win32-x64\Text Compare.exe
echo   32-bit: out\Text Compare-win32-ia32\Text Compare.exe
echo.
pause