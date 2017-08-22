angular.module('twitterminer').service('twitterService', ['$q',
  function($q) {
    'use strict';

    var ipc = require("electron").ipcRenderer;

    var logIn = "LOG_IN";
    var verifyCredentials = "VERIFY_CREDENTIALS";
    var getFollowers = "GET_FOLLOWERS";
    var userLookUp = "USER_LOOK_UP";

    var verifyCredentialsPromise;
    var logInPromise;
    var getFollowersPromise;
    var userLookupPromise;

    ipc.on(logIn, function(event, arg) {
      logInPromise.resolve(arg);
    });

    ipc.on(verifyCredentials, function(event, arg) {
      verifyCredentialsPromise.resolve(arg);
    });

    ipc.on(getFollowers, function(event, arg) {
      getFollowersPromise.resolve(arg);
    });

    ipc.on(userLookUp, function(event, arg) {
      userLookupPromise.resolve(arg);
    });

    return {
      logIn: function(callback) {
        ipc.send(logIn);
        logInPromise = $q.defer();
        return logInPromise.promise;
      },
      verifyCredentials: function(callback) {
        ipc.send(verifyCredentials);
        verifyCredentialsPromise = $q.defer();
        return verifyCredentialsPromise.promise;

      },
      getFollowers: function(screenName, callback) {
        ipc.send(getFollowers, {screenName: screenName});
        getFollowersPromise = $q.defer();
        return getFollowersPromise.promise;
      },
      userLookup: function(userIDs, callback) {
        ipc.send(userLookUp, {userIDs: userIDs});
        userLookupPromise = $q.defer();
        return userLookupPromise.promise;
      }
    };
  }
]);
