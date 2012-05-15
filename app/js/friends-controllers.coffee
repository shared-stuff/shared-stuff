log = utils.log
focus = utils.focus
focusAndSelect = utils.focusAndSelect
isBlank = utils.isBlank



FriendsController = ($scope,friendDAO,friendsStuffDAO,settingsDAO,$routeParams)->
  $scope.friendList = []
  $scope.isAddFriendFormHidden = true
  $scope.isInviteFriendFormHidden = true
  session = $scope.session
  $scope.inviteUrl = 'Loading...'

  friendDAO.list (restoredFriendList)->
    $scope.friendList = restoredFriendList
    $scope.isAddFriendFormHidden = $scope.friendList.length>0
    if ($routeParams.userAddress)
      $scope.friend = new Friend({userAddress:$routeParams.userAddress,secret:$routeParams.secret})
      $scope.isAddFriendFormHidden = false
    $scope.$digest();

  $scope.showAddForm = ()->
    $scope.isAddFriendFormHidden = false
    $scope.isInviteFriendFormHidden = true
    focus('name')


  $scope.friend = new Friend()

  $scope.addFriend = ()->
    $scope.friend.sanitize()
    friendsStuffDAO.validateFriend($scope.friend, (errors)->
      if errors.length==0
        $scope.friendList.push(new Friend($scope.friend))
        friendDAO.save($scope.friendList)
        $scope.friend = new Friend();
        $scope.isAddFriendFormHidden = true
        $scope.$digest();
        focus('showAddFriendFormButton')
      else
        $scope.showValidationErrors=true
        window.alert(errors.join(',')+" seems invalid")
    )
  $scope.inviteFriend = ->
    $scope.isInviteFriendFormHidden = false
    $scope.isAddFriendFormHidden = true
    settingsDAO.getSecret (secret) ->
      $scope.inviteUrl =  buildInviteFriendUrl(session.userAddress,secret)
      $scope.publicInviteUrl =  buildPublicInviteUrl(session.userAddress)
      $scope.$digest();
      focusAndSelect('inviteUrl')

  $scope.closeInviteFriend = ->
    $scope.isInviteFriendFormHidden = true

  focus('showAddFriendFormButton')


buildInviteFriendUrl = (userAddress,secret) ->
  return buildPublicInviteUrl(userAddress)+'/'+secret

buildPublicInviteUrl = (userAddress,secret) ->
  l = window.location
  part1 = l.protocol+'//'+l.host+ l.pathname
  hash = '/invitation/'+userAddress
  return part1+'#'+hash


FriendsController.$inject = ['$scope','friendDAO','friendsStuffDAO','settingsDAO','$routeParams']


FriendEditController = ($scope,friendDAO,friendsStuffDAO,$routeParams,$location)->
  $scope.friend = new Friend()
  $scope.editMode = false
  $scope.stuffList = []
  $scope.showValidationErrors=true

  friendDAO.getItem($routeParams.id,(friend)->
    $scope.friend = new Friend(friend)
    $scope.$digest()
    friendsStuffDAO.listStuffByFriend(friend, (friendStuff) ->
        $scope.stuffList = friendStuff
        $scope.$digest()
    )
  )

  redirectToList = ->
    $scope.$apply( ->
        $location.path('/friends')
    )

  $scope.save = ()->
    $scope.friend.sanitize()
    friendsStuffDAO.validateFriend($scope.friend, (errors)->
      if errors.length==0
        friendDAO.saveItem($scope.friend,redirectToList)
      else
        window.alert(errors.join(',')+" seems invalid")
    )


  $scope.showEditMode = ()->
    $scope.editMode = true

  $scope.delete = ()->
    if window.confirm("Do you really want to delete your friend \"#{$scope.friend.name}\"?")
      friendDAO.deleteItem($scope.friend.id,redirectToList)

FriendEditController.$inject = ['$scope','friendDAO','friendsStuffDAO','$routeParams','$location']


FriendViewController = ($scope,friendDAO,friendsStuffDAO,$routeParams,$location)->
  $scope.stuffList = []
  friend = new Friend({userAddress:$routeParams.userAddress,secret:$routeParams.secret})
  $scope.friend = friend

  friendsStuffDAO.listStuffByFriend(friend, (friendStuff) ->
    $scope.stuffList = friendStuff
    $scope.$digest()
  )

  $scope.addFriend = ->
    $location.path('/addFriend/'+friend.userAddress+'/'+friend.secret)


FriendViewController.$inject = ['$scope','friendDAO','friendsStuffDAO','$routeParams','$location']

#export
this.FriendsController = FriendsController
this.FriendEditController = FriendEditController
this.FriendViewController = FriendViewController
