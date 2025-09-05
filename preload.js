'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  getSystemTheme: () => ipcRenderer.invoke('theme:getSystem'),
  onSystemThemeUpdated: (handler) => {
    const listener = (_event, theme) => handler(theme);
    ipcRenderer.on('theme:system-updated', listener);
    return () => ipcRenderer.removeListener('theme:system-updated', listener);
  }
});

