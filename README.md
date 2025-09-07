# Text Compare (macOS)

A local macOS desktop app (Electron) to compare two text files side-by-side with a modern UI and dark/light theme.

All processing happens locally on your machine.

## Run

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npm start
```

## Build (.app)

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

## Use

- Click "Open Left…" and "Open Right…" to pick files, or drag-and-drop onto the drop zones.
- Differences are highlighted per-line, with inline character-level highlights for modified lines.
- Toggle theme in the header: System / Light / Dark. "System" follows macOS automatically.

## Notes

- This app uses the system WebView via Electron and requires Node.js. It runs fully offline once dependencies are installed.
- No file contents are uploaded or sent anywhere.

