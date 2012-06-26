log = utils.log
focus = utils.focus
applyIfNeeded = utils.applyIfNeeded


startsWithUserAddress = (path) ->
  (/^\/[^@\/]+@.+/).test(path)

needsUserLoggedIn = (path)->
  !(_.any(['invitation','login'],(publicPath) -> path.indexOf(publicPath)==1) ||startsWithUserAddress(path))


AppController = ($scope,$location)->
  $scope.isAppLoaded = false;
  $scope.session = {
    userAddress: localStorage.getItem('userAddress')
    isLoggedIn: false
  }

  $scope.logout = ->
    $scope.session = {
      userAddress: null
      isLoggedIn: false
    }
    AppController.logout()

  $scope.setLoggenOn = ->
    $scope.session = {
      userAddress: localStorage.getItem('userAddress')
      isLoggedIn: true
    }
    $scope.isAppLoaded = true
    $scope.$digest();

  onRouteChange = ->
    path= $location.path()
    log(path)
    if !$scope.session.isLoggedIn and needsUserLoggedIn($location.path())
      sessionStorage.setItem('targetPath',path)
      applyIfNeeded($scope, -> $location.path('/login').replace())
    else if path=='/login' && $scope.session.isLoggedIn
      applyIfNeeded($scope, -> $location.path('/friends-stuff').replace())



  if $scope.session.userAddress
    remoteStorageUtils.isLoggedOn (isLoggedOn) ->
      if (isLoggedOn)
        $scope.setLoggenOn()
      else
        $scope.session = {
          userAddress: null
          isLoggedIn: false
        }
        applyIfNeeded($scope, -> $scope.isAppLoaded = true)
      onRouteChange()
      $scope.$on('$routeChangeStart', onRouteChange)
  else
    $scope.$on('$routeChangeStart', onRouteChange)
    $scope.isAppLoaded = true

AppController.needsUserLoggedIn = needsUserLoggedIn;
AppController.logout = ->
  remoteStorageUtils.deleteToken();
  localStorage.removeItem('userAddress')
  window.location.href="logout.html";


AppController.$inject = ['$scope','$location']

#export
this.AppController = AppController