angular.module('twitterminer').controller('ModalResumeCtrl', function ($uibModalInstance, screenName) {
  'use strict';

  var $ctrl = this;

  $ctrl.$onInit = function () {
    $ctrl.screenName = screenName;
  };

  $ctrl.ok = function () {
    $uibModalInstance.close(true);
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});
