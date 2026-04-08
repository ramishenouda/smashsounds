'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Main → Renderer: fired when a trigger fires
  onTrigger: (callback) => {
    ipcRenderer.on('trigger', (_event, triggerId, data) => callback(triggerId, data));
  },

  // Trigger settings
  getSettings:    () => ipcRenderer.invoke('settings:get'),
  saveSettings:   (triggers) => ipcRenderer.invoke('settings:save', triggers),
  selectSoundFile:(triggerId) => ipcRenderer.invoke('settings:selectSound', triggerId),
  resolveAssetPath:(relativePath) => ipcRenderer.invoke('assets:resolve', relativePath),

  // Background settings
  getBackground:      () => ipcRenderer.invoke('background:get'),
  saveBackground:     (bg) => ipcRenderer.invoke('background:save', bg),
  selectBgImage:      () => ipcRenderer.invoke('background:selectImage')
});
