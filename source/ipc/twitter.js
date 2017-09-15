const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const OAuth = require('oauth');
const OauthTwitter = require('electron-oauth-twitter');
const fs = require('fs');
const csv = require('fast-csv');
const constants = require('../constants');
const columns = require('../columns');

const LOG_IN = 'LOG_IN';
const VERIFY_CREDENTIALS = 'VERIFY_CREDENTIALS';
const GET_FOLLOWERS = 'GET_FOLLOWERS';
const USER_LOOK_UP = 'USER_LOOK_UP';

let ouathRequest = function(url, ipcEvent, ipcKey, callback) {
  fs.readFile(constants.FILES_PATH + 'config.json', 'utf8', function(err, result) {
    let config = JSON.parse(result);

    const oauth = new OAuth.OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      config.appKey,
      config.appSecret,
      '1.0A',
      null,
      'HMAC-SHA1'
    );

    oauth.get(
      url,
      config.accessToken,
      config.accessTokenSecret,
      function (e, data, res) {
        let result;
        if (e) {
          console.log(e);
          result = {statusCode: e.statusCode};
        } else {
          result = JSON.parse(data);

          if(callback !== undefined) {
            callback(result);
          }
        }

        ipcEvent.sender.send(ipcKey, result);
      }
    );
  });
};

ipc.on(LOG_IN, function(ipcEvent, data) {
  fs.readFile(constants.FILES_PATH + 'config.json', 'utf8', function(err, result) {
    let config = JSON.parse(result);

    let twitter = new OauthTwitter({
      key: config.appKey,
      secret: config.appSecret
    });

    twitter.startRequest().then(function(result) {
      config.accessToken = result.oauth_access_token;
      config.accessTokenSecret = result.oauth_access_token_secret;

      fs.writeFile(constants.FILES_PATH + 'config.json', JSON.stringify(config), 'utf8', function (err) {
        if (err) {
          dialog.showErrorBox(err);
        }

        ipcEvent.sender.send(LOG_IN, {status: 'OK'});
      });
    }).catch(function(error) {
      ipcEvent.sender.send(LOG_IN, {status: 'ERROR'});
      dialog.showErrorBox(error.stack);
    });
  });
});

ipc.on(VERIFY_CREDENTIALS, function(ipcEvent, data) {
  fs.readFile(constants.FILES_PATH + 'config.json', 'utf8', function(err, result) {
    let config = JSON.parse(result);

    if(config.accessToken === "" || config.accessTokenSecret === "") {
      ipcEvent.sender.send(VERIFY_CREDENTIALS, {errors: "NO_KEYS"});
    } else {
      let url = 'https://api.twitter.com/1.1/account/verify_credentials.json';
      ouathRequest(url, ipcEvent, VERIFY_CREDENTIALS);
    }
  });
});

ipc.on(GET_FOLLOWERS, function(ipcEvent, d) {
  let data = {screenName: d.screenName, followersCursor: d.cursor, lookupPage: 0};

  // Save current followerCursor and clear lookupPage
  fs.writeFile(constants.FILES_PATH + constants.MINING_STATUS_FILENAME, JSON.stringify(data), 'utf8', function (err) {
    if (err) {
      console.log(err);
    } else {
      // Get next followers IDs
      let url = 'https://api.twitter.com/1.1/followers/ids.json?screen_name=' + d.screenName + '&cursor=' + d.cursor + '&count=' + d.count;
      ouathRequest(url, ipcEvent, GET_FOLLOWERS, function(result) {
        let followersFileName = constants.FILES_PATH + d.screenName + constants.FOLLOWERS_IDS_FILENAME;

        // Read already saved followers file in order to updated them later
        fs.readFile(followersFileName, 'utf8', function(err, content) {
          let newData;
          if(content === undefined) {
            newData = result.ids;
          } else {
            newData = JSON.parse(content);
            newData = newData.concat(result.ids);
          }

          // Update followers list file with latest results obtained
          fs.writeFile(followersFileName, JSON.stringify(newData), 'utf8', function() {});
        });
      });
    }
  });
});

ipc.on(USER_LOOK_UP, function(ipcEvent, d) {
  function sendRequest(parameters, callback) {
    let url = 'https://api.twitter.com/1.1/users/lookup.json?' + parameters;
    ouathRequest(url, ipcEvent, USER_LOOK_UP, callback);
  }

  function requestCallback(result) {
    result.forEach(function(follower) {
      let CSVLine = '';

      follower.name = follower.name.replace(/"/g, '');

      columns.forEach(function(column, index) {
        CSVLine += '\"' + follower[column.key] + '\"';

        if(index !== columns.length-1) {
          CSVLine += ',';
        } else {
          if(follower.entities && follower.entities.url) {
            CSVLine += ',' + follower.entities.url.urls["0"].expanded_url;
          }

          CSVLine += '\n';
        }
      });

      fs.appendFile(constants.FILES_PATH + d.screenName + constants.USER_LOOKUP_FILENAME, CSVLine, function (err) {
        if (err) throw err;
      });
    });
  }

  function createHeader(callback) {
    let CSVHeaderLine = '';

    columns.forEach(function(column, index) {
      CSVHeaderLine += '\"' + column.description + '\"';

      if(index !== columns.length-1) {
        CSVHeaderLine += ',';
      } else {
        CSVHeaderLine += ',\"URL\"\n';
      }
    });

    fs.appendFile(constants.FILES_PATH + d.screenName + constants.USER_LOOKUP_FILENAME, CSVHeaderLine, callback);
  }

  if(d.page !== undefined && d.userIDs !== undefined) {
    let data = {screenName: d.screenName, followersCursor: null, lookupPage: d.page};

    // Save current lookupPage and clear followersCursor
    fs.writeFile(constants.FILES_PATH + constants.MINING_STATUS_FILENAME, JSON.stringify(data), 'utf8', function (err) {
      if (err) {
        console.log(err);
      }

      if(d.page === 0) {
        createHeader(function() {
          sendRequest('user_id=' + d.userIDs, requestCallback);
        });
      } else {
        sendRequest('user_id=' + d.userIDs, requestCallback);
      }
    });
  } else if(d.screenName) {
    sendRequest('screen_name=' + d.screenName);
  }
});
