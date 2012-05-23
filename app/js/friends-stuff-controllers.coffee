log = utils.log
focus = utils.focus

FriendsStuffController = ($scope,$defer,friendDAO,friendsStuffDAO)->
  $scope.stuffList = []
  $scope.filteredStuffList = []
  $scope.sortAttribute = '-modified'
  $scope.sortAttributeNames = {'-modified':'Newest','title':'Title','owner.name':'Friend'}
  $scope.status = "LOADING"
  refreshTimeout = undefined

  filterStuffList = ->
    $scope.filteredStuffList = utils.search($scope.stuffList,$scope.searchQuery)

  startRefresh = ->
    log("list friend's stuff")
    friendsStuffDAO.list (stuffList,status)->
      $scope.stuffList = stuffList
      if $scope.status != "LOADED"
        $scope.status = status
      filterStuffList();
      $scope.$digest();
      if (status == 'LOADED')
        refreshTimeout = setTimeout(startRefresh,60000)

  $defer ->
      friendsStuffDAO.clearCache()
      startRefresh()

  $scope.sortBy = (sortAttribute) ->
    log(sortAttribute)
    $scope.sortAttribute = sortAttribute

  $scope.$watch('searchQuery', filterStuffList)

  $scope.$on('$destroy', ->
    if refreshTimeout
      clearTimeout(refreshTimeout)
    log("destroyed FriendsStuffController")
  )


FriendsStuffController.$inject = ['$scope','$defer','friendDAO','friendsStuffDAO']

#export
this.FriendsStuffController = FriendsStuffController
