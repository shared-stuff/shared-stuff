log = utils.log
rs = remoteStorageUtils

LoginController = ($scope,$location)->
  log("Login")
  #$scope.session.isLoggedIn = false
  #$scope.userAddress = ""

  if $scope.session.isLoggedIn
    $location.path('/friends-stuff').replace()

  $scope.login = ->
    try
      userAddress = $scope.userAddress
      log("userAddress:"+userAddress)
      if userAddress
        rs.connectAndAuthorize(userAddress, ['public', 'sharedstuff'], ->
            localStorage.setItem('userAddress',userAddress);
            $scope.setLoggenOn()
            targetPath = sessionStorage.getItem('targetPath') || '/';
            sessionStorage.removeItem('targetPath');
            $scope.$apply ->
              $location.path(targetPath).replace()
        )
      else
        alert("Please enter a remote storage id!")
    catch e
      log(e)


LoginController.$inject = ['$scope','$location']

#export
this.LoginController = LoginController