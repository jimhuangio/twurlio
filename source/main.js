'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const twitter = require('./ipc');

let mainWindow;

app.on('ready', function() {
  mainWindow = new BrowserWindow({center: true, width: 1000, height: 800});
  mainWindow.loadURL('file://' + __dirname + '/../render/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
