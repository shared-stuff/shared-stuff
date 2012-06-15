log = utils.log
focus = utils.focus

filterByDirection = (stuffList, sharingDirection) ->
  if sharingDirection == 'giveAndWish'
    return stuffList
  else
    return (stuff for stuff in stuffList when stuff.sharingDirection == sharingDirection)

FriendsStuffController = ($scope, $timeout, friendDAO, friendsStuffDAO)->
  $scope.stuffList = []
  $scope.filteredStuffList = []
  $scope.sortAttribute = sessionStorage.getItem('friends-stuff-sortAttribute') || '-modified'
  $scope.sortAttributeNames = {'-modified': 'Newest', 'title': 'Title', 'owner.name': 'Friend'}
  $scope.sharingDirection = sessionStorage.getItem('friends-stuff-sharingDirection') || 'giveAndWish'
  $scope.sharingDirectionNames = {'giveAndWish': 'Give & Wish', 'give': 'Give', 'wish': 'Wish'}
  $scope.status = "LOADING"
  refreshTimeout = undefined

  filterStuffList = ->
    filteredByDirection = filterByDirection($scope.stuffList, $scope.sharingDirection)
    $scope.filteredStuffList = utils.search(filteredByDirection, $scope.searchQuery)

  startRefresh = ->
    friendsStuffDAO.list (stuffList, status)->
      $scope.stuffList = stuffList
      if $scope.status != "LOADED"
        $scope.status = status
      filterStuffList()
      ;
      $scope.$digest()
      ;
  #if (status == 'LOADED')
  #refreshTimeout = setTimeout(startRefresh,60000)

  $timeout ->
    friendsStuffDAO.clearCache()
    startRefresh()

  $scope.sortBy = (sortAttribute) ->
    sessionStorage.setItem('friends-stuff-sortAttribute', sortAttribute)
    $scope.sortAttribute = sortAttribute

  $scope.setSharingDirection = (sharingDirection) ->
    sessionStorage.setItem('friends-stuff-sharingDirection', sharingDirection)
    $scope.sharingDirection = sharingDirection

  $scope.$watch('searchQuery', filterStuffList)
  $scope.$watch('sharingDirection', filterStuffList)

  $scope.$on('$destroy', ->
    if refreshTimeout
      clearTimeout(refreshTimeout)
    log("destroyed FriendsStuffController")
  )


FriendsStuffController.$inject = ['$scope', '$timeout', 'friendDAO', 'friendsStuffDAO']

#export
this.FriendsStuffController = FriendsStuffController
