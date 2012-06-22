(function() {
  var PublicRemoteStorageServiceMock, createRemoteStorageUtilsMock, defer, log;

  defer = utils.defer;

  log = utils.log;

  createRemoteStorageUtilsMock = function() {
    var mockedValues;
    mockedValues = {};
    return {
      getItemObjectSync: function(category, key) {
        var json, _ref;
        log(mockedValues);
        json = (_ref = mockedValues[category]) != null ? _ref[key] : void 0;
        if (json) {
          return JSON.parse(json);
        } else {

        }
      },
      setItemObjectSync: function(category, key, value) {
        if (!(category in mockedValues)) mockedValues[category] = {};
        return mockedValues[category][key] = JSON.stringify(value);
      },
      getItem: function(category, key, callback) {
        return defer(function() {
          var _ref;
          return callback(null, (_ref = mockedValues[category]) != null ? _ref[key] : void 0);
        });
      },
      setItem: function(category, key, value, callback) {
        log('Set Item' + category + key + value);
        if (!(category in mockedValues)) mockedValues[category] = {};
        mockedValues[category][key] = value;
        return defer(function() {
          return callback();
        });
      }
    };
  };

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

  PublicRemoteStorageServiceMock = (function() {

    function PublicRemoteStorageServiceMock(dummyValueCache, dummyValueFresh, dummyCacheTime, currentTime) {
      this.dummyValueCache = dummyValueCache;
      this.dummyValueFresh = dummyValueFresh;
      this.dummyCacheTime = dummyCacheTime;
      this.currentTime = currentTime;
    }

    PublicRemoteStorageServiceMock.prototype.get = function(userAddress, key, defaultValue, callback) {
      return callback(this.dummyValueCache, {
        cacheTime: this.dummyCacheTime
      });
    };

    PublicRemoteStorageServiceMock.prototype.getRefreshed = function(userAddress, key, defaultValue, callback) {
      return callback(this.dummyValueFresh, {
        cacheTime: this.currentTime
      });
    };

    return PublicRemoteStorageServiceMock;

  })();

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

}).call(this);
