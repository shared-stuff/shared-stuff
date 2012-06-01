angular.module('myApp.directives', []).
directive('appVersion', ['version', (version) ->
  (scope, elm, attrs) -> elm.text(version)
]).
directive('appSelectOnFocus', [->
  (scope, elm, attrs) ->
    elm.bind('focus', (event) ->
      setTimeout( ->
        elm.select()
      ,100)
    )
]).
directive('stuffImage', [->
  (scope, elm, attrs) ->
    elm.addClass('stuffImageBox')
    scope.$watch(attrs.src, ->
      src = attrs.src
      if !utils.isBlank(src)
        image = new Image()
        image.src = src
        image.className = 'stuffImage'
        elm.append(image)
      else
        elm.hide()
    )
]).
directive('multiSelect', [->
  ($scope, elm, attrs) ->
    elm.addClass('multiSelect');
    $scope.$watch(attrs.values, ->
      values = $scope.$eval(attrs.values)
      log(values)
      for value in values
        elm.append('<input type="checkbox" id="id"/>');
        elm.append('<label >'+id+'</label>');
    )
])