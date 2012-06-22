log = utils.log
focus = utils.focus

filterByDirection = (stuffList, sharingDirection) ->
  if sharingDirection == 'giveAndWish'
    return stuffList
  else
    return (stuff for stuff in stuffList when stuff.sharingDirection == sharingDirection)


CACHE_AGE_THRESHOLD = 10*1000

FriendsStuffController = ($scope, $timeout, friendDAO, friendsStuffDAO)->
  $scope.stuffList = []
  $scope.filteredStuffList = []
  $scope.sortAttribute = sessionStorage.getItem('friends-stuff-sortAttribute') || '-modified'
  $scope.sortAttributeNames = {'-modified': 'Newest', 'title': 'Title', 'owner.name': 'Friend'}
  $scope.sharingDirection = sessionStorage.getItem('friends-stuff-sharingDirection') || 'giveAndWish'
  $scope.sharingDirectionNames = {'giveAndWish': 'Give & Wish', 'give': 'Give', 'wish': 'Wish'}
  $scope.status = "LOADING"
  updateTimeout = undefined
  updateCountdown = 0

  filterStuffList = ->
    filteredByDirection = filterByDirection($scope.stuffList, $scope.sharingDirection)
    $scope.filteredStuffList = utils.search(filteredByDirection, $scope.searchQuery)

  update = ->
    updateCountdown -= 1
    friendsStuffDAO.refreshMostOutdatedFriend(CACHE_AGE_THRESHOLD,onUpdateStuffList)

  onUpdateStuffList = (friends,stuffList, status) ->
    $scope.stuffList = stuffList
    if $scope.status != "LOADED"
      # status change to LOADED
      $scope.status = status
      if status == "LOADED"
        updateCountdown = friends.length
    filterStuffList()
    $scope.$digest()
    if (status == 'LOADED' && updateCountdown>0)
      updateTimeout = setTimeout(update,1000)

  $scope.sortBy = (sortAttribute) ->
    sessionStorage.setItem('friends-stuff-sortAttribute', sortAttribute)
    $scope.sortAttribute = sortAttribute

  $scope.setSharingDirection = (sharingDirection) ->
    sessionStorage.setItem('friends-stuff-sharingDirection', sharingDirection)
    $scope.sharingDirection = sharingDirection

  $scope.$watch('searchQuery', filterStuffList)
  $scope.$watch('sharingDirection', filterStuffList)

  $scope.$on('$destroy', ->
    log("FriendsStuffController is destroyed")
    if updateTimeout
      clearTimeout(updateTimeout)
      updateCountdown = 0
      log("Stopped Refresh")
  )

  friendsStuffDAO.clearCache()
  friendsStuffDAO.list(onUpdateStuffList)


FriendsStuffController.$inject = ['$scope', '$timeout', 'friendDAO', 'friendsStuffDAO']

#export
this.FriendsStuffController = FriendsStuffController
