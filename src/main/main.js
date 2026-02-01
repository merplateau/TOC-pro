const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // macOS 原生标题栏
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理：打开文件对话框
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const fileBuffer = fs.readFileSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      data: fileBuffer
    };
  }

  return null;
});

// IPC 处理：保存文件对话框
ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options.defaultPath || 'document.pdf',
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'JSON Files', extensions: ['json'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    return result.filePath;
  }

  return null;
});

// IPC 处理：写入文件
ipcMain.handle('fs:writeFile', async (event, filePath, data) => {
  try {
    const buffer = Buffer.from(data);
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC 处理：读取文件
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
