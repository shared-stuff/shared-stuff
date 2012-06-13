(function() {
  var LoginController, log, rs;

  log = utils.log;

  rs = remoteStorageUtils;

  LoginController = function($scope, $location) {
    return $scope.login = function() {
      var userAddress;
      try {
        userAddress = $scope.userAddress;
        log("userAddress:" + userAddress);
        if (userAddress) {
          return rs.connectAndAuthorize(userAddress, ['public', 'sharedstuff'], function() {
            var targetPath;
            localStorage.setItem('userAddress', userAddress);
            $scope.setLoggenOn();
            targetPath = sessionStorage.getItem('targetPath') || '/';
            sessionStorage.removeItem('targetPath');
            return $scope.$apply(function() {
              return $location.path(targetPath).replace();
            });
          });
        } else {
          return alert("Please enter a remote storage id!");
        }
      } catch (e) {
        return log(e);
      }
    };
  };

  LoginController.$inject = ['$scope', '$location'];

  this.LoginController = LoginController;

}).call(this);
