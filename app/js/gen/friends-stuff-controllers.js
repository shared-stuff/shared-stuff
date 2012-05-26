(function() {
  var FriendsStuffController, focus, log;

  log = utils.log;

  focus = utils.focus;

  FriendsStuffController = function($scope, $defer, friendDAO, friendsStuffDAO) {
    var filterStuffList, refreshTimeout, startRefresh;
    $scope.stuffList = [];
    $scope.filteredStuffList = [];
    $scope.sortAttribute = '-modified';
    $scope.sortAttributeNames = {
      '-modified': 'Newest',
      'title': 'Title',
      'owner.name': 'Friend'
    };
    $scope.status = "LOADING";
    refreshTimeout = void 0;
    filterStuffList = function() {
      return $scope.filteredStuffList = utils.search($scope.stuffList, $scope.searchQuery);
    };
    startRefresh = function() {
      log("list friend's stuff");
      return friendsStuffDAO.list(function(stuffList, status) {
        $scope.stuffList = stuffList;
        if ($scope.status !== "LOADED") $scope.status = status;
        filterStuffList();
        return $scope.$digest();
      });
    };
    $defer(function() {
      friendsStuffDAO.clearCache();
      return startRefresh();
    });
    $scope.sortBy = function(sortAttribute) {
      log(sortAttribute);
      return $scope.sortAttribute = sortAttribute;
    };
    $scope.$watch('searchQuery', filterStuffList);
    return $scope.$on('$destroy', function() {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      return log("destroyed FriendsStuffController");
    });
  };

  FriendsStuffController.$inject = ['$scope', '$defer', 'friendDAO', 'friendsStuffDAO'];

  this.FriendsStuffController = FriendsStuffController;

}).call(this);
