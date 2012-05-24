'use strict';
/* http://docs-next.angularjs.org/api/angular.module.ng.$compileProvider.directive */



angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).directive('appSelectOnFocus', [function() {
    return function(scope, elm, attrs) {
        elm.bind('focus', function(event) {
            setTimeout(function () {
                elm.select();
            },100);
        });
    };
}]).directive('stuffImage', [function() {
    return function(scope, elm, attrs) {
        elm.addClass('stuffImageBox');
        scope.$watch(attrs.src, function(v1,v2) {
            var src = attrs.src;
            if (!utils.isBlank(src)) {
                var image = new Image()
                image.src = src;
                image.className = 'stuffImage';
                window.elm = elm;
                elm.append(image);
            } else {
                elm.hide()
            }
        });
    };
}]);;


