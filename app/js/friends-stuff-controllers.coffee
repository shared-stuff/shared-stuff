log = utils.log
focus = utils.focus

FriendsStuffController = ($scope,$defer,friendDAO,friendsStuffDAO)->
  $scope.stuffList = []
  $scope.filteredStuffList = []
  $scope.sortAttribute = '-modified'
  $scope.sortAttributeNames = {'-modified':'Newest','title':'Title','owner.name':'Friend'}
  $scope.status = "LOADING"

  filterStuffList = ->
    $scope.filteredStuffList = utils.search($scope.stuffList,$scope.searchQuery)

  $defer ->
      log("list friend's stuff")
      friendsStuffDAO.clearCache();
      friendsStuffDAO.list (stuffList,status)->
        $scope.stuffList = stuffList
        $scope.status = status
        filterStuffList();
        $scope.$digest();

  $scope.sortBy = (sortAttribute) ->
    log(sortAttribute)
    $scope.sortAttribute = sortAttribute

  $scope.$watch('searchQuery', filterStuffList)


FriendsStuffController.$inject = ['$scope','$defer','friendDAO','friendsStuffDAO']

#export
this.FriendsStuffController = FriendsStuffController
