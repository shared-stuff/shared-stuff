log = utils.log
focus = utils.focus
applyIfNeeded = utils.applyIfNeeded

needsUserLoggedIn = (path)->
  !_.any(['invitation','login'],(publicPath) -> path.indexOf(publicPath)==1)


AppController = ($scope,$location,settingsDAO)->
  $scope.isAppLoaded = false;
  $scope.session = {
    userAddress: localStorage.getItem('userAddress')
    isLoggedIn: false
  }

  $scope.logout = ->
    remoteStorageUtils.deleteToken();
    $scope.session = {
      userAddress: null
      isLoggedIn: false
    }
    $location.path('/login')

  $scope.setLoggenOn = ->
    $scope.session = {
      userAddress: localStorage.getItem('userAddress')
      isLoggedIn: true
    }
    $scope.$digest();

  onRouteChange = ->
    path= $location.path()
    log(path)
    if !$scope.session.isLoggedIn and needsUserLoggedIn($location.path())
      sessionStorage.setItem('targetPath',path)
      applyIfNeeded($scope, ->
        $location.path('/login').replace()
      )

  remoteStorageUtils.isLoggedOn (isLoggedOn) ->
    applyIfNeeded($scope, -> $scope.isAppLoaded = true);
    if (isLoggedOn)
      $scope.setLoggenOn()
    else
      $scope.session = {
        userAddress: null
        isLoggedIn: false
      }
      onRouteChange()
    $scope.$on('$beforeRouteChange', onRouteChange)


AppController.$inject = ['$scope','$location','settingsDAO']

#export
this.AppController = AppController