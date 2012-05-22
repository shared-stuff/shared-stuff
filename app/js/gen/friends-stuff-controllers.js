(function() {
  var FriendsStuffController, focus, log;

  log = utils.log;

  focus = utils.focus;

  FriendsStuffController = function($scope, $defer, friendDAO, friendsStuffDAO) {
    var filterStuffList;
    $scope.stuffList = [];
    $scope.filteredStuffList = [];
    $scope.sortAttribute = '-modified';
    $scope.sortAttributeNames = {
      '-modified': 'Newest',
      'title': 'Title',
      'owner.name': 'Friend'
    };
    $scope.status = "LOADING";
    filterStuffList = function() {
      return $scope.filteredStuffList = utils.search($scope.stuffList, $scope.searchQuery);
    };
    $defer(function() {
      log("list friend's stuff");
      friendsStuffDAO.clearCache();
      return friendsStuffDAO.list(function(stuffList, status) {
        $scope.stuffList = stuffList;
        $scope.status = status;
        filterStuffList();
        return $scope.$digest();
      });
    });
    $scope.sortBy = function(sortAttribute) {
      log(sortAttribute);
      return $scope.sortAttribute = sortAttribute;
    };
    return $scope.$watch('searchQuery', filterStuffList);
  };

  FriendsStuffController.$inject = ['$scope', '$defer', 'friendDAO', 'friendsStuffDAO'];

  this.FriendsStuffController = FriendsStuffController;

}).call(this);
