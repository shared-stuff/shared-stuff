(function() {
  'use strict';
  var applyIfNeeded, charsForRange, cleanObjectFromAngular, collectTokenStringFromItem, defer, doNothing, focus, focusAndSelect, isBlank, log, matchesSearchTokens, randomArrayElement, randomString, randomStringCharacterRange, search, x,
    __hasProp = Object.prototype.hasOwnProperty;

  log = function(t) {
    return console.log(t);
  };

  focus = function(id) {
    return setTimeout(function() {
      return $('#' + id).focus();
    }, 100);
  };

  focusAndSelect = function(id) {
    return setTimeout(function() {
      return $('#' + id).focus().select();
    }, 100);
  };

  defer = function(callback) {
    return setTimeout(function() {
      return callback();
    }, 1);
  };

  cleanObjectFromAngular = function(items) {
    var item, key, value, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      _results.push((function() {
        var _results2;
        _results2 = [];
        for (key in item) {
          if (!__hasProp.call(item, key)) continue;
          value = item[key];
          if (key.indexOf('$$') >= 0) {
            _results2.push(delete item[key]);
          } else {
            _results2.push(void 0);
          }
        }
        return _results2;
      })());
    }
    return _results;
  };

  charsForRange = function(low, high) {
    var x, _results;
    _results = [];
    for (x = low; low <= high ? x <= high : x >= high; low <= high ? x++ : x--) {
      _results.push(String.fromCharCode(x));
    }
    return _results;
  };

  randomStringCharacterRange = ((function() {
    var _results;
    _results = [];
    for (x = 0; x <= 9; x++) {
      _results.push("" + x);
    }
    return _results;
  })()).concat(charsForRange(65, 90)).concat(charsForRange(97, 122));

  randomArrayElement = function(array) {
    return array[Math.floor(Math.random() * array.length)];
  };

  randomString = function(length) {
    var i;
    return ((function() {
      var _results;
      _results = [];
      for (i = 0; 0 <= length ? i <= length : i >= length; 0 <= length ? i++ : i--) {
        _results.push(randomArrayElement(randomStringCharacterRange));
      }
      return _results;
    })()).join('');
  };

  doNothing = function() {};

  isBlank = function(str) {
    return !str || /^\s*$/.test(str);
  };

  applyIfNeeded = function($scope, f) {
    if ($scope.$root.$$phase) {
      return f();
    } else {
      return $scope.$apply(f);
    }
  };

  collectTokenStringFromItem = function(item) {
    var key, searchString, value;
    searchString = '';
    for (key in item) {
      value = item[key];
      if ((typeof value) === 'string') {
        searchString += ' ' + value.toLowerCase();
      } else if ((typeof value) === 'object') {
        searchString += ' ' + collectTokenStringFromItem(value);
      }
    }
    return searchString;
  };

  matchesSearchTokens = function(item, searchTokens) {
    var tokenString;
    tokenString = collectTokenStringFromItem(item);
    return _.all(searchTokens, function(sw) {
      return tokenString.indexOf(sw) >= 0;
    });
  };

  search = function(list, query) {
    var searchTokens;
    if (!isBlank(query)) {
      searchTokens = query.toLowerCase().split(/\s+/g);
      return _.filter(list, function(item) {
        return matchesSearchTokens(item, searchTokens);
      });
    } else {
      return list;
    }
  };

  this.utils = {
    log: log,
    focus: focus,
    cleanObjectFromAngular: cleanObjectFromAngular,
    randomString: randomString,
    doNothing: doNothing,
    defer: defer,
    isBlank: isBlank,
    focusAndSelect: focusAndSelect,
    applyIfNeeded: applyIfNeeded,
    search: search
  };

}).call(this);
