'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Main → Renderer: fired when a trigger fires
  onTrigger: (callback) => {
    ipcRenderer.on('trigger', (_event, triggerId, data) => callback(triggerId, data));
  },

  // Get current settings object
  getSettings: () => ipcRenderer.invoke('settings:get'),

  // Save updated settings object
  saveSettings: (triggers) => ipcRenderer.invoke('settings:save', triggers),

  // Open OS file dialog and return selected path (or null if cancelled)
  selectSoundFile: (triggerId) => ipcRenderer.invoke('settings:selectSound', triggerId),

  // Resolve a relative asset path to an absolute path
  resolveAssetPath: (relativePath) => ipcRenderer.invoke('assets:resolve', relativePath)
});
