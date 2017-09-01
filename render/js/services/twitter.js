angular.module('twitterminer').service('twitterService', ['$q',
  function($q) {
    'use strict';

    var ipc = require("electron").ipcRenderer;

    var logIn = "LOG_IN";
    var verifyCredentials = "VERIFY_CREDENTIALS";
    var getFollowers = "GET_FOLLOWERS";
    var userLookUp = "USER_LOOK_UP";
    var doneMining = "DONE_MINING";
    var checkPending = "CHECK_PENDING";

    var verifyCredentialsPromise;
    var logInPromise;
    var getFollowersPromise;
    var userLookupPromise;
    var doneMiningPromise;
    var checkPendingPromise;

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

    ipc.on(doneMining, function(event, arg) {
      if(arg === 0) {
        doneMiningPromise.resolve(arg);
      } else if(arg === -1) {
        doneMiningPromise.reject(arg);
      }
    });

    ipc.on(checkPending, function(event, arg) {
      checkPendingPromise.resolve(arg);
    });

    return {
      logIn: function() {
        ipc.send(logIn);
        logInPromise = $q.defer();
        return logInPromise.promise;
      },
      verifyCredentials: function() {
        ipc.send(verifyCredentials);
        verifyCredentialsPromise = $q.defer();
        return verifyCredentialsPromise.promise;

      },
      getFollowers: function(screenName, cursor, count) {
        ipc.send(getFollowers, {screenName: screenName, cursor: cursor, count: count});
        getFollowersPromise = $q.defer();
        return getFollowersPromise.promise;
      },
      userLookup: function(parameters) {
        ipc.send(userLookUp, parameters);
        userLookupPromise = $q.defer();
        return userLookupPromise.promise;
      },
      doneMining: function() {
        ipc.send(doneMining);
        doneMiningPromise = $q.defer();
        return doneMiningPromise.promise;
      },
      checkPending: function() {
        ipc.send(checkPending);
        checkPendingPromise = $q.defer();
        return checkPendingPromise.promise;
      }
    };
  }
]);
