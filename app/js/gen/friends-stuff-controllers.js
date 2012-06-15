(function() {
  var FriendsStuffController, filterByDirection, focus, log;

  log = utils.log;

  focus = utils.focus;

  filterByDirection = function(stuffList, sharingDirection) {
    var stuff;
    if (sharingDirection === 'giveAndWish') {
      return stuffList;
    } else {
      return (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = stuffList.length; _i < _len; _i++) {
          stuff = stuffList[_i];
          if (stuff.sharingDirection === sharingDirection) _results.push(stuff);
        }
        return _results;
      })();
    }
  };

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
    $scope.sharingDirection = sessionStorage.getItem('friends-stuff-sharingDirection') || 'giveAndWish';
    $scope.sharingDirectionNames = {
      'giveAndWish': 'Give & Wish',
      'give': 'Give',
      'wish': 'Wish'
    };
    $scope.status = "LOADING";
    refreshTimeout = void 0;
    filterStuffList = function() {
      var filteredByDirection;
      filteredByDirection = filterByDirection($scope.stuffList, $scope.sharingDirection);
      return $scope.filteredStuffList = utils.search(filteredByDirection, $scope.searchQuery);
    };
    startRefresh = function() {
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
    $scope.setSharingDirection = function(sharingDirection) {
      sessionStorage.setItem('friends-stuff-sharingDirection', sharingDirection);
      return $scope.sharingDirection = sharingDirection;
    };
    $scope.$watch('searchQuery', filterStuffList);
    $scope.$watch('sharingDirection', filterStuffList);
    return $scope.$on('$destroy', function() {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      return log("destroyed FriendsStuffController");
    });
  };

  FriendsStuffController.$inject = ['$scope', '$timeout', 'friendDAO', 'friendsStuffDAO'];

  this.FriendsStuffController = FriendsStuffController;

}).call(this);
