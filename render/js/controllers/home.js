angular.module('twitterminer').controller('HomeCtrl', function ($interval, $scope, twitterService) {
    'use strict';

    var stop;
    var pageSize = 100;
    var currentPage = 0;

    var vm = this;

    var init = function() {
      vm.screenName = '';
      vm.loading = true;

      vm.pageSize = 50;
      vm.currentPage = 1;
      vm.pagesSelectOptions = [10, 20, 50, 100];

      vm.headersDescription = ['Username', 'Screen name', 'URL'];
      vm.headersName = ['name', 'screen_name', 'url'];

      twitterService.verifyCredentials().then(
        function(data) {
          if(data.errors === undefined) {
            vm.loggedIn = true;
            vm.username = data.name;
          } else {
            vm.loggedIn = false;
          }

          vm.loading = false;
        }
      );
    };

    init();

    var userLookup = function() {
      var offset = currentPage*pageSize;
      var usersPage = vm.userIDs.slice(offset, offset+pageSize);

      twitterService.userLookup(usersPage.join()).then(
        function(data) {
          angular.forEach(data, function(follower) {
            var f = {};
            angular.forEach(vm.headersName, function(header) {
              f[header] = follower[header];
            });

            vm.followers.push(f);
          });

          if(usersPage.length < pageSize) {
            $interval.cancel(stop);
          }

          currentPage++;
          vm.requestsCount++;
          vm.loading = false;
        }
      );
    };

    vm.run = function () {
      this.followers = [];
      this.userIDs = [];
      vm.loading = true;
      twitterService.getFollowers(this.screenName).then(
        function(data) {
          vm.userIDs = data.ids;
          vm.totalRequests = (vm.userIDs.length/pageSize);
          vm.requestsCount = 0;

          stop = $interval(function () {
            userLookup(vm.userIDs);
          }, 500);
        }
      );
    };

    vm.logIn = function() {
      twitterService.logIn().then(
        function(data) {
          vm.loggedIn = true;
        }
      );
    };
  });
