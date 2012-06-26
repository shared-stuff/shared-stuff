(function() {
  var CACHE_AGE_THRESHOLD, FriendsStuffController, LOADING_INDICATOR_DELAY, filterByDirection, focus, getCurrentTime, log;

  log = utils.log;

  focus = utils.focus;

  getCurrentTime = utils.getCurrentTime;

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

  CACHE_AGE_THRESHOLD = 60 * 1000;

  LOADING_INDICATOR_DELAY = 500;

  FriendsStuffController = function($scope, $timeout, friendDAO, friendsStuffDAO) {
    var filterStuffList, loadingIndicatorDelayReached, onUpdateStuffList, update, updateCountdown, updateLoadingIndicator, updateTimeout;
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
    $scope.showLoadingIndicator = false;
    loadingIndicatorDelayReached = false;
    updateTimeout = void 0;
    updateCountdown = 0;
    filterStuffList = function() {
      var filteredByDirection;
      filteredByDirection = filterByDirection($scope.stuffList, $scope.sharingDirection);
      return $scope.filteredStuffList = utils.search(filteredByDirection, $scope.searchQuery);
    };
    update = function() {
      updateCountdown -= 1;
      return friendsStuffDAO.refreshMostOutdatedFriend(CACHE_AGE_THRESHOLD, onUpdateStuffList);
    };
    updateLoadingIndicator = function() {
      return $scope.showLoadingIndicator = $scope.status === 'LOADING' && loadingIndicatorDelayReached;
    };
    onUpdateStuffList = function(friends, stuffList, status) {
      $scope.stuffList = stuffList;
      if ($scope.status !== "LOADED") {
        $scope.status = status;
        if (status === "LOADED") updateCountdown = friends.length;
      }
      filterStuffList();
      updateLoadingIndicator();
      $scope.$digest();
      if (status === 'LOADED' && updateCountdown > 0) {
        return updateTimeout = setTimeout(update, 250);
      }
    };
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
    $scope.$on('$destroy', function() {
      log("FriendsStuffController is destroyed");
      if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateCountdown = 0;
        return log("Stopped Refresh");
      }
    });
    friendsStuffDAO.clearCache();
    friendsStuffDAO.list(onUpdateStuffList);
    return $timeout(function() {
      loadingIndicatorDelayReached = true;
      return updateLoadingIndicator();
    }, LOADING_INDICATOR_DELAY);
  };

  FriendsStuffController.$inject = ['$scope', '$timeout', 'friendDAO', 'friendsStuffDAO'];

  this.FriendsStuffController = FriendsStuffController;

}).call(this);
