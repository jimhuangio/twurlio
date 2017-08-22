angular.module('twitterminer').filter('pagination', function() {
  'use strict';
  return function(input, start)
  {
    if(input === undefined) {
      return input;
    }
    else {
      start = +start;
      return input.slice(start);
    }
  };
});
