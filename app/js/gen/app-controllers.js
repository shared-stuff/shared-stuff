(function() {
  var AppController, applyIfNeeded, focus, log, needsUserLoggedIn;

  log = utils.log;

  focus = utils.focus;

  applyIfNeeded = utils.applyIfNeeded;

  needsUserLoggedIn = function(path) {
    return !_.any(['invitation', 'login'], function(publicPath) {
      return path.indexOf(publicPath) === 1;
    });
  };

  AppController = function($scope, $location, settingsDAO) {
    var onRouteChange;
    $scope.isAppLoaded = false;
    $scope.session = {
      userAddress: localStorage.getItem('userAddress'),
      isLoggedIn: false
    };
    $scope.logout = function() {
      remoteStorageUtils.deleteToken();
      $scope.session = {
        userAddress: null,
        isLoggedIn: false
      };
      return $location.path('/login');
    };
    $scope.setLoggenOn = function() {
      $scope.session = {
        userAddress: localStorage.getItem('userAddress'),
        isLoggedIn: true
      };
      return $scope.$digest();
    };
    onRouteChange = function() {
      var path;
      path = $location.path();
      log(path);
      if (!$scope.session.isLoggedIn && needsUserLoggedIn($location.path())) {
        sessionStorage.setItem('targetPath', path);
        return applyIfNeeded($scope, function() {
          return $location.path('/login').replace();
        });
      }
    };
    return remoteStorageUtils.isLoggedOn(function(isLoggedOn) {
      applyIfNeeded($scope, function() {
        return $scope.isAppLoaded = true;
      });
      if (isLoggedOn) {
        $scope.setLoggenOn();
      } else {
        $scope.session = {
          userAddress: null,
          isLoggedIn: false
        };
        onRouteChange();
      }
      return $scope.$on('$beforeRouteChange', onRouteChange);
    });
  };

  AppController.$inject = ['$scope', '$location', 'settingsDAO'];

  this.AppController = AppController;

}).call(this);
