'use strict';

const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';

function createWindow() {
  const windowOptions = {
    width: 1200,
    height: 800,
    minWidth: 920,
    minHeight: 600,
    title: 'Text Compare',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1f1f1f' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: true
    }
  };

  // macOS-specific options
  if (isMac) {
    windowOptions.trafficLightPosition = { x: 12, y: 12 };
    windowOptions.vibrancy = 'under-window';
    windowOptions.visualEffectState = 'active';
  }

  const win = new BrowserWindow(windowOptions);

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  // On Windows and Linux, quit the app
  if (!isMac) app.quit();
});

// Open file dialog and return selected path
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choose a text file',
    properties: ['openFile'],
    filters: [
      { name: 'Text', extensions: ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'rb', 'go', 'rs', 'c', 'cpp', 'h', 'hpp', 'xml', 'yml', 'yaml', 'toml', 'ini', 'sh', 'csv', 'log'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (canceled || !filePaths || filePaths.length === 0) return null;
  return filePaths[0];
});

// Read a file's content
ipcMain.handle('file:read', async (_event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

// Theme helpers
ipcMain.handle('theme:getSystem', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

nativeTheme.on('updated', () => {
  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('theme:system-updated', theme);
  });
});

