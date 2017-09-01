angular.module('twitterminer').controller('HomeCtrl', function ($timeout, $interval, $uibModal, twitterService) {
    'use strict';

    var API_RATE_LIMIT = 903000;
    var FOLLOWERS_IDS_PAGE_SIZE = 5000;
    var FOLLOWERS_DETAILS_PAGE_SIZE = 100;

    var vm = this;

    var stop;
    var interval;

    var currentUserDetailsPage;
    var followersCursor;

    var init = function() {
      vm.screenName = '';

      vm.loading = true;

      vm.pageSize = 10;
      vm.currentPage = 1;
      vm.pagesSelectOptions = [10, 20, 50, 100];

      vm.remainingClockTime = 0;

      vm.headersDescription = ['Username', 'Screen name', 'URL'];
      vm.headersName = ['name', 'screen_name', 'url'];

      twitterService.verifyCredentials().then(
        function(credentials) {
          if(credentials.errors === undefined) {
            vm.loggedIn = true;
            vm.username = credentials.name;

            twitterService.checkPending().then(
              function(data) {
                if(data.status.screenName !== null) {
                  var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'views/resume-modal.html',
                    controller: 'ModalResumeCtrl',
                    controllerAs: '$ctrl',
                    size: 'md',
                    resolve: {
                      screenName: function() {
                        return data.status.screenName;
                      }
                    }
                  });

                  modalInstance.result.then(function (result) {
                    if(result === true) {
                      vm.screenName = data.status.screenName;

                      vm.followers = [];

                      vm.followersIDsReceived = 0;
                      vm.followersIDsDiscarded = '';

                      vm.followersDetailsReceived = 0;
                      vm.followersDetailsDiscarded = '';

                      vm.searchEnabled = false;

                      twitterService.userLookup({screenName: vm.screenName}).then(
                        function(user) {
                          var rateExceeded;
                          vm.userIDs = data.userIDs;

                          if(data.status.followersCursor !== null) {
                            vm.status = 'Getting followers IDs ..';
                            rateExceeded = checkRateLimit(user, vm.run);
                            if(rateExceeded === false) {
                              vm.targetUser = user[0];
                              vm.requestsCount = data.userIDs.length/FOLLOWERS_IDS_PAGE_SIZE;
                              vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_IDS_PAGE_SIZE);
                              vm.progressBarRightText = vm.targetUser.followers_count;

                              followersCursor = data.status.followersCursor;

                              vm.followersIDsReceived += data.userIDs.length;
                              vm.progressBarLeftText = data.userIDs.length;

                              getFollowers();
                            }
                          } else if(data.status.lookupPage !== null) {
                            vm.status = 'Getting followers details ..';
                            rateExceeded = checkRateLimit(user, userLookup);
                            if(rateExceeded === false) {
                              vm.targetUser = user[0];
                              vm.followers = [];

                              currentUserDetailsPage = data.status.lookupPage;

                              vm.followersDetailsReceived = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
                              vm.progressBarLeftText = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
                              vm.progressBarRightText = vm.targetUser.followers_count;

                              vm.requestsCount = currentUserDetailsPage;
                              vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_DETAILS_PAGE_SIZE);

                              vm.followers = data.userLookupData;

                              userLookup();
                            }
                          }

                          vm.loading = false;
                        }
                      );
                    }
                  }, function () {
                    // modal dismissed
                  });
                }
              }
            );
          } else {
            vm.loggedIn = false;
          }

          vm.loading = false;
        }
      );
    };

    var startClock = function() {
      vm.remainingClockTime = API_RATE_LIMIT;

      interval = $interval(function () {
        vm.remainingClockTime -= 1000;
      }, 1000);
    };

    var stopClock = function() {
      $interval.cancel(interval);
      vm.remainingClockTime = 0;
    };

    var checkRateLimit = function(data, callback) {
      if(data.statusCode === 429) {
        startClock();

        $timeout(stopClock, API_RATE_LIMIT);
        $timeout(callback, API_RATE_LIMIT);

        return true;
      } else {
        return false;
      }
    };

    var userLookup = function() {
      var offset = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
      var usersPage = vm.userIDs.slice(offset, offset+FOLLOWERS_DETAILS_PAGE_SIZE);

      twitterService.userLookup({userIDs: usersPage.join(), page: currentUserDetailsPage, screenName: vm.screenName}).then(
        function(data) {
          var rateExceeded = checkRateLimit(data, userLookup);
          if(rateExceeded === false) {
            angular.forEach(data, function(follower) {
              var f = {};

              f.name = follower.name;
              f.screen_name = follower.screen_name;

              if(follower.entities && follower.entities.url) {
                f.url = follower.entities.url.urls["0"].expanded_url;
              }

              vm.followers.push(f);
            });

            vm.followersDetailsReceived = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
            vm.progressBarLeftText = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;

            currentUserDetailsPage++;
            vm.requestsCount++;
            vm.loading = false;

            if(usersPage.length >= FOLLOWERS_DETAILS_PAGE_SIZE) {
              userLookup();
            } else {
              twitterService.doneMining().then(
                function() {
                  vm.status = 'Done';

                  vm.searchEnabled = true;
                  vm.followersDetailsDiscarded = vm.targetUser.followers_count-vm.followersDetailsReceived;
                },
                function() {
                  vm.status = 'Error';
                  vm.searchEnabled = true;
                }
              );
            }
          }
        }
      );
    };

    var getFollowers = function() {
      twitterService.getFollowers(vm.screenName, followersCursor, FOLLOWERS_IDS_PAGE_SIZE).then(
        function(followers) {
          var rateExceeded = checkRateLimit(followers, getFollowers);
          if(rateExceeded === false) {
            followersCursor = followers.next_cursor_str;
            vm.userIDs = vm.userIDs.concat(followers.ids);
            vm.followersIDsReceived += followers.ids.length;
            vm.progressBarLeftText = vm.userIDs.length;

            if(followers.next_cursor !== 0) {
              getFollowers();
            } else {
              vm.status = 'Getting followers details ..';

              vm.followersIDsDiscarded = vm.targetUser.followers_count-vm.followersIDsReceived;

              vm.requestsCount = 0;
              vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_DETAILS_PAGE_SIZE);

              userLookup(vm.userIDs);
            }

            vm.requestsCount++;
          }
        }
      );
    };

    vm.run = function () {
      currentUserDetailsPage = 0;
      followersCursor = '-1';

      vm.followers = [];
      vm.userIDs = [];

      vm.followersIDsReceived = 0;
      vm.followersIDsDiscarded = '';

      vm.followersDetailsReceived = 0;
      vm.followersDetailsDiscarded = '';

      vm.searchEnabled = false;

      vm.loading = true;
      twitterService.userLookup({screenName: vm.screenName}).then(
        function(user) {
          var rateExceeded = checkRateLimit(user, vm.run);
          if(rateExceeded === false) {
            vm.targetUser = user[0];
            vm.requestsCount = 0;
            vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_IDS_PAGE_SIZE);

            vm.progressBarLeftText = 0;
            vm.progressBarRightText = vm.targetUser.followers_count;

            vm.status = 'Getting followers IDs ..';
            getFollowers();

            vm.loading = false;
          }
        }
      );
    };

    vm.logIn = function() {
      vm.loading = true;
      twitterService.logIn().then(
        function(data) {
          vm.loggedIn = true;

          twitterService.verifyCredentials().then(
            function(data) {
              if(data.errors === undefined) {
                vm.loggedIn = true;
                vm.username = data.name;

                vm.searchEnabled = true;
              }

              vm.loading = false;
            }
          );
        }
      );
    };

    init();
  });
