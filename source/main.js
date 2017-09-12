'use strict';
const electron = require('electron');
const app = electron.app;
const fs = require('fs');
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

app.on('ready', function() {
  function init() {
    const application = require('./ipc/application');
    const twitter = require('./ipc/twitter');

    mainWindow = new BrowserWindow({center: true, width: 1000, height: 800});
    mainWindow.loadURL('file://' + __dirname + '/../render/index.html');
    mainWindow.on('closed', function() {
      mainWindow = null;
    });

    mainWindow.webContents.openDevTools();
  }

  var CONFIG_FILENAME = './source/config.json';
  fs.readFile(CONFIG_FILENAME, 'utf8', function(err, status) {
    if(err) {
      var config = {
        appKey:"",
        appSecret:"",
        accessToken:"",
        accessTokenSecret:""
      };

      fs.writeFile(CONFIG_FILENAME, JSON.stringify(config), 'utf8', function (err) {
        init();
      });
    } else {
      init();
    }
  });
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
