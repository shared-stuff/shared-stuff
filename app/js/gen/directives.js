(function() {

  angular.module('myApp.directives', []).directive('appVersion', [
    'version', function(version) {
      return function(scope, elm, attrs) {
        return elm.text(version);
      };
    }
  ]).directive('appSelectOnFocus', [
    function() {
      return function(scope, elm, attrs) {
        return elm.bind('focus', function(event) {
          return setTimeout(function() {
            return elm.select();
          }, 100);
        });
      };
    }
  ]).directive('stuffImage', [
    function() {
      return function(scope, elm, attrs) {
        elm.addClass('stuffImageBox');
        return scope.$watch(attrs.src, function() {
          var image, src;
          src = attrs.src;
          if (!utils.isBlank(src)) {
            image = new Image();
            image.src = src;
            image.className = 'stuffImage';
            return elm.append(image);
          } else {
            return elm.hide();
          }
        });
      };
    }
  ]).directive('multiSelect', [
    function() {
      return function($scope, elm, attrs) {
        elm.addClass('multiSelect');
        return $scope.$watch(attrs.values, function() {
          var value, values, _i, _len, _results;
          values = $scope.$eval(attrs.values);
          log(values);
          _results = [];
          for (_i = 0, _len = values.length; _i < _len; _i++) {
            value = values[_i];
            elm.append('<input type="checkbox" id="id"/>');
            _results.push(elm.append('<label >' + id + '</label>'));
          }
          return _results;
        });
      };
    }
  ]);

}).call(this);
