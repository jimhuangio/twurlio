angular.module('twitterminer').controller('HomeCtrl', function ($scope, $timeout, $interval, $uibModal, applicationService, twitterService) {
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
      vm.importedUsers = [];

      vm.loading = true;

      vm.pageSize = 10;
      vm.currentPage = 1;
      vm.pagesSelectOptions = [10, 20, 50, 100, 500];

      vm.remainingClockTime = 0;

      vm.headersDescription = ['Username', 'Screen name', 'URL'];
      vm.headersName = ['name', 'screen_name', 'url'];

      vm.followers = [];

      applicationService.checkKeys().then(
        function(keys) {
          if(keys.error !== 'NO_KEYS') {
            twitterService.verifyCredentials().then(
              function(credentials) {
                if(credentials.errors === undefined) {
                  vm.loggedIn = true;
                  vm.username = credentials.name;

                  applicationService.checkPending().then(
                    function(data) {
                      if(data.status.screenName !== null) {
                        var resumeModal = $uibModal.open({
                          animation: true,
                          templateUrl: 'views/modals/resume.html',
                          controller: 'ModalResumeCtrl',
                          controllerAs: '$ctrl',
                          size: 'md',
                          resolve: {
                            screenName: function() {
                              return data.status.screenName;
                            }
                          }
                        });

                        resumeModal.result.then(function (result) {
                          if(result === true) {
                            vm.screenName = data.status.screenName;

                            vm.followersDetailsRequested = 0;
                            vm.followersDetailsReceived = 0;
                            vm.followersDetailsDiscarded = 0;

                            vm.searchEnabled = false;

                            twitterService.userLookup({screenName: vm.screenName}).then(
                              function(user) {
                                vm.userIDs = data.userIDs;

                                if(data.status.followersCursor !== null) {
                                  vm.status = 'Getting followers IDs ..';
                                  // rateExceeded = checkRateLimit(user, vm.run);
                                  // if(rateExceeded === false) {
                                  vm.targetUser = user[0];
                                  vm.requestsCount = data.userIDs.length/FOLLOWERS_IDS_PAGE_SIZE;
                                  vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_IDS_PAGE_SIZE);
                                  vm.progressBarRightText = vm.targetUser.followers_count;

                                  vm.followersIDsRequested = data.userIDs.length;
                                  vm.followersIDsReceived = data.userIDs.length;
                                  vm.followersIDsDiscarded = vm.followersIDsRequested-vm.followersIDsReceived;

                                  followersCursor = data.status.followersCursor;

                                  vm.progressBarLeftText = data.userIDs.length;

                                  getFollowers();
                                  // }
                                } else {
                                  // if(data.status.lookupPage !== null)
                                  vm.status = 'Getting followers details ..';
                                  // rateExceeded = checkRateLimit(user, userLookup);
                                  // if(rateExceeded === false) {
                                  vm.targetUser = user[0];

                                  currentUserDetailsPage = (data.status.lookupPage === null) ? 0 : data.status.lookupPage;

                                  vm.followersIDsRequested = vm.targetUser.followers_count;
                                  vm.followersIDsReceived = data.userIDs.length;
                                  vm.followersIDsDiscarded = vm.followersIDsRequested-vm.followersIDsReceived;

                                  vm.followersDetailsRequested = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
                                  vm.followersDetailsDiscarded = vm.followersDetailsRequested-data.userLookupData.length;
                                  vm.followersDetailsReceived = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE - vm.followersDetailsRequested-data.userLookupData.length;

                                  vm.progressBarLeftText = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
                                  vm.progressBarRightText = vm.targetUser.followers_count;

                                  vm.requestsCount = currentUserDetailsPage;
                                  vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_DETAILS_PAGE_SIZE);

                                  vm.followers = data.userLookupData;

                                  userLookup(vm.followersDetailsRequested);
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
          } else {
            var checkKeysModal = $uibModal.open({
              animation: true,
              templateUrl: 'views/modals/application-keys.html',
              controller: 'ModalApplicationKeysCtrl',
              controllerAs: '$ctrl',
              size: 'md'
            });

            checkKeysModal.result.then(function (result) {
              applicationService.saveKeys(result).then(
                function() {
                  init();
                },
                function() {

                }
              );
            });
          }
        },
        function() {

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

    var userLookup = function(previousPageSize) {
      var offset = currentUserDetailsPage*FOLLOWERS_DETAILS_PAGE_SIZE;
      var usersPage = vm.userIDs.slice(offset, offset+FOLLOWERS_DETAILS_PAGE_SIZE);

      function updateLookUpValues(requested, received) {
        vm.followersDetailsRequested += requested;
        vm.followersDetailsDiscarded += FOLLOWERS_DETAILS_PAGE_SIZE-received;
        vm.followersDetailsReceived += received;

        vm.progressBarLeftText = vm.followersDetailsRequested;

        currentUserDetailsPage++;
        vm.requestsCount++;
      }

      if(usersPage.length !== 0) {
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

              updateLookUpValues(previousPageSize, data.length);
              userLookup(usersPage.length);
            }
          }
        );
      } else {
        vm.loading = false;

        updateLookUpValues(previousPageSize, 0);

        applicationService.doneMining().then(
          function() {
            nextImportedUser();
          },
          function() {
            vm.status = 'Error';
            vm.searchEnabled = true;
          }
        );
      }
    };

    var getFollowers = function() {
      twitterService.getFollowers(vm.screenName, followersCursor, FOLLOWERS_IDS_PAGE_SIZE).then(
        function(followers) {
          var rateExceeded = checkRateLimit(followers, getFollowers);
          if(rateExceeded === false) {
            followersCursor = followers.next_cursor_str;
            vm.userIDs = vm.userIDs.concat(followers.ids);

            vm.progressBarLeftText = vm.userIDs.length;

            vm.followersIDsRequested += FOLLOWERS_IDS_PAGE_SIZE;
            vm.followersIDsDiscarded += FOLLOWERS_IDS_PAGE_SIZE-followers.ids.length;
            vm.followersIDsReceived = (vm.followersIDsRequested - vm.followersIDsDiscarded);

            if(followers.next_cursor !== 0) {
              getFollowers();
            } else {
              vm.status = 'Getting followers details ..';

              vm.requestsCount = 0;
              vm.totalRequests = Math.ceil(vm.targetUser.followers_count/FOLLOWERS_DETAILS_PAGE_SIZE)+1;

              userLookup(0, 0);
            }

            vm.requestsCount++;
          }
        }
      );
    };

    var nextImportedUser = function() {
      if(vm.importedUsers.length !== 0) {
        vm.screenName = vm.importedUsers.splice(0, 1)[0];
        vm.run();
      } else {
        vm.status = 'Done';
        vm.searchEnabled = true;
      }
    };

    vm.run = function () {
      currentUserDetailsPage = 0;
      followersCursor = '-1';

      vm.followers = [];
      vm.userIDs = [];

      vm.followersIDsRequested = 0;
      vm.followersIDsReceived = 0;
      vm.followersIDsDiscarded = 0;

      vm.followersDetailsRequested = 0;
      vm.followersDetailsReceived = 0;
      vm.followersDetailsDiscarded = 0;

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

    vm.newFileImport = function(filename) {
      applicationService.newFileImport().then(
        function(d) {
          angular.forEach(d.data, function(target) {
            if(target !== '') {
              vm.importedUsers.push(target);
            }
          });

          nextImportedUser();
        },
        function() {

        }
      );
    };

    init();
  });
