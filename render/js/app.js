if (typeof $ === 'undefined') { throw new Error('This application\'s JavaScript requires jQuery'); }

var App = angular.module('twitterminer', [
  'ngAnimate',
  'ngCookies',
  'ui.bootstrap',
  'ngSanitize',
  'ngResource'
]);

App.config(['$compileProvider', function ($compileProvider) {
  'use strict';
  $compileProvider.debugInfoEnabled(false);
}]);
