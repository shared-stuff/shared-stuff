sharingTypeOptions = ['rent','gift','use-together']


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
  {
    scope: {options: 'accessor', values:'accessor', localizationType:'attribute'}
    template: """ LOC:{{localizationType}}:
            <div class="multiSelect">
              <span ng-repeat="option in options()">
                <label class="checkBoxLabel">
                  <input type="checkbox" ng-model="selected[option]"> {{option | localize:localizationType}}
                </label>
              </span>
            </div>
            """,
    link: ($scope, elm, attrs) ->
      $scope.$watch('values', ->
        $scope.selected = {}
        for value in $scope.values()
          $scope.selected[value] = true
      )

      $scope.$watch('selected', ->
        $scope.values((option for option,isSelected of $scope.selected when isSelected))
      ,true)
  }
]).
directive('sharingTypesSelect', [->
  {
  scope: {values: 'accessor'}
  template: """<div multi-select options="options" values="values2" localization-type="sharingType"/>""",
  link: ($scope, elm, attrs) ->
    $scope.options = sharingTypeOptions
    $scope.values2 = $scope.values()
    $scope.$watch('values2', ->
      $scope.values($scope.values2)
    ,true)
  }
]).
directive('sharingTypes', [->
  {
  scope: {values: 'accessor'}
  template:"""
    For: {{values() | sharingTypes}}
    """
  }
])
