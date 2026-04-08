'use strict';

const { app, BrowserWindow, ipcMain, dialog, systemPreferences } = require('electron');
const path   = require('path');
const store  = require('./settingsStore');
const input  = require('./inputMonitor');
const { createTray } = require('./tray');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 620,
    height: 680,
    minWidth: 540,
    minHeight: 580,
    title: 'SmashMoans',
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── IPC handlers ────────────────────────────────────────────────────────────

ipcMain.handle('settings:get', () => store.getSettings());

ipcMain.handle('background:get', () => store.getBackground());

ipcMain.handle('background:save', (_event, bg) => {
  store.saveBackground(bg);
});

ipcMain.handle('background:selectImage', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose Background Image',
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif'] }
    ],
    properties: ['openFile']
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('settings:save', (_event, triggers) => {
  store.saveSettings(triggers);
});

ipcMain.handle('settings:selectSound', async (_event, _triggerId) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Sound File',
    filters: [
      { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm'] }
    ],
    properties: ['openFile']
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('assets:resolve', (_event, relativePath) => {
  return path.join(__dirname, '../../', relativePath);
});

// ── macOS accessibility permission prompt ────────────────────────────────────

function requestMacAccessibility() {
  if (process.platform !== 'darwin') return;
  const trusted = systemPreferences.isTrustedAccessibilityClient(false);
  if (!trusted) {
    systemPreferences.isTrustedAccessibilityClient(true);
  }
}

// ── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  requestMacAccessibility();

  createWindow();
  createTray(mainWindow);

  // Start global input hooks; push trigger events to renderer
  input.start((triggerId, data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('trigger', triggerId, data);
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  input.stop();
});

// Keep app alive when all windows are closed (tray-only mode)
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    e.preventDefault?.();
  }
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
