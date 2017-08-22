const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const OAuth = require('oauth');
const OauthTwitter = require('electron-oauth-twitter');
const fs = require('fs');
let config = require('./config');

const logIn = 'LOG_IN';
const verifyCredentials = 'VERIFY_CREDENTIALS';
const getFollowers = 'GET_FOLLOWERS';
const userLookUp = 'USER_LOOK_UP';

var APP_KEY = '';
var APP_SECRET = '';

const oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  APP_KEY,
  APP_SECRET,
  '1.0A',
  null,
  'HMAC-SHA1'
);

let ouathRequest = function(url, ipcEvent, ipcKey) {
  oauth.get(
    url,
    config.accessToken,
    config.accessTokenSecret,
    function (e, data, res) {
      if (e) {
        dialog.showErrorBox(e);
      }
      ipcEvent.sender.send(ipcKey, JSON.parse(data));
    }
  );
};

ipc.on(logIn, function(ipcEvent, data) {
  let twitter = new OauthTwitter({
    key: APP_KEY,
    secret: APP_SECRET
  });

  twitter.startRequest().then(function(result) {
    let config = {};
    config.accessToken = result.oauth_access_token;
    config.accessTokenSecret = result.oauth_access_token_secret;

    fs.writeFile('./config.json', JSON.stringify(config), 'utf8', function (err) {
      if (err) {
        dialog.showErrorBox(err);
      }

      ipcEvent.sender.send(logIn, {status: 'OK'});
    });
  }).catch(function(error) {
    ipcEvent.sender.send(logIn, {status: 'ERROR'});
    dialog.showErrorBox(error.stack);
  });
});

ipc.on(verifyCredentials, function(ipcEvent, data) {
  if(config.accessToken === "" || config.accessTokenSecret === "") {
    ipcEvent.sender.send(verifyCredentials, {errors: "NO_KEYS"});
  } else {
    let url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    ouathRequest(url, ipcEvent, verifyCredentials);
  }
});

ipc.on(getFollowers, function(ipcEvent, d) {
  let url = 'https://api.twitter.com/1.1/followers/ids.json?screen_name=' + d.screenName;
  ouathRequest(url, ipcEvent, getFollowers);
});

ipc.on(userLookUp, function(ipcEvent, d) {
  let url = 'https://api.twitter.com/1.1/users/lookup.json?user_id=' + d.userIDs;
  ouathRequest(url, ipcEvent, userLookUp);
});
