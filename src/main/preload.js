const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件对话框
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // 保存文件对话框
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // 写入文件
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  
  // 读取文件
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  
  // 获取平台信息
  platform: process.platform
});

// 暴露配置存储 API
contextBridge.exposeInMainWorld('configAPI', {
  get: (key) => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  },
  
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  remove: (key) => {
    localStorage.removeItem(key);
  }
});
