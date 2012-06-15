(function() {
  var FriendsStuffController, focus, log;

  log = utils.log;

  focus = utils.focus;

  FriendsStuffController = function($scope, $timeout, friendDAO, friendsStuffDAO) {
    var filterStuffList, refreshTimeout, startRefresh;
    $scope.stuffList = [];
    $scope.filteredStuffList = [];
    $scope.sortAttribute = sessionStorage.getItem('friends-stuff-sortAttribute') || '-modified';
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
    $timeout(function() {
      friendsStuffDAO.clearCache();
      return startRefresh();
    });
    $scope.sortBy = function(sortAttribute) {
      sessionStorage.setItem('friends-stuff-sortAttribute', sortAttribute);
      return $scope.sortAttribute = sortAttribute;
    };
    $scope.$watch('searchQuery', filterStuffList);
    return $scope.$on('$destroy', function() {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      return log("destroyed FriendsStuffController");
    });
  };

  FriendsStuffController.$inject = ['$scope', '$timeout', 'friendDAO', 'friendsStuffDAO'];

  this.FriendsStuffController = FriendsStuffController;

}).call(this);
