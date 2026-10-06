const { contextBridge, ipcRenderer } = require('electron');

// 只暴露确定的桌面操作；产品源码拿不到 Node、磁盘路径读写或任意 IPC。
const subscribe = (channel, callback) => {
  const listener = (_event, value) => callback(value);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};
contextBridge.exposeInMainWorld('companionDesktop', {
  load: () => ipcRenderer.invoke('desktop:load'),
  commit: storage => ipcRenderer.invoke('desktop:commit', storage),
  window: () => ipcRenderer.invoke('desktop:window'),
  mode: mode => ipcRenderer.invoke('desktop:mode', mode),
  pin: enabled => ipcRenderer.invoke('desktop:pin', enabled),
  hide: () => ipcRenderer.invoke('desktop:hide'),
  minimize: () => ipcRenderer.invoke('desktop:minimize'),
  quit: () => ipcRenderer.invoke('desktop:quit'),
  openSaveFolder: () => ipcRenderer.invoke('desktop:save-folder'),
  ready: () => ipcRenderer.send('desktop:ready'),
  acknowledge: (id, error) => ipcRenderer.send('desktop:checkpoint-result', { id, error }),
  onState: callback => subscribe('desktop:state', callback),
  onCommand: callback => subscribe('desktop:command', callback),
});
