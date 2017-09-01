angular.module('twitterminer').filter('timeFormat',function() {
  'use strict';
  return function (timeInMilliseconds) {
    timeInMilliseconds = timeInMilliseconds / 1000;
    var seconds = timeInMilliseconds % 60;
    timeInMilliseconds = (timeInMilliseconds - seconds) / 60;
    var minutes = timeInMilliseconds % 60;

    if(seconds < 10) {
      seconds = "0" + seconds;
    }

    if(minutes < 10) {
      minutes = "0" + minutes;
    }

    return minutes + ':' + seconds;
  };
});
