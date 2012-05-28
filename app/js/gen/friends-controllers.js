(function() {
  var FriendEditController, FriendViewController, FriendsController, ShareStuffController, applyIfNeeded, buildInviteFriendUrl, buildPublicInviteUrl, focus, focusAndSelect, isBlank, log, showValidationErrors;

  log = utils.log;

  focus = utils.focus;

  focusAndSelect = utils.focusAndSelect;

  isBlank = utils.isBlank;

  applyIfNeeded = utils.applyIfNeeded;

  FriendsController = function($scope, friendDAO, friendsStuffDAO, settingsDAO, $routeParams) {
    $scope.friendList = [];
    $scope.isAddFriendFormHidden = true;
    $scope.isInviteFriendFormHidden = true;
    $scope.inviteUrl = 'Loading...';
    friendDAO.list(function(restoredFriendList) {
      $scope.friendList = restoredFriendList;
      $scope.isAddFriendFormHidden = $scope.friendList.length > 0;
      if ($routeParams.userAddress) {
        $scope.friend = new Friend({
          name: $routeParams.name,
          userAddress: $routeParams.userAddress,
          secret: $routeParams.secret
        });
        $scope.isAddFriendFormHidden = false;
      }
      $scope.status = 'LOADED';
      return $scope.$digest();
    });
    $scope.showAddForm = function() {
      $scope.isAddFriendFormHidden = false;
      $scope.isInviteFriendFormHidden = true;
      return focus('name');
    };
    $scope.closeForm = function() {
      $scope.isAddFriendFormHidden = true;
      return $scope.isInviteFriendFormHidden = true;
    };
    $scope.friend = new Friend();
    $scope.addFriend = function() {
      $scope.friend.sanitize();
      return friendsStuffDAO.validateFriend($scope.friend, function(errors) {
        if (errors.length === 0) {
          $scope.friendList.push(new Friend($scope.friend));
          friendDAO.save($scope.friendList);
          $scope.friend = new Friend();
          $scope.isAddFriendFormHidden = true;
          $scope.$digest();
          return focus('showAddFriendFormButton');
        } else {
          $scope.showValidationErrors = true;
          return showValidationErrors($scope.friend, errors);
        }
      });
    };
    $scope.inviteFriend = function() {
      $scope.isInviteFriendFormHidden = false;
      $scope.isAddFriendFormHidden = true;
      return settingsDAO.getSecret(function(secret) {
        var userAdress;
        userAdress = $scope.session.userAddress;
        $scope.inviteUrl = buildInviteFriendUrl(userAdress, secret);
        $scope.publicInviteUrl = buildPublicInviteUrl(userAdress);
        $scope.$digest();
        return focusAndSelect('inviteUrl');
      });
    };
    $scope.closeInviteFriend = function() {
      return $scope.isInviteFriendFormHidden = true;
    };
    return focus('showAddFriendFormButton');
  };

  buildInviteFriendUrl = function(userAddress, secret) {
    return buildPublicInviteUrl(userAddress) + '/' + secret;
  };

  buildPublicInviteUrl = function(userAddress, secret) {
    var hash, l, part1;
    l = window.location;
    part1 = l.protocol + '//' + l.host + l.pathname;
    hash = '/invitation/' + userAddress;
    return part1 + '#' + hash;
  };

  FriendsController.$inject = ['$scope', 'friendDAO', 'friendsStuffDAO', 'settingsDAO', '$routeParams'];

  FriendEditController = function($scope, friendDAO, friendsStuffDAO, profileDAO, $routeParams, $location) {
    var loadFriend, redirectToList;
    $scope.friend = new Friend();
    $scope.editMode = false;
    $scope.stuffList = [];
    $scope.profile = {};
    $scope.showValidationErrors = true;
    loadFriend = function() {
      return friendDAO.getItem($routeParams.id, function(friend) {
        $scope.friend = new Friend(friend);
        $scope.$digest();
        friendsStuffDAO.listStuffByFriend(friend, function(friendStuff) {
          $scope.stuffList = friendStuff;
          return $scope.$digest();
        });
        return profileDAO.getByFriend(friend, function(profile) {
          $scope.profile = new Profile(profile);
          return $scope.$digest();
        });
      });
    };
    loadFriend();
    redirectToList = function() {
      return $scope.$apply(function() {
        return $location.path('/friends');
      });
    };
    $scope.save = function() {
      $scope.friend.sanitize();
      return friendsStuffDAO.validateFriend($scope.friend, function(errors) {
        if (errors.length === 0) {
          return friendDAO.saveItem($scope.friend, function() {
            $scope.editMode = false;
            return loadFriend();
          });
        } else {
          return showValidationErrors($scope.friend, errors);
        }
      });
    };
    $scope.showEditMode = function() {
      return $scope.editMode = true;
    };
    return $scope["delete"] = function() {
      if (window.confirm("Do you really want to delete your friend \"" + $scope.friend.name + "\"?")) {
        return friendDAO.deleteItem($scope.friend.id, redirectToList);
      }
    };
  };

  FriendEditController.$inject = ['$scope', 'friendDAO', 'friendsStuffDAO', 'profileDAO', '$routeParams', '$location'];

  showValidationErrors = function(friend, errors) {
    var message;
    message = errors.join(',') + " seems invalid.";
    if (_.include(errors, 'secret')) {
      if (isBlank(friend.secret)) {
        message += " This could mean that your friend has not added public shared stuff yet.";
      } else {
        message += " This could mean that your friend has not added secret shared stuff yet.";
      }
    }
    return window.alert(message);
  };

  FriendViewController = function($scope, friendDAO, friendsStuffDAO, profileDAO, $routeParams, $location) {
    var friend;
    $scope.stuffList = [];
    friend = new Friend({
      userAddress: $routeParams.userAddress,
      secret: $routeParams.secret
    });
    $scope.friend = friend;
    $scope.profile = {};
    friendsStuffDAO.listStuffByFriend(friend, function(friendStuff) {
      $scope.stuffList = friendStuff;
      return $scope.$digest();
    });
    profileDAO.getByFriend(friend, function(profile) {
      $scope.profile = new Profile(profile);
      if (profile.name) {
        friend.name = profile.name;
      } else {
        friend.name = friend.userAddress.replace(/@.*$/, '') || 'unkown';
      }
      return $scope.$digest();
    });
    return $scope.addFriend = function() {
      return $location.path('/addFriend/' + friend.name + '/' + friend.userAddress + '/' + friend.secret);
    };
  };

  FriendViewController.$inject = ['$scope', 'friendDAO', 'friendsStuffDAO', 'profileDAO', '$routeParams', '$location'];

  ShareStuffController = function($scope, settingsDAO) {
    return settingsDAO.getSecret(function(secret) {
      var userAdress;
      userAdress = $scope.session.userAddress;
      $scope.inviteUrl = buildInviteFriendUrl(userAdress, secret);
      $scope.publicInviteUrl = buildPublicInviteUrl(userAdress);
      $scope.$digest();
      return focusAndSelect('inviteUrl');
    });
  };

  ShareStuffController.$inject = ['$scope', 'settingsDAO'];

  this.FriendsController = FriendsController;

  this.FriendEditController = FriendEditController;

  this.FriendViewController = FriendViewController;

  this.ShareStuffController = ShareStuffController;

}).call(this);
