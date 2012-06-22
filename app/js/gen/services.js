(function() {
  'use strict';
  var CacheItemWrapper, FriendsStuffDAO, LocalStorageDAO, MY_STUFF_KEY, MyStuffDAO, PROFILE_KEY, PUBLIC_KEY, PUBLIC_PREFIX, ProfileDAO, PublicRemoteStorageService, RS_CATEGORY, RemoteStorageDAO, SettingsDAO, defer, doNothing, focus, getCurrentTime, getFriendStuffKey, getItemsFromContainer, initServices, isBlank, isOlderThan, log, randomString, rs, wrapIdentity,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  log = utils.log;

  isBlank = utils.isBlank;

  focus = utils.focus;

  doNothing = utils.doNothing;

  randomString = utils.randomString;

  defer = utils.defer;

  getCurrentTime = utils.getCurrentTime;

  isOlderThan = utils.isOlderThan;

  RS_CATEGORY = "sharedstuff";

  MY_STUFF_KEY = "myStuffList";

  PUBLIC_PREFIX = "sharedstuff-";

  PUBLIC_KEY = "public";

  PROFILE_KEY = PUBLIC_PREFIX + "profile";

  rs = remoteStorageUtils;

  wrapIdentity = function(item) {
    return item;
  };

  RemoteStorageDAO = (function() {

    function RemoteStorageDAO(remoteStorageUtils, category, key, wrapItem) {
      this.remoteStorageUtils = remoteStorageUtils;
      this.category = category;
      this.key = key;
      this.wrapItem = wrapItem != null ? wrapItem : wrapIdentity;
    }

    RemoteStorageDAO.prototype.readAllItems = function(callback) {
      var self;
      self = this;
      if (self.dataCache) {
        return defer(function() {
          return callback(self.dataCache.items);
        });
      } else {
        return self.remoteStorageUtils.getItem(this.category, this.key, function(error, data) {
          self.dataCache = JSON.parse(data || '{}');
          self.dataCache.items = getItemsFromContainer(self.dataCache, self.wrapItem);
          return callback(self.dataCache.items);
        });
      }
    };

    RemoteStorageDAO.prototype.findItemByID = function(items, id) {
      return _.find(items, function(it) {
        return it.id === id;
      });
    };

    RemoteStorageDAO.prototype.list = function(callback) {
      return this.readAllItems(callback);
    };

    RemoteStorageDAO.prototype.getItem = function(id, callback) {
      return this.getItemBy('id', id, callback);
    };

    RemoteStorageDAO.prototype.getItemBy = function(attribute, value, callback) {
      return this.readAllItems(function(items) {
        return callback(_.find(items, function(it) {
          return it[attribute] === value;
        }));
      });
    };

    RemoteStorageDAO.prototype.save = function(allItems, callback) {
      utils.cleanObjectFromAngular(allItems);
      if (!this.dataCache) this.dataCache = {};
      this.dataCache.items = allItems;
      return this.remoteStorageUtils.setItem(this.category, this.key, JSON.stringify(this.dataCache), callback);
    };

    RemoteStorageDAO.prototype.saveItem = function(item, callback) {
      var self;
      self = this;
      return this.readAllItems(function(items) {
        var oldItem;
        oldItem = self.findItemByID(items, item.id);
        if (oldItem) {
          items[_.indexOf(items, oldItem)] = item;
        } else {
          items.push(item);
        }
        return self.save(items, callback);
      });
    };

    RemoteStorageDAO.prototype.deleteItem = function(id, callback) {
      var self;
      self = this;
      return this.readAllItems(function(items) {
        var oldItem;
        oldItem = self.findItemByID(items, id);
        return self.save(_.without(items, oldItem), callback);
      });
    };

    return RemoteStorageDAO;

  })();

  MyStuffDAO = (function(_super) {

    __extends(MyStuffDAO, _super);

    function MyStuffDAO(remoteStorageUtils, category, key, settingsDAO) {
      this.remoteStorageUtils = remoteStorageUtils;
      this.category = category;
      this.key = key;
      this.settingsDAO = settingsDAO;
      MyStuffDAO.__super__.constructor.call(this, this.remoteStorageUtils, this.category, this.key, function(stuffData) {
        return new Stuff(stuffData);
      });
    }

    MyStuffDAO.prototype.save = function(allItems, callback) {
      var publicStuff, self;
      self = this;
      MyStuffDAO.__super__.save.call(this, allItems, callback);
      this.settingsDAO.getSecret(function(secret) {
        return self.remoteStorageUtils.setItem('public', PUBLIC_PREFIX + secret, JSON.stringify({
          items: allItems
        }), doNothing);
      });
      publicStuff = _.filter(allItems, function(item) {
        return item.visibility === 'public';
      });
      return self.remoteStorageUtils.setItem('public', PUBLIC_PREFIX + PUBLIC_KEY, JSON.stringify({
        items: publicStuff
      }), doNothing);
    };

    return MyStuffDAO;

  })(RemoteStorageDAO);

  LocalStorageDAO = (function() {

    function LocalStorageDAO(key) {
      this.key = key;
    }

    LocalStorageDAO.prototype.readAllItems = function() {
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    };

    LocalStorageDAO.prototype.findItemByID = function(items, id) {
      return _.find(items, function(it) {
        return it.id === id;
      });
    };

    LocalStorageDAO.prototype.list = function(callback) {
      return callback(this.readAllItems());
    };

    LocalStorageDAO.prototype.getItem = function(id, callback) {
      return callback(_.find(this.readAllItems(), function(it) {
        return it.id === id;
      }));
    };

    LocalStorageDAO.prototype.save = function(allItems) {
      utils.cleanObjectFromAngular(allItems);
      return localStorage.setItem(this.key, JSON.stringify(allItems));
    };

    LocalStorageDAO.prototype.saveItem = function(item) {
      var items, oldItem;
      items = this.readAllItems();
      oldItem = this.findItemByID(items, item.id);
      items[_.indexOf(items, oldItem)] = item;
      return this.save(items);
    };

    LocalStorageDAO.prototype.deleteItem = function(id) {
      var items, oldItem;
      items = this.readAllItems();
      oldItem = this.findItemByID(items, id);
      return this.save(_.without(items, oldItem));
    };

    return LocalStorageDAO;

  })();

  SettingsDAO = (function() {

    function SettingsDAO() {
      this.settings = null;
      this.key = 'settings';
    }

    SettingsDAO.prototype.readSettings = function(callback) {
      var self;
      self = this;
      if (self.settings) {
        return defer(function() {
          return callback(self.settings);
        });
      } else {
        return rs.getItem(RS_CATEGORY, self.key, function(error, data) {
          var settings;
          if (error === 'timeout') {} else {
            settings = JSON.parse(data || '{}');
            self.settings = settings;
            if (!settings.secret) {
              settings.secret = randomString(20);
              return self.saveSettings(callback);
            } else {
              return callback(settings);
            }
          }
        });
      }
    };

    SettingsDAO.prototype.getSecret = function(callback) {
      var self;
      self = this;
      return this.readSettings(function(settings) {
        return callback(settings.secret);
      });
    };

    SettingsDAO.prototype.saveSettings = function(callback) {
      var self;
      self = this;
      return rs.setItem(RS_CATEGORY, self.key, JSON.stringify(self.settings), function() {
        return callback(self.settings);
      });
    };

    return SettingsDAO;

  })();

  ProfileDAO = (function() {

    function ProfileDAO(publicRemoteStorageService, getTime) {
      this.publicRemoteStorageService = publicRemoteStorageService;
      this.getTime = getTime != null ? getTime : getCurrentTime;
      this.profile = null;
      this.key = PROFILE_KEY;
    }

    ProfileDAO.prototype.load = function(callback) {
      var self;
      self = this;
      if (self.profile) {
        return defer(function() {
          return callback(self.profile);
        });
      } else {
        return rs.getItem('public', self.key, function(error, data) {
          self.profile = JSON.parse(data || '{}');
          return callback(new Profile(self.profile));
        });
      }
    };

    ProfileDAO.prototype.save = function(profile, callback) {
      var self;
      self = this;
      self.profile = profile;
      return rs.setItem('public', self.key, JSON.stringify(self.profile), function() {
        return callback(self.profile);
      });
    };

    ProfileDAO.prototype.getByFriend = function(friend, callback) {
      return this._getByFriend('get', friend, callback);
    };

    ProfileDAO.prototype.getByFriendRefreshed = function(friend, callback) {
      return this._getByFriend('getRefreshed', friend, callback);
    };

    ProfileDAO.prototype.getByFriendWithDeferedRefresh = function(friend, maxAge, callback) {
      var self;
      self = this;
      return this.getByFriend(friend, function(profile, status) {
        callback(profile, status);
        if (self.getTime() - status.cacheTime > maxAge) {
          log("Update Profile defered");
          return self.getByFriendRefreshed(friend, callback);
        }
      });
    };

    ProfileDAO.prototype._getByFriend = function(getMethod, friend, callback) {
      return this.publicRemoteStorageService[getMethod](friend.userAddress, this.key, {}, function(result, status) {
        return callback(new Profile(result), status);
      });
    };

    return ProfileDAO;

  })();

  CacheItemWrapper = (function() {

    function CacheItemWrapper(time, data) {
      this.time = time;
      this.data = data;
    }

    return CacheItemWrapper;

  })();

  PublicRemoteStorageService = (function() {

    function PublicRemoteStorageService(remoteStorage, localStorage, getTime) {
      this.remoteStorage = remoteStorage;
      this.localStorage = localStorage;
      this.getTime = getTime != null ? getTime : getCurrentTime;
      this.clientByUserAddress = {};
    }

    PublicRemoteStorageService.prototype.get = function(userAddress, key, defaultValue, callback) {
      var cachedData, cachedWrapper;
      if (!userAddress) {
        log("Missing UserAdress!");
        callback(defaultValue, {
          error: "Missing UserAddress",
          cacheTime: self.getTime()
        });
        return;
      }
      cachedData = this.localStorage.getItem(this.localStorageKey(userAddress, key));
      if (cachedData) {
        log("Loading " + userAddress + ":" + key + " from cache");
        cachedWrapper = JSON.parse(cachedData);
        return callback(cachedWrapper.data, {
          cacheTime: cachedWrapper.time
        });
      } else {
        return this._refresh(userAddress, key, defaultValue, callback);
      }
    };

    PublicRemoteStorageService.prototype.getRefreshed = function(userAddress, key, defaultValue, callback) {
      if (userAddress) {
        return this._refresh(userAddress, key, defaultValue, callback);
      } else {
        log("Missing UserAdress!");
        return callback(defaultValue, {
          error: "Missing UserAddress",
          cacheTime: self.getTime()
        });
      }
    };

    PublicRemoteStorageService.prototype._refresh = function(userAddress, key, defaultValue, callback) {
      var self;
      self = this;
      if (this.clientByUserAddress[userAddress]) {
        return this.getByClient(userAddress, this.clientByUserAddress[userAddress], key, defaultValue, callback);
      } else {
        return self.remoteStorage.getStorageInfo(userAddress, function(error, storageInfo) {
          var client;
          if (storageInfo) {
            client = self.remoteStorage.createClient(storageInfo, 'public');
            self.clientByUserAddress[userAddress] = client;
            return self.getByClient(userAddress, client, key, defaultValue, callback);
          } else {
            log(error);
            return callback(defaultValue, {
              error: error,
              cacheTime: self.getTime()
            });
          }
        });
      }
    };

    PublicRemoteStorageService.prototype.getByClient = function(userAddress, client, key, defaultValue, callback) {
      var self;
      self = this;
      return client.get(key, function(err, dataJsonString) {
        var currentTime, data;
        currentTime = self.getTime();
        if (dataJsonString) {
          data = JSON.parse(dataJsonString);
          self.cacheInLocalStorage(userAddress, key, new CacheItemWrapper(currentTime, data));
          return callback(data, {
            cacheTime: currentTime
          });
        } else {
          return callback(defaultValue, {
            cacheTime: currentTime
          });
        }
      });
    };

    PublicRemoteStorageService.prototype.cacheInLocalStorage = function(userAddress, key, cacheItemWrapper) {
      return this.localStorage.setItem(this.localStorageKey(userAddress, key), JSON.stringify(cacheItemWrapper));
    };

    PublicRemoteStorageService.prototype.localStorageKey = function(userAddress, key) {
      return "remoteStorageCache:" + userAddress + ":public:" + key;
    };

    return PublicRemoteStorageService;

  })();

  getItemsFromContainer = function(itemContainer, wrapItem) {
    return _.map((itemContainer != null ? itemContainer.items : void 0) || [], wrapItem);
  };

  FriendsStuffDAO = (function() {

    function FriendsStuffDAO(friendDAO, publicRemoteStorageDAO, profileDAO) {
      this.friendDAO = friendDAO;
      this.publicRemoteStorageDAO = publicRemoteStorageDAO;
      this.profileDAO = profileDAO;
      this.friendsStuffList = [];
      this.cacheTimeByFriendID = {};
      this.friends = [];
    }

    FriendsStuffDAO.prototype.listStuffByFriend = function(friend, callback, refreshed) {
      var getProfileMethod, self;
      if (refreshed == null) refreshed = false;
      self = this;
      getProfileMethod = refreshed ? 'getByFriendRefreshed' : 'getByFriend';
      return this.profileDAO[getProfileMethod](friend, function(profile, profileStatus) {
        var getStuffMethod;
        friend.location = profile.location;
        getStuffMethod = refreshed ? 'getRefreshed' : 'get';
        return self.publicRemoteStorageDAO[getStuffMethod](friend.userAddress, getFriendStuffKey(friend), [], function(itemContainer, stuffStatus) {
          log("Got Stuff for " + friend.name);
          return callback(getItemsFromContainer(itemContainer, function(item) {
            item = new Stuff(item);
            item.owner = friend;
            return item;
          }), {
            cacheTime: Math.min(profileStatus.cacheTime, stuffStatus.cacheTime)
          });
        });
      });
    };

    FriendsStuffDAO.prototype.listStuffByFriendRefreshed = function(friend, callback) {
      return this.listStuffByFriend(friend, callback, true);
    };

    FriendsStuffDAO.prototype.listStuffByFriendWithDeferedRefresh = function(friend, maxAge, callback) {
      var self;
      self = this;
      return this.listStuffByFriend(friend, function(stuffList, status) {
        callback(stuffList, status);
        if (isOlderThan(status.cacheTime, maxAge)) {
          log("Update friend's stuff defered");
          return self.listStuffByFriendRefreshed(friend, callback);
        }
      });
    };

    FriendsStuffDAO.prototype.refreshMostOutdatedFriend = function(ageThreshold, callback) {
      var cacheTimeByFriendID, mostOutdatedFriend, self;
      self = this;
      cacheTimeByFriendID = this.cacheTimeByFriendID;
      mostOutdatedFriend = _.min(this.friends, function(friend) {
        return cacheTimeByFriendID[friend.id] || 0;
      });
      if (isOlderThan(cacheTimeByFriendID[mostOutdatedFriend.id], ageThreshold)) {
        return self.listStuffByFriend(mostOutdatedFriend, function(friendStuff, cacheTime) {
          log("Updating " + mostOutdatedFriend.name);
          self._updateWithLoadedItems(friendStuff);
          self.cacheTimeByFriendID[mostOutdatedFriend.id] = cacheTime;
          return callback(self.friends, self.friendsStuffList, 'LOADED');
        }, true);
      }
    };

    FriendsStuffDAO.prototype.validateFriend = function(friend, callback) {
      if (!utils.isBlank(friend.userAddress)) {
        return remoteStorage.getStorageInfo(friend.userAddress, function(error, storageInfo) {
          var client;
          if (storageInfo) {
            client = remoteStorage.createClient(storageInfo, 'public');
            if (isBlank(friend.secret)) {
              return callback([]);
            } else {
              return client.get(getFriendStuffKey(friend), function(err, data) {
                if (data) {
                  return callback([]);
                } else {
                  log(err);
                  return callback(['secret']);
                }
              });
            }
          } else {
            log(error);
            return callback(['userAddress']);
          }
        });
      } else {
        return callback(['userAddress']);
      }
    };

    FriendsStuffDAO.prototype.clearCache = function() {
      return this.friendsStuffList = [];
    };

    FriendsStuffDAO.prototype.list = function(callback) {
      var self;
      self = this;
      return this.friendDAO.list(function(friends) {
        var friend, loadedCounter, _i, _len, _results;
        self.friends = friends;
        loadedCounter = 0;
        if (friends.length === 0) {
          callback(self.friends, self.friendsStuffList, 'NO_FRIENDS');
        }
        _results = [];
        for (_i = 0, _len = friends.length; _i < _len; _i++) {
          friend = friends[_i];
          _results.push(self.listStuffByFriend(friend, function(friendStuff, status) {
            self._updateWithLoadedItems(friendStuff);
            self.cacheTimeByFriendID[friend.id] = status.cacheTime;
            loadedCounter++;
            return callback(self.friends, self.friendsStuffList, loadedCounter === friends.length ? 'LOADED' : 'LOADING');
          }));
        }
        return _results;
      });
    };

    FriendsStuffDAO.prototype._updateWithLoadedItems = function(friendStuff) {
      var existingItem, stuff, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = friendStuff.length; _i < _len; _i++) {
        stuff = friendStuff[_i];
        existingItem = _.find(this.friendsStuffList, function(it) {
          return it.id === stuff.id;
        });
        if (existingItem) {
          _results.push(this.friendsStuffList[_.indexOf(this.friendsStuffList, existingItem)] = stuff);
        } else {
          _results.push(this.friendsStuffList.push(stuff));
        }
      }
      return _results;
    };

    return FriendsStuffDAO;

  })();

  getFriendStuffKey = function(friend) {
    return PUBLIC_PREFIX + (!isBlank(friend.secret) ? friend.secret : "public");
  };

  initServices = function() {
    var friendDAO, profileDAO, publicRemoteStorageService, settingsDAO;
    friendDAO = new RemoteStorageDAO(remoteStorageUtils, RS_CATEGORY, 'myFriendsList', function(data) {
      return new Friend(data);
    });
    settingsDAO = new SettingsDAO();
    publicRemoteStorageService = new PublicRemoteStorageService(remoteStorage, localStorage);
    profileDAO = new ProfileDAO(publicRemoteStorageService);
    return angular.module('myApp.services', []).value('version', '0.1').value('settingsDAO', settingsDAO).value('stuffDAO', new MyStuffDAO(remoteStorageUtils, RS_CATEGORY, MY_STUFF_KEY, settingsDAO)).value('friendDAO', friendDAO).value('friendsStuffDAO', new FriendsStuffDAO(friendDAO, publicRemoteStorageService, profileDAO)).value('profileDAO', profileDAO).value('localizer', new Localizer());
  };

  initServices();

  this.RemoteStorageDAO = RemoteStorageDAO;

  this.MyStuffDAO = MyStuffDAO;

  this.ProfileDAO = ProfileDAO;

  this.PublicRemoteStorageService = PublicRemoteStorageService;

  this.FriendsStuffDAO = FriendsStuffDAO;

}).call(this);
