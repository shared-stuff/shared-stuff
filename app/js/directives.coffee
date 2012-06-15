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
    scope: {options: '=', values:'=', localizationType:'@'}
    template: """
            <div class="multiSelect">
              <span ng-repeat="option in options">
                <label class="checkBoxLabel">
                  <input type="checkbox" ng-model="selected[option]"> {{option | localize:localizationType}}
                </label>
              </span>
            </div>
            """,
    link: ($scope, elm, attrs) ->

      $scope.$watch('values', ->
        $scope.selected = {}
        for value in $scope.values
          $scope.selected[value] = true
      )

      $scope.$watch('selected', ->
        $scope.values = (option for option,isSelected of $scope.selected when isSelected)
      ,true)
  }
]).
directive('sharingTypesSelect', [->
  {
  scope: {values: '='}
  template: """<div multi-select options="options" values="values" localization-type="sharingType"/>""",
  link: ($scope, elm, attrs) ->
    $scope.options = Stuff.sharingTypeValues
  }
]).
directive('sharingTypes', [->
  {
  scope: {values: '='}
  template:"""
    <span ng-show="values.length">for {{values | sharingTypes}}</span>
    """
  }
]).
directive('myStuff', [->
  {
  scope: {item: '=',profile: '='}
  template:"""
          <h3><a href="#/mystuff/{{item.id}}">{{item.title || "Untitled"}}</a></h3>
          <span stuff-image src="{{item.image}}"/>
          <p class="description" ng-bind-html="item.description | urlize"></p>
          <p class="stuffFooter">
              <span ng-show="item.visibility == 'public'" class="owner visibility">Public</span>
              {{item.categories}}
              <span ng-show="item.location">in {{item.getLocation()}}</span>
              <span ng-show="!item.location && profile.location">in your profile location {{profile.location}}</span>
              <span sharing-types values="item.sharingTypes" />
              <a ng-show="item.link" href="{{item.link}}" target="link">External Link</a>
          </p>
      """
  }
]).
directive('friendStuff', [->
  {
  scope: {item: '='}
  template:"""
          <h3>{{item.title || "Untitled"}}</h3>
            <span stuff-image src="{{item.image}}"/>
            <p class="description" ng-bind-html="item.description | urlize"></p>
            <p class="stuffFooter">
                {{item.categories}}
                <span class="owner" ng-show="item.owner">from <a href="#/friends/{{item.owner.id}}">{{item.owner.name}}</a></span> ({{ item.modified | date}})
                <span ng-show="item.getLocation()">in {{item.getLocation()}}</span>
                <span sharing-types values="item.sharingTypes" />
                <a ng-show="item.link" href="{{item.link}}" target="link">External Link</a>
            </p>
        """
  }
])
