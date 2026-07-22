import { contextBridge, ipcRenderer } from 'electron'

// Desktop mode: override localStorage to use electron-store for persistence
const isElectron = !!window.electronAPI

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getDataPath: () => ipcRenderer.invoke('get-app-path'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),

  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },

  window: {
    minimize: () => ipcRenderer.invoke('minimize-window'),
    maximize: () => ipcRenderer.invoke('maximize-window'),
    close: () => ipcRenderer.invoke('close-window'),
  },

  setMinimizeToTray: (v) => ipcRenderer.invoke('toggle-tray', v),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})

// Detect desktop mode
contextBridge.exposeInMainWorld('isDesktop', true)
