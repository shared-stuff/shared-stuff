(function() {
  var PublicRemoteStorageServiceMock, createRemoteStorageUtilsMock, defer, log;

  defer = utils.defer;

  log = utils.log;

  createRemoteStorageUtilsMock = testUtils.createRemoteStorageUtilsMock;

  PublicRemoteStorageServiceMock = testUtils.PublicRemoteStorageServiceMock;

  describe('RemoteStorageDAO', function() {
    var remoteStorageUtilsMock, rsCategory, rsKey;
    rsCategory = "rsCategory";
    rsKey = "rsKey";
    remoteStorageUtilsMock = void 0;
    beforeEach(function() {
      return remoteStorageUtilsMock = createRemoteStorageUtilsMock();
    });
    it('should load data with remoteStorageUtils', function() {
      var items, rsDAO;
      rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock, rsCategory, rsKey);
      remoteStorageUtilsMock.setItemObjectSync(rsCategory, rsKey, {
        items: [
          {
            userAddress: 'username@host.org'
          }
        ]
      });
      items = void 0;
      rsDAO.list(function(itemsResultArg) {
        return items = itemsResultArg;
      });
      waitsFor((function() {
        return items;
      }), "Retrieved Items", 100);
      return runs(function() {
        expect(items.length).toEqual(1);
        return expect(items[0].userAddress).toEqual('username@host.org');
      });
    });
    it('should wrap items', function() {
      var items, rsDAO, wrapItem;
      remoteStorageUtilsMock.setItemObjectSync(rsCategory, rsKey, {
        items: [
          {
            userAddress: 'username@host.org'
          }
        ]
      });
      wrapItem = function(itemData) {
        return {
          name: itemData.userAddress
        };
      };
      rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock, rsCategory, rsKey, wrapItem);
      items = void 0;
      rsDAO.list(function(itemsResultArg) {
        return items = itemsResultArg;
      });
      waitsFor((function() {
        return items;
      }), "Retrieved Items", 100);
      return runs(function() {
        expect(items.length).toEqual(1);
        return expect(items[0].name).toEqual('username@host.org');
      });
    });
    it('should save data with remoteStorageUtils', function() {
      var rsDAO, saved;
      remoteStorageUtilsMock.setItemObjectSync(rsCategory, rsKey, {
        items: [
          {
            userAddress: 'username@host.org'
          }
        ]
      });
      rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock, rsCategory, rsKey);
      saved = false;
      rsDAO.saveItem({
        id: 'id2',
        userAddress: 'username2@host.org'
      }, function(itemsResultArg) {
        return saved = true;
      });
      waitsFor((function() {
        return saved;
      }), "Saving", 100);
      return runs(function() {
        var items;
        items = remoteStorageUtilsMock.getItemObjectSync(rsCategory, rsKey).items;
        expect(items.length).toEqual(2);
        expect(items[0].userAddress).toEqual('username@host.org');
        return expect(items[1].userAddress).toEqual('username2@host.org');
      });
    });
    return it('should find items by any attribute', function() {
      var foundItem, rsDAO;
      remoteStorageUtilsMock.setItemObjectSync(rsCategory, rsKey, {
        items: [
          {
            userAddress: 'username1@host.org',
            name: 'username 1'
          }, {
            userAddress: 'username2@host.org',
            name: 'username 2'
          }
        ]
      });
      rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock, rsCategory, rsKey);
      foundItem = void 0;
      rsDAO.getItemBy('userAddress', 'username2@host.org', function(itemResultArg) {
        return foundItem = itemResultArg;
      });
      waitsFor((function() {
        return foundItem;
      }), "Saving", 100);
      return runs(function() {
        var items;
        items = remoteStorageUtilsMock.getItemObjectSync(rsCategory, rsKey).items;
        return expect(foundItem.name).toEqual('username 2');
      });
    });
  });

  describe('MyStuffDAO', function() {
    var myStuffDAO, remoteStorageUtilsMock, rsCategory, rsKey, settingsDAO;
    rsCategory = "rsCategory";
    rsKey = "rsKey";
    remoteStorageUtilsMock = void 0;
    myStuffDAO = void 0;
    settingsDAO = {
      getSecret: function(callback) {
        return callback('secret');
      }
    };
    beforeEach(function() {
      remoteStorageUtilsMock = createRemoteStorageUtilsMock();
      remoteStorageUtilsMock.setItemObjectSync(rsCategory, rsKey, {
        items: [
          {
            id: '1',
            title: "Stuff Title 1",
            created: 1,
            visibility: 'friends'
          }, {
            id: '2',
            title: "Stuff Title 2",
            created: 2,
            visibility: 'friends'
          }
        ]
      });
      return myStuffDAO = new MyStuffDAO(remoteStorageUtilsMock, rsCategory, rsKey, settingsDAO);
    });
    it('should wrap loaded data with class Stuff', function() {
      var items;
      items = void 0;
      myStuffDAO.list(function(itemsResultArg) {
        return items = itemsResultArg;
      });
      waitsFor((function() {
        return items;
      }), "Retrieved Items", 100);
      return runs(function() {
        expect(items.length).toEqual(2);
        expect(items[0].title).toEqual('Stuff Title 1');
        return expect(typeof items[0].modify).toEqual('function');
      });
    });
    return it('should save data with filtered copies in public category', function() {
      var saved;
      saved = false;
      myStuffDAO.saveItem(new Stuff({
        id: '2',
        title: 'Stuff Title 2.1',
        visibility: 'public'
      }), function(itemsResultArg) {
        return saved = true;
      });
      waitsFor(function() {
        return saved && remoteStorageUtilsMock.getItemObjectSync('public', 'sharedstuff-secret') && remoteStorageUtilsMock.getItemObjectSync('public', 'sharedstuff-public');
      }, "Saving", 100);
      return runs(function() {
        var items, itemsForFriends;
        items = remoteStorageUtilsMock.getItemObjectSync(rsCategory, rsKey).items;
        expect(items.length).toEqual(2);
        expect(items[0].title).toEqual('Stuff Title 1');
        expect(items[1].title).toEqual('Stuff Title 2.1');
        itemsForFriends = remoteStorageUtilsMock.getItemObjectSync('public', 'sharedstuff-secret').items;
        expect(itemsForFriends.length).toEqual(2);
        expect(itemsForFriends[0].title).toEqual('Stuff Title 1');
        expect(itemsForFriends[1].title).toEqual('Stuff Title 2.1');
        itemsForFriends = remoteStorageUtilsMock.getItemObjectSync('public', 'sharedstuff-public').items;
        expect(itemsForFriends.length).toEqual(1);
        return expect(itemsForFriends[0].title).toEqual('Stuff Title 2.1');
      });
    });
  });

  describe('ProfileDAO', function() {
    var currentTime, dummyCacheTime, friend, getMockedTime, profileDAO, publicRemoteStorageService;
    publicRemoteStorageService = void 0;
    profileDAO = void 0;
    friend = new Friend({
      userAddress: 'user@host.org'
    });
    dummyCacheTime = 123;
    currentTime = 200;
    getMockedTime = function() {
      return currentTime;
    };
    beforeEach(function() {
      publicRemoteStorageService = new PublicRemoteStorageServiceMock({
        name: 'cachedName'
      }, {
        name: 'freshName'
      }, dummyCacheTime, currentTime);
      profileDAO = new ProfileDAO(publicRemoteStorageService, getMockedTime);
      spyOn(publicRemoteStorageService, 'get').andCallThrough();
      return spyOn(publicRemoteStorageService, 'getRefreshed').andCallThrough();
    });
    it('should normally return a cached profile', function() {
      var cacheTime, profile;
      profile = void 0;
      cacheTime = void 0;
      profileDAO.getByFriend(friend, function(profileResult, status) {
        profile = profileResult;
        return cacheTime = status.cacheTime;
      });
      waitsFor((function() {
        return profile;
      }), "Load Profile", 100);
      return runs(function() {
        expect(profile.name).toEqual('cachedName');
        expect(cacheTime).toEqual(dummyCacheTime);
        return expect(publicRemoteStorageService.get).toHaveBeenCalledWith(friend.userAddress, profileDAO.key, {}, jasmine.any(Function));
      });
    });
    it('should return a refreshed profile on request', function() {
      var cacheTime, profile;
      profile = void 0;
      cacheTime = void 0;
      profileDAO.getByFriendRefreshed(friend, function(profileResult, status) {
        profile = profileResult;
        return cacheTime = status.cacheTime;
      });
      waitsFor((function() {
        return profile;
      }), "Load Fresh Profile", 100);
      return runs(function() {
        expect(profile.name).toEqual('freshName');
        expect(cacheTime).toEqual(currentTime);
        return expect(publicRemoteStorageService.getRefreshed).toHaveBeenCalledWith(friend.userAddress, profileDAO.key, {}, jasmine.any(Function));
      });
    });
    return describe('getByFriendWithDeferedRefresh', function() {
      it('should not return a refreshed profile defered if the cached is younger then maxAge', function() {
        var cacheTime, maxAge, profile;
        profile = void 0;
        cacheTime = void 0;
        maxAge = 200;
        profileDAO.getByFriendWithDeferedRefresh(friend, maxAge, function(profileResult, status) {
          profile = profileResult;
          return cacheTime = status.cacheTime;
        });
        waitsFor((function() {
          return profile;
        }), "Load Fresh Profile", 100);
        return runs(function() {
          expect(profile.name).toEqual('cachedName');
          expect(cacheTime).toEqual(dummyCacheTime);
          expect(publicRemoteStorageService.get).toHaveBeenCalledWith(friend.userAddress, profileDAO.key, {}, jasmine.any(Function));
          return expect(publicRemoteStorageService.getRefreshed.calls.length).toEqual(0);
        });
      });
      return it('should return an additional refreshed profile defered if the cached profile is older then maxAge', function() {
        var cacheTimes, maxAge, profiles;
        profiles = [];
        cacheTimes = [];
        maxAge = 50;
        profileDAO.getByFriendWithDeferedRefresh(friend, maxAge, function(profileResult, status) {
          profiles.push(profileResult);
          return cacheTimes.push(status.cacheTime);
        });
        waitsFor((function() {
          return profiles.length === 2;
        }), "Load Cached And Fresh Profile", 100);
        return runs(function() {
          expect(profiles.length).toEqual(2);
          expect(profiles[0].name).toEqual('cachedName');
          expect(profiles[1].name).toEqual('freshName');
          expect(cacheTimes).toEqual([dummyCacheTime, currentTime]);
          expect(publicRemoteStorageService.get).toHaveBeenCalledWith(friend.userAddress, profileDAO.key, {}, jasmine.any(Function));
          return expect(publicRemoteStorageService.getRefreshed).toHaveBeenCalledWith(friend.userAddress, profileDAO.key, {}, jasmine.any(Function));
        });
      });
    });
  });

  describe('FriendsStuffDAO', function() {
    var fsDao, remoteStorageUtilsMock;
    fsDao = void 0;
    remoteStorageUtilsMock = void 0;
    beforeEach(function() {
      var friendDAO, localStorageMock, profileDAO, publicRemoteStorageService, remoteStorageMock;
      remoteStorageUtilsMock = createRemoteStorageUtilsMock();
      friendDAO = new RemoteStorageDAO(remoteStorageUtilsMock, RS_CATEGORY, 'myFriendsList', function(data) {
        return new Friend(data);
      });
      remoteStorageMock = new testUtils.RemoteStorageMock();
      localStorageMock = new testUtils.LocalStorageMock();
      publicRemoteStorageService = new PublicRemoteStorageService(remoteStorageMock, localStorageMock);
      profileDAO = new ProfileDAO(publicRemoteStorageService);
      fsDao = new FriendsStuffDAO(friendDAO, publicRemoteStorageService, profileDAO);
      remoteStorageUtilsMock.setItemObjectSync(RS_CATEGORY, 'myFriendsList', {
        items: [
          {
            name: 'marco',
            userAddress: 'marco@host.org'
          }, {
            name: 'nora',
            userAddress: 'nora@host.org'
          }
        ]
      });
      remoteStorageMock.setPublicItem('marco@host.org', 'sharedstuff-public', {
        items: [
          {
            id: 1,
            title: 'Marco Stuff 1'
          }, {
            id: 2,
            title: 'Marco Stuff 2'
          }
        ]
      });
      return remoteStorageMock.setPublicItem('nora@host.org', 'sharedstuff-public', {
        items: [
          {
            id: 3,
            title: 'Nora Stuff 1'
          }
        ]
      });
    });
    return it("should return friend's stuff", function() {
      var friends, status, stuffList;
      friends = null;
      stuffList = null;
      status = null;
      fsDao.list(function(friendsArg, stuffListArg, statusArg) {
        friends = friendsArg;
        stuffList = stuffListArg;
        return status = statusArg;
      });
      waitsFor((function() {
        return status === 'LOADED';
      }), "Loaded Stuff", 100);
      return runs(function() {
        expect(friends.length).toEqual(2);
        expect(friends[0].name).toEqual('marco');
        expect(friends[1].name).toEqual('nora');
        expect(stuffList.length).toEqual(3);
        expect(stuffList[0].title).toEqual("Marco Stuff 1");
        expect(stuffList[1].title).toEqual("Marco Stuff 2");
        return expect(stuffList[2].title).toEqual("Nora Stuff 1");
      });
    });
  });

}).call(this);
