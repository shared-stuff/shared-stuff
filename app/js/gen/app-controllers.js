(function() {
  var AppController, applyIfNeeded, focus, log, needsUserLoggedIn, startsWithUserAddress;

  log = utils.log;

  focus = utils.focus;

  applyIfNeeded = utils.applyIfNeeded;

  startsWithUserAddress = function(path) {
    return /^\/[^@\/]+@.+/.test(path);
  };

  needsUserLoggedIn = function(path) {
    return !(_.any(['invitation', 'login'], function(publicPath) {
      return path.indexOf(publicPath) === 1;
    }) || startsWithUserAddress(path));
  };

  AppController = function($scope, $location) {
    var onRouteChange;
    $scope.isAppLoaded = false;
    $scope.session = {
      userAddress: localStorage.getItem('userAddress'),
      isLoggedIn: false
    };
    $scope.logout = function() {
      remoteStorageUtils.deleteToken();
      localStorage.removeItem('userAddress');
      $scope.session = {
        userAddress: null,
        isLoggedIn: false
      };
      return window.location.href = "logout.html";
    };
    $scope.setLoggenOn = function() {
      $scope.session = {
        userAddress: localStorage.getItem('userAddress'),
        isLoggedIn: true
      };
      $scope.isAppLoaded = true;
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
      } else if (path === '/login' && $scope.session.isLoggedIn) {
        return applyIfNeeded($scope, function() {
          return $location.path('/friends-stuff').replace();
        });
      }
    };
    if ($scope.session.userAddress) {
      return remoteStorageUtils.isLoggedOn(function(isLoggedOn) {
        if (isLoggedOn) {
          $scope.setLoggenOn();
        } else {
          $scope.session = {
            userAddress: null,
            isLoggedIn: false
          };
          applyIfNeeded($scope, function() {
            return $scope.isAppLoaded = true;
          });
        }
        onRouteChange();
        return $scope.$on('$beforeRouteChange', onRouteChange);
      });
    } else {
      $scope.$on('$beforeRouteChange', onRouteChange);
      return $scope.isAppLoaded = true;
    }
  };

  AppController.needsUserLoggedIn = needsUserLoggedIn;

  AppController.$inject = ['$scope', '$location'];

  this.AppController = AppController;

}).call(this);
