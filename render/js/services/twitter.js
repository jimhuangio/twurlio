angular.module('twitterminer').service('twitterService', ['$q',
  function($q) {
    'use strict';

    var ipc = require("electron").ipcRenderer;

    var promise;
    var logIn = 'LOG_IN';
    var verifyCredentials = 'VERIFY_CREDENTIALS';
    var getFollowers = 'GET_FOLLOWERS';
    var userLookUp = 'USER_LOOK_UP';

    ipc.on(logIn, function(event, arg) {
      promise.resolve(arg);
    });

    ipc.on(verifyCredentials, function(event, arg) {
      promise.resolve(arg);
    });

    ipc.on(getFollowers, function(event, arg) {
      promise.resolve(arg);
    });

    ipc.on(userLookUp, function(event, arg) {
      promise.resolve(arg);
    });

    return {
      logIn: function() {
        ipc.send(logIn);
        promise = $q.defer();
        return promise.promise;
      },
      verifyCredentials: function() {
        ipc.send(verifyCredentials);
        promise = $q.defer();
        return promise.promise;
      },
      getFollowers: function(screenName, cursor, count) {
        ipc.send(getFollowers, {screenName: screenName, cursor: cursor, count: count});
        promise = $q.defer();
        return promise.promise;
      },
      userLookup: function(parameters) {
        ipc.send(userLookUp, parameters);
        promise = $q.defer();
        return promise.promise;
      }
    };
  }
]);
