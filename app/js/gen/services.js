(function() {
  'use strict';
  var CacheItemWrapper, FriendsStuffDAO, LocalStorageDAO, MY_STUFF_KEY, MyStuffDAO, PROFILE_KEY, PUBLIC_KEY, PUBLIC_PREFIX, ProfileDAO, PublicRemoteStorageService, RS_CATEGORY, RemoteStorageDAO, SettingsDAO, defer, doNothing, focus, getCurrentTime, getFriendStuffKey, getItemsFromContainer, initServices, isBlank, isOlderThan, log, randomString, rs, wrapIdentity,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
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
      this.deleteItem = __bind(this.deleteItem, this);
      this.saveItem = __bind(this.saveItem, this);
      this.readAllItems = __bind(this.readAllItems, this);
    }

    RemoteStorageDAO.prototype.readAllItems = function(callback) {
      var _this = this;
      if (this.dataCache) {
        return defer(function() {
          return callback(_this.dataCache.items);
        });
      } else {
        return this.remoteStorageUtils.getItem(this.category, this.key, function(error, data) {
          _this.dataCache = JSON.parse(data || '{}');
          _this.dataCache.items = getItemsFromContainer(_this.dataCache, _this.wrapItem);
          return callback(_this.dataCache.items);
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
      var _this = this;
      return this.readAllItems(function(items) {
        var oldItem;
        oldItem = _this.findItemByID(items, item.id);
        if (oldItem) {
          items[_.indexOf(items, oldItem)] = item;
        } else {
          items.push(item);
        }
        return _this.save(items, callback);
      });
    };

    RemoteStorageDAO.prototype.deleteItem = function(id, callback) {
      var _this = this;
      return this.readAllItems(function(items) {
        var oldItem;
        oldItem = _this.findItemByID(items, id);
        return _this.save(_.without(items, oldItem), callback);
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
      var publicStuff,
        _this = this;
      MyStuffDAO.__super__.save.call(this, allItems, callback);
      this.settingsDAO.getSecret(function(secret) {
        return _this.remoteStorageUtils.setItem('public', PUBLIC_PREFIX + secret, JSON.stringify({
          items: allItems
        }), doNothing);
      });
      publicStuff = _.filter(allItems, function(item) {
        return item.visibility === 'public';
      });
      return this.remoteStorageUtils.setItem('public', PUBLIC_PREFIX + PUBLIC_KEY, JSON.stringify({
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
      this.saveSettings = __bind(this.saveSettings, this);
      this.readSettings = __bind(this.readSettings, this);      this.settings = null;
      this.key = 'settings';
    }

    SettingsDAO.prototype.readSettings = function(callback) {
      var _this = this;
      if (this.settings) {
        return defer(function() {
          return callback(_this.settings);
        });
      } else {
        return rs.getItem(RS_CATEGORY, this.key, function(error, data) {
          var settings;
          if (error === 'timeout') {} else {
            settings = JSON.parse(data || '{}');
            _this.settings = settings;
            if (!settings.secret) {
              settings.secret = randomString(20);
              return _this.saveSettings(callback);
            } else {
              return callback(settings);
            }
          }
        });
      }
    };

    SettingsDAO.prototype.getSecret = function(callback) {
      return this.readSettings(function(settings) {
        return callback(settings.secret);
      });
    };

    SettingsDAO.prototype.saveSettings = function(callback) {
      var _this = this;
      return rs.setItem(RS_CATEGORY, this.key, JSON.stringify(this.settings), function() {
        return callback(_this.settings);
      });
    };

    return SettingsDAO;

  })();

  ProfileDAO = (function() {

    function ProfileDAO(publicRemoteStorageService, getTime) {
      this.publicRemoteStorageService = publicRemoteStorageService;
      this.getTime = getTime != null ? getTime : getCurrentTime;
      this.getByFriendWithDeferedRefresh = __bind(this.getByFriendWithDeferedRefresh, this);
      this.save = __bind(this.save, this);
      this.load = __bind(this.load, this);
      this.profile = null;
      this.key = PROFILE_KEY;
    }

    ProfileDAO.prototype.load = function(callback) {
      var _this = this;
      if (this.profile) {
        return defer(function() {
          return callback(_this.profile);
        });
      } else {
        return rs.getItem('public', this.key, function(error, data) {
          _this.profile = JSON.parse(data || '{}');
          return callback(new Profile(_this.profile));
        });
      }
    };

    ProfileDAO.prototype.save = function(profile, callback) {
      var _this = this;
      this.profile = profile;
      return rs.setItem('public', this.key, JSON.stringify(this.profile), function() {
        return callback(_this.profile);
      });
    };

    ProfileDAO.prototype.getByFriend = function(friend, callback) {
      return this._getByFriend('get', friend, callback);
    };

    ProfileDAO.prototype.getByFriendRefreshed = function(friend, callback) {
      return this._getByFriend('getRefreshed', friend, callback);
    };

    ProfileDAO.prototype.getByFriendWithDeferedRefresh = function(friend, maxAge, callback) {
      var _this = this;
      return this.getByFriend(friend, function(profile, status) {
        callback(profile, status);
        if (_this.getTime() - status.cacheTime > maxAge) {
          log("Update Profile defered");
          return _this.getByFriendRefreshed(friend, callback);
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
      this.getByClient = __bind(this.getByClient, this);
      this._refresh = __bind(this._refresh, this);
      this.clientByUserAddress = {};
    }

    PublicRemoteStorageService.prototype.get = function(userAddress, key, defaultValue, callback) {
      var cachedData, cachedWrapper;
      if (!userAddress) {
        log("Missing UserAdress!");
        callback(defaultValue, {
          error: "Missing UserAddress",
          cacheTime: this.getTime()
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
          cacheTime: this.getTime()
        });
      }
    };

    PublicRemoteStorageService.prototype._refresh = function(userAddress, key, defaultValue, callback) {
      var _this = this;
      if (this.clientByUserAddress[userAddress]) {
        return this.getByClient(userAddress, this.clientByUserAddress[userAddress], key, defaultValue, callback);
      } else {
        return this.remoteStorage.getStorageInfo(userAddress, function(error, storageInfo) {
          var client;
          if (storageInfo) {
            client = _this.remoteStorage.createClient(storageInfo, 'public');
            _this.clientByUserAddress[userAddress] = client;
            return _this.getByClient(userAddress, client, key, defaultValue, callback);
          } else {
            log(error);
            return callback(defaultValue, {
              error: error,
              cacheTime: _this.getTime()
            });
          }
        });
      }
    };

    PublicRemoteStorageService.prototype.getByClient = function(userAddress, client, key, defaultValue, callback) {
      var _this = this;
      return client.get(key, function(err, dataJsonString) {
        var currentTime, data;
        currentTime = _this.getTime();
        if (dataJsonString) {
          data = JSON.parse(dataJsonString);
          _this.cacheInLocalStorage(userAddress, key, new CacheItemWrapper(currentTime, data));
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
      this.listStuffByFriend = __bind(this.listStuffByFriend, this);
      this.friendsStuffList = [];
      this.cacheTimeByFriendID = {};
      this.friends = [];
    }

    FriendsStuffDAO.prototype.listStuffByFriend = function(friend, callback, refreshed) {
      var getProfileMethod,
        _this = this;
      if (refreshed == null) refreshed = false;
      getProfileMethod = refreshed ? 'getByFriendRefreshed' : 'getByFriend';
      return this.profileDAO[getProfileMethod](friend, function(profile, profileStatus) {
        var getStuffMethod;
        friend.location = profile.location;
        getStuffMethod = refreshed ? 'getRefreshed' : 'get';
        return _this.publicRemoteStorageDAO[getStuffMethod](friend.userAddress, getFriendStuffKey(friend), [], function(itemContainer, stuffStatus) {
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
      var _this = this;
      return this.listStuffByFriend(friend, function(stuffList, status) {
        callback(stuffList, status);
        if (isOlderThan(status.cacheTime, maxAge)) {
          log("Update friend's stuff defered");
          return _this.listStuffByFriendRefreshed(friend, callback);
        }
      });
    };

    FriendsStuffDAO.prototype.refreshMostOutdatedFriend = function(ageThreshold, callback) {
      var mostOutdatedFriend,
        _this = this;
      mostOutdatedFriend = _.min(this.friends, function(friend) {
        return _this.cacheTimeByFriendID[friend.id] || 0;
      });
      if (isOlderThan(this.cacheTimeByFriendID[mostOutdatedFriend.id], ageThreshold)) {
        return this.listStuffByFriend(mostOutdatedFriend, function(friendStuff, cacheTime) {
          log("Updating " + mostOutdatedFriend.name);
          _this._updateWithLoadedItems(friendStuff);
          _this.cacheTimeByFriendID[mostOutdatedFriend.id] = cacheTime;
          return callback(_this.friends, _this.friendsStuffList, 'LOADED');
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
      var _this = this;
      return this.friendDAO.list(function(friends) {
        var friend, loadedCounter, _i, _len, _results;
        _this.friends = friends;
        loadedCounter = 0;
        if (friends.length === 0) {
          callback(_this.friends, _this.friendsStuffList, 'NO_FRIENDS');
        }
        _results = [];
        for (_i = 0, _len = friends.length; _i < _len; _i++) {
          friend = friends[_i];
          _results.push(_this.listStuffByFriend(friend, function(friendStuff, status) {
            var returnStatus;
            _this._updateWithLoadedItems(friendStuff);
            _this.cacheTimeByFriendID[friend.id] = status.cacheTime;
            loadedCounter++;
            returnStatus = loadedCounter === friends.length ? 'LOADED' : 'LOADING';
            return callback(_this.friends, _this.friendsStuffList, returnStatus);
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

  this.RS_CATEGORY = RS_CATEGORY;

}).call(this);
