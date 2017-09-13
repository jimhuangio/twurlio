'use strict';
const electron = require('electron');
const app = electron.app;
const fs = require('fs');
const BrowserWindow = electron.BrowserWindow;
const constants = require('./constants');

let mainWindow;
let count = 0;

app.on('ready', function() {
  function init() {
    count++;
    if(count === 2) {
      const application = require('./ipc/application');
      const twitter = require('./ipc/twitter');

      mainWindow = new BrowserWindow({center: true, width: 1000, height: 800});
      mainWindow.loadURL('file://' + __dirname + '/../render/index.html');
      mainWindow.on('closed', function() {
        mainWindow = null;
      });

      // mainWindow.webContents.openDevTools();
    }
  }

  let CONFIG_FILENAME = constants.FILES_PATH + 'config.json';
  fs.readFile(CONFIG_FILENAME, 'utf8', function(configErr, status) {
    if(configErr) {
      var config = {appKey:"", appSecret:"", accessToken:"", accessTokenSecret:""};
      fs.writeFile(CONFIG_FILENAME, JSON.stringify(config), 'utf8', function (err) {
        init();
      });
    } else {
      init();
    }
  });

  fs.readFile(constants.FILES_PATH + constants.MINING_STATUS_FILENAME, 'utf8', function(err, status) {
    if(err) {
      let mining = {screenName: null,followersCursor: null,lookupPage: null};
      fs.writeFile(constants.FILES_PATH + constants.MINING_STATUS_FILENAME, JSON.stringify(mining), 'utf8', function (err) {
        init();
      });
    } else {
      init();
    }
  });
});

app.on('window-all-closed', function() {
  if(process.platform !== 'darwin') {
    app.quit();
  }
});
