angular.module('twitterminer').controller('ModalApplicationKeysCtrl', function ($uibModalInstance) {
  'use strict';

  var vm = this;

  vm.result = {};

  vm.ok = function () {
    $uibModalInstance.close(vm.result);
  };
});
