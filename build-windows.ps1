# Text Compare - Windows Build Script (PowerShell)
# Creates a proper Windows installer that integrates with the system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Text Compare - Windows Installer Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: npm is not installed or not in PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
    Write-Host "✓ Cleaned out/ directory" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Cleaned dist/ directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "Building Windows installer..." -ForegroundColor Yellow
try {
    npx electron-builder --win
    Write-Host "✓ Windows installer built successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Failed to build Windows installer" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Windows installer created in: " -NoNewline -ForegroundColor Cyan
Write-Host "dist\" -ForegroundColor White
Write-Host ""
Write-Host "🚀 To install Text Compare:" -ForegroundColor Yellow
Write-Host "   1. Navigate to the 'dist' folder"
Write-Host "   2. Run 'Text Compare Setup *.exe'"
Write-Host "   3. Follow the installation wizard"
Write-Host "   4. The app will appear in:"
Write-Host "      • Start Menu" -ForegroundColor Green
Write-Host "      • Desktop shortcut (if selected)" -ForegroundColor Green
Write-Host "      • Add or Remove Programs" -ForegroundColor Green
Write-Host ""
Write-Host "✨ After installation, you can uninstall normally through Windows Settings" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"