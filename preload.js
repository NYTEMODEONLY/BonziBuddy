const { contextBridge, ipcRenderer } = require('electron');

// Expose secure IPC bridge to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Window management
  windowMoving: (data) => ipcRenderer.send('windowMoving', data),
  windowMoved: () => ipcRenderer.send('windowMoved'),
  resizeWindow: (size) => ipcRenderer.send('resizeWindow', size),

  // Menu operations
  showContextMenu: () => ipcRenderer.invoke('showContextMenu'),
  openMainMenu: () => ipcRenderer.send('openMainMenu'),
  openSettingsMenu: () => ipcRenderer.send('openSettingsMenu'),

  // App control
  closeProgram: (code) => ipcRenderer.send('closeProgram', code),
  onCloseProgram: (callback) => {
    ipcRenderer.on('closeProgram', () => callback());
    return () => ipcRenderer.removeAllListeners('closeProgram');
  },

  // External links
  openExternal: (url) => ipcRenderer.invoke('openExternal', url),

  // AI Chat
  sendMessage: (message) => ipcRenderer.invoke('ai:sendMessage', message),
  setApiKey: (apiKey) => ipcRenderer.invoke('ai:setApiKey', apiKey),
  getApiKey: () => ipcRenderer.invoke('ai:getApiKey'),
  clearHistory: () => ipcRenderer.invoke('ai:clearHistory'),

  // Entertainment
  getEntertainment: (type) => ipcRenderer.invoke('entertainment:getContent', type),
  onEntertainment: (callback) => {
    ipcRenderer.on('entertainment', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('entertainment');
  },

  // Speech
  speak: (text) => ipcRenderer.send('speak', text),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // Chat UI
  openChatInput: () => ipcRenderer.send('openChatInput'),
  onOpenChatInput: (callback) => {
    ipcRenderer.on('openChatInput', () => callback());
    return () => ipcRenderer.removeAllListeners('openChatInput');
  },

  // Window expansion for chat
  expandWindowForChat: (dimensions) => ipcRenderer.send('expandWindowForChat', dimensions),
  shrinkWindowFromChat: (dimensions) => ipcRenderer.send('shrinkWindowFromChat', dimensions)
});
