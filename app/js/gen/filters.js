(function() {
  var log;

  log = utils.log;

  angular.module('myApp.filters', []).filter('interpolate', [
    'version', function(version) {
      return function(text) {
        return String(text).replace(/\%VERSION\%/mg, version);
      };
    }
  ]).filter('urlize', function(version) {
    return function(text) {
      return urlize(text, {
        target: 'link'
      });
    };
  }).filter('sharingTypes', [
    'localizer', function(localizer) {
      return function(sharingTypes) {
        var t;
        if (sharingTypes) {
          return ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = sharingTypes.length; _i < _len; _i++) {
              t = sharingTypes[_i];
              _results.push(localizer.sharingType(t));
            }
            return _results;
          })()).join(', ');
        } else {
          return "";
        }
      };
    }
  ]).filter('localize', [
    'localizer', function(localizer) {
      return function(id, locType) {
        if (localizer[locType]) {
          return localizer[locType](id) || id;
        } else {
          return id;
        }
      };
    }
  ]);

}).call(this);
