angular.module('twitterminer').controller('ModalResumeCtrl', function ($uibModalInstance, screenName) {
  'use strict';

  var vm = this;

  vm.$onInit = function () {
    vm.screenName = screenName;
  };

  vm.ok = function () {
    $uibModalInstance.close(true);
  };

  vm.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
