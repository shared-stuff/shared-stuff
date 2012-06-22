log = utils.log
focus = utils.focus
focusAndSelect = utils.focusAndSelect
isBlank = utils.isBlank
applyIfNeeded =  utils.applyIfNeeded


FriendsController = ($scope,friendDAO,friendsStuffDAO,$location,$routeParams)->
  $scope.friendList = []
  $scope.isAddFriendFormHidden = true
  $scope.isInviteFriendButtonShown = true
  $scope.friend = new Friend()

  friendDAO.list (restoredFriendList)->
    $scope.friendList = restoredFriendList
    $scope.isAddFriendFormHidden = $scope.friendList.length>0
    if ($routeParams.userAddress)
      $scope.friend = new Friend({name: $routeParams.name,userAddress: $routeParams.userAddress,secret:$routeParams.secret})
      $scope.isAddFriendFormHidden = false
    $scope.status = 'LOADED'
    $scope.$digest();

  $scope.showAddForm = ()->
    $scope.isAddFriendFormHidden = false
    $scope.isInviteFriendButtonShown = false
    focus('name')

  $scope.closeForm = ()->
    $scope.isAddFriendFormHidden = true
    $scope.isInviteFriendButtonShown = true



  $scope.addFriend = ()->
    $scope.friend.sanitize()
    friendsStuffDAO.validateFriend($scope.friend, (errors)->
      if errors.length==0
        $scope.friendList.push(new Friend($scope.friend))
        friendDAO.save($scope.friendList)
        $scope.friend = new Friend()
        $scope.closeForm()
        $scope.$digest();
        focus('showAddFriendFormButton')
      else
        $scope.showValidationErrors=true
        showValidationErrors($scope.friend,errors)
    )
  $scope.inviteFriend = ->
    $location.path('/share-stuff')

  $scope.$watch('friend.userAddress', (newValue)->
    if !isBlank(newValue)
      friendDAO.getItemBy('userAddress',newValue,  (existingFriendArg) ->
        applyIfNeeded($scope, ->
          $scope.existingFriend = existingFriendArg
        )
      )
    else
      $scope.existingFriend = undefined
  )

  focus('showAddFriendFormButton')


buildInviteFriendUrl = (userAddress,secret) ->
  return buildPublicInviteUrl(userAddress)+'/'+secret

buildPublicInviteUrl = (userAddress,secret) ->
  l = window.location
  part1 = l.protocol+'//'+l.host+ l.pathname
  hash = userAddress
  return part1+'#'+hash


FriendsController.$inject = ['$scope','friendDAO','friendsStuffDAO','$location','$routeParams']


FriendEditController = ($scope,friendDAO,friendsStuffDAO,profileDAO,$routeParams,$location)->
  $scope.friend = new Friend()
  $scope.editMode = false
  $scope.stuffList = []
  $scope.profile = {}
  $scope.showValidationErrors=true
  $scope.status = "LOADING"

  loadFriend = ->
    friendDAO.getItem($routeParams.id,(friend)->
      $scope.friend = new Friend(friend)
      $scope.$digest()
      friendsStuffDAO.listStuffByFriendRefreshed(friend, (friendStuff) ->
          $scope.stuffList = friendStuff
          $scope.status = "LOADED"
          $scope.$digest()
      )
      profileDAO.getByFriendRefreshed(friend,(profile) ->
        $scope.profile = new Profile(profile)
        $scope.$digest()
      )
    )

  loadFriend()

  redirectToList = ->
    $scope.$apply( ->
        $location.path('/friends')
    )

  $scope.save = ()->
    $scope.friend.sanitize()
    friendsStuffDAO.validateFriend($scope.friend, (errors)->
      if errors.length==0
        friendDAO.saveItem($scope.friend,->
          $scope.editMode = false
          loadFriend()
        )
      else
        showValidationErrors($scope.friend,errors)
    )


  $scope.showEditMode = ()->
    $scope.editMode = true

  $scope.delete = ()->
    if window.confirm("Do you really want to delete your friend \"#{$scope.friend.name}\"?")
      friendDAO.deleteItem($scope.friend.id,redirectToList)

FriendEditController.$inject = ['$scope','friendDAO','friendsStuffDAO','profileDAO','$routeParams','$location']

showValidationErrors = (friend,errors)->
  message = errors.join(',')+" seems invalid."
  if _.include(errors,'secret')
    if isBlank(friend.secret)
      message += " This could mean that your friend has not added public shared stuff yet."
    else
      message += " This could mean that your friend has not added secret shared stuff yet."
  window.alert(message)


FriendViewController = ($scope,friendDAO,friendsStuffDAO,profileDAO,$routeParams,$location)->
  $scope.stuffList = []
  userAddress = $routeParams.user+'@'+$routeParams.host
  friend = new Friend({userAddress:userAddress,secret:$routeParams.secret})
  $scope.friend = friend
  $scope.existingFriend = undefined
  $scope.profile = {}
  $scope.status = "LOADING"


  friendsStuffDAO.listStuffByFriendRefreshed(friend, (friendStuff) ->
    $scope.stuffList = friendStuff
    $scope.status = "LOADED"
    $scope.$digest()
  )

  if $scope.session.isLoggedIn
    friendDAO.getItemBy('userAddress',friend.userAddress, (existingFriendArg) ->
      $scope.existingFriend = existingFriendArg
    )


  profileDAO.getByFriendRefreshed(friend,(profile,status) ->
    $scope.profile = new Profile(profile)
    if profile.name
      friend.name = profile.name
    else
      friend.name = friend.userAddress.replace(/@.*$/,'') || 'unkown'
    $scope.$digest()
  )

  $scope.addFriend = ->
    $location.path('/addFriend/'+friend.name+'/'+friend.userAddress+'/'+friend.secret)


FriendViewController.$inject = ['$scope','friendDAO','friendsStuffDAO','profileDAO','$routeParams','$location']

ShareStuffController = ($scope,settingsDAO,stuffDAO)->
  stuffDAO.list (restoredStuffList) ->
    if restoredStuffList.length > 0
      settingsDAO.getSecret (secret) ->
        userAdress = $scope.session.userAddress
        $scope.inviteUrl =  buildInviteFriendUrl(userAdress,secret)
        $scope.publicInviteUrl =  buildPublicInviteUrl(userAdress)
        $scope.$digest()
        focusAndSelect('inviteUrl')
    else
      $scope.showNoStuffWarning = true
      $scope.$digest()


ShareStuffController.$inject = ['$scope','settingsDAO','stuffDAO']

#export
this.FriendsController = FriendsController
this.FriendEditController = FriendEditController
this.FriendViewController = FriendViewController
this.ShareStuffController = ShareStuffController