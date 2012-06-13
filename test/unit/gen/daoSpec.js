(function() {
  var createRemoteStorageUtilsMock, defer, log;

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
      remoteStorageUtilsMock = createRemoteStorageUtilsMock();
      return remoteStorageUtilsMock.setItemObjectSync(rsCategory, rsKey, {
        items: [
          {
            userAddress: 'username@host.org'
          }
        ]
      });
    });
    it('should load data with remoteStorageUtils', function() {
      var items, rsDAO;
      rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock, rsCategory, rsKey);
      items = void 0;
      rsDAO.list(function(itemsResultArg) {
        return items = itemsResultArg;
      });
      waitsFor(function() {
        return items;
      }, "Retrived Items", 1000);
      return runs(function() {
        expect(items.length).toEqual(1);
        return expect(items[0].userAddress).toEqual('username@host.org');
      });
    });
    it('should wrap items', function() {
      var items, rsDAO, wrapItem;
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
      waitsFor(function() {
        return items;
      }, "Retrived Items", 1000);
      return runs(function() {
        expect(items.length).toEqual(1);
        return expect(items[0].name).toEqual('username@host.org');
      });
    });
    return it('should save data with remoteStorageUtils', function() {
      var rsDAO, saved;
      rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock, rsCategory, rsKey);
      saved = false;
      rsDAO.saveItem({
        id: 'id2',
        userAddress: 'username2@host.org'
      }, function(itemsResultArg) {
        return saved = true;
      });
      waitsFor(function() {
        return saved;
      }, "Saving", 1000);
      return runs(function() {
        var items;
        items = remoteStorageUtilsMock.getItemObjectSync(rsCategory, rsKey).items;
        expect(items.length).toEqual(2);
        expect(items[0].userAddress).toEqual('username@host.org');
        return expect(items[1].userAddress).toEqual('username2@host.org');
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
      waitsFor(function() {
        return items;
      }, "Retrived Items", 1000);
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
      }, "Saving", 1000);
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

}).call(this);
