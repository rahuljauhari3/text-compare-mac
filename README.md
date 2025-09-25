# Text Compare

A cross-platform desktop app (Electron) to compare two text files side-by-side with a modern UI and dark/light theme. Works on macOS and Windows.

All processing happens locally on your machine.

## Prerequisites

- Node.js (https://nodejs.org/)
- npm (comes with Node.js)

## Run

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npm start
```

## Build

### macOS (.app)

Step-by-step on macOS
1) Clean previous builds (optional)
```bash
rm -rf out
```
2) Package the app for your current CPU
```bash
npx electron-packager . "Text Compare" --platform=darwin --arch=$(node -p "process.arch") --out=out --overwrite
```
3) Open the built app
```bash
open "out/Text Compare-darwin-$(node -p "process.arch")/Text Compare.app"
```

Where is the .app?
- out/Text Compare-darwin-$(node -p "process.arch")/Text Compare.app

Build for a specific CPU (optional)
- Apple Silicon (arm64):
```bash
npx electron-packager . "Text Compare" --platform=darwin --arch=arm64 --out=out --overwrite
```
- Intel (x64):
```bash
npx electron-packager . "Text Compare" --platform=darwin --arch=x64 --out=out --overwrite
```

Clean up (remove build artifacts)
```bash
rm -rf out
```

### Windows (.exe)

#### Method 1: Using the batch script (Recommended)

Simply run the provided batch script:
```cmd
build-windows.bat
```

This will automatically:
- Check for Node.js and npm
- Install dependencies
- Build both 64-bit and 32-bit versions
- Place executables in the `out` folder

#### Method 2: Using npm scripts

Build for all Windows architectures:
```cmd
npm run build:win
```

Build for 64-bit Windows only:
```cmd
npm run build:win64
```

Build for 32-bit Windows only:
```cmd
npm run build:win32
```

#### Method 3: Manual build

1. Clean previous builds (optional)
```cmd
rmdir /s /q out
```

2. Build for 64-bit Windows
```cmd
npx electron-packager . "Text Compare" --platform=win32 --arch=x64 --out=out --overwrite
```

3. Build for 32-bit Windows
```cmd
npx electron-packager . "Text Compare" --platform=win32 --arch=ia32 --out=out --overwrite
```

Where is the .exe?
- 64-bit: `out\Text Compare-win32-x64\Text Compare.exe`
- 32-bit: `out\Text Compare-win32-ia32\Text Compare.exe`

Clean up (remove build artifacts)
```cmd
rmdir /s /q out
```

## Use

- Click "Open Left…" and "Open Right…" to pick files, or drag-and-drop onto the drop zones.
- Differences are highlighted per-line, with inline character-level highlights for modified lines.
- Toggle theme in the header: System / Light / Dark. "System" follows your OS theme automatically.

## Notes

- This app uses the system WebView via Electron and requires Node.js. It runs fully offline once dependencies are installed.
- No file contents are uploaded or sent anywhere.
- Cross-platform: Works on macOS and Windows (both 64-bit and 32-bit).

## Platform Support

| Platform | Architecture | Status |
|----------|-------------|--------|
| macOS    | Apple Silicon (arm64) | ✅ Supported |
| macOS    | Intel (x64) | ✅ Supported |
| Windows  | 64-bit (x64) | ✅ Supported |
| Windows  | 32-bit (ia32) | ✅ Supported |
| Linux    | Various | 🔄 Future support planned |

