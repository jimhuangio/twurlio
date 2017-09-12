angular.module('twitterminer').service('applicationService', ['$q',
  function($q) {
    'use strict';

    var ipc = require("electron").ipcRenderer;

    var promise;
    var doneMining = 'DONE_MINING';
    var checkPending = 'CHECK_PENDING';
    var checkKeys = 'CHECK_KEYS';
    var saveKeys = 'SAVE_KEYS';
    var newFileImport = 'NEW_FILE_IMPORT';

    ipc.on(doneMining, function(event, arg) {
      if(arg.status === 0) {
        promise.resolve(arg);
      } else if(arg.status === -1) {
        promise.reject(arg);
      }
    });

    ipc.on(checkPending, function(event, arg) {
      promise.resolve(arg);
    });

    ipc.on(checkKeys, function(event, arg) {
      promise.resolve(arg);
    });

    ipc.on(saveKeys, function(event, arg) {
      promise.resolve(arg);
    });

    ipc.on(newFileImport, function(event, arg) {
      if(arg.data) {
        promise.resolve(arg);
      } else {
        promise.reject(arg);
      }
    });

    return {
      doneMining: function() {
        ipc.send(doneMining);
        promise = $q.defer();
        return promise.promise;
      },
      checkPending: function() {
        ipc.send(checkPending);
        promise = $q.defer();
        return promise.promise;
      },
      checkKeys: function() {
        ipc.send(checkKeys);
        promise = $q.defer();
        return promise.promise;
      },
      saveKeys: function(data) {
        ipc.send(saveKeys, data);
        promise = $q.defer();
        return promise.promise;
      },
      newFileImport: function(data) {
        ipc.send(newFileImport, data);
        promise = $q.defer();
        return promise.promise;
      }
    };
  }
]);
