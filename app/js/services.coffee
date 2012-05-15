'use strict'
log = utils.log
isBlank = utils.isBlank
focus = utils.focus
doNothing = utils.doNothing
randomString = utils.randomString
defer = utils.defer

RS_CATEGORY = "sharedstuff"
MY_STUFF_KEY = "myStuffList"
PUBLIC_PREFIX = "sharedstuff-"
PUBLIC_KEY = "public"

rs = remoteStorageUtils

class RemoteStorageDAO
  constructor: (@category, @key) ->

  readAllItems: (callback) ->
    self = this
    if self.dataCache
      defer ->
        callback(self.dataCache.items)
    else
      rs.getItem(@category, @key, (error, data)->
          self.dataCache = JSON.parse(data || '{"items":[]}')
          callback(self.dataCache.items)
      )

  findItemByID: (items, id) -> _.find(items, (it) -> it.id == id)

  list: (callback) ->
    @readAllItems(callback)

  getItem: (id, callback) ->
    @readAllItems (items) ->
      callback(_.find(items, (it) -> it.id == id))

  save: (allItems, callback) ->
    utils.cleanObjectFromAngular(allItems)
    if !@dataCache
      @dataCache = {}
    @dataCache.items = allItems
    rs.setItem(@category, @key, JSON.stringify(@dataCache), callback)

  saveItem: (item, callback) ->
    self = @
    @readAllItems (items) ->
      oldItem = self.findItemByID(items, item.id)
      if oldItem
        items[_.indexOf(items, oldItem)] = item
      else
        items.push(item)
      self.save(items, callback)

  deleteItem: (id, callback) ->
    self = @
    @readAllItems (items) ->
      oldItem = self.findItemByID(items, id)
      self.save(_.without(items, oldItem), callback)


class MyStuffDAO extends RemoteStorageDAO
  constructor: (@category, @key, @settingsDAO) ->

  save: (allItems, callback) ->
    super(allItems, callback)
    @settingsDAO.getSecret (secret)->
      rs.setItem('public', PUBLIC_PREFIX+secret, JSON.stringify(allItems), doNothing)
    publicStuff = _.filter(allItems, (item)-> item.visibility=='public')
    rs.setItem('public', PUBLIC_PREFIX+PUBLIC_KEY, JSON.stringify(publicStuff), doNothing)


class LocalStorageDAO
  constructor: (@key) ->

  readAllItems: () -> JSON.parse(localStorage.getItem(@key) || '[]')
  findItemByID: (items, id) -> _.find(items, (it) -> it.id == id)

  list: (callback) ->
    callback(@readAllItems())

  getItem: (id, callback) ->
    callback(_.find(@readAllItems(), (it) -> it.id == id))

  save: (allItems) ->
    utils.cleanObjectFromAngular(allItems)
    localStorage.setItem(@key, JSON.stringify(allItems))

  saveItem: (item) ->
    items = @readAllItems()
    oldItem = @findItemByID(items, item.id)
    items[_.indexOf(items, oldItem)] = item
    @save(items)

  deleteItem: (id) ->
    items = @readAllItems()
    oldItem = @findItemByID(items, id)
    @save(_.without(items, oldItem))


MY_SECRET_KEY = "mySecret"
class SettingsDAO
  constructor: () ->
    @settings = null
    @key = 'settings'

  readSettings: (callback) ->
    self = this
    if self.settings
      defer ->
        callback(self.settings)
    else
      rs.getItem(RS_CATEGORY, self.key, (error, data)->
          settings = JSON.parse(data || '{}')
          self.settings = settings
          if (!settings.secret)
            settings.secret = randomString(20)
            rs.setItem(RS_CATEGORY, self.key, JSON.stringify(settings), ()->
                callback(settings)
            )
          else
            callback(settings)
      )

  getSecret: (callback) ->
    self = this
    @readSettings (settings)->
      callback(settings.secret)


class FriendsStuffDAO
  constructor: (@friendDAO) ->
    @friendsStuffList = []

  listStuffByFriend: (friend, callback) ->
    if friend.userAddress
      remoteStorage.getStorageInfo(friend.userAddress, (error, storageInfo) ->
          client = remoteStorage.createClient(storageInfo, 'public')
          if storageInfo
            client.get(getFriendStuffKey(friend), (err, data) ->
                if data
                  callback(JSON.parse(data || '[]'))
                else
                #log(err)
                  callback([])
            )
          else
            log(error)
      )

  # returns a list of invalid attributes
  validateFriend: (friend, callback) ->
    if !utils.isBlank(friend.userAddress)
      remoteStorage.getStorageInfo(friend.userAddress, (error, storageInfo) ->
          if storageInfo
            client = remoteStorage.createClient(storageInfo, 'public')
            client.get(getFriendStuffKey(friend), (err, data) ->
                if data
                  callback([])
                else
                  log(err)
                  callback(['secret'])
            )
          else
            log(error)
            callback(['userAddress'])
      )
    else
      callback(['userAddress'])

  list: (callback) ->
    self = @
    @friendDAO.list (friends)->
      for friend in friends
        bindUpdateToFriend = (friend)->
          return (friendStuff) ->
            self._updateWithLoadedItems(friend, friendStuff)
            callback(self.friendsStuffList)
        self.listStuffByFriend(friend, bindUpdateToFriend(friend))

  _updateWithLoadedItems: (friend, friendStuff)->
    for stuff in friendStuff
      stuff.owner = friend
      existingItem = _.find(@friendsStuffList, (it) -> it.id == stuff.id)
      if existingItem
        @friendsStuffList[_.indexOf(@friendsStuffList, existingItem)] = stuff
      else
        @friendsStuffList.push(stuff)

getFriendStuffKey = (friend) -> PUBLIC_PREFIX + (if !isBlank(friend.secret) then friend.secret else "public")



friendDAO = new RemoteStorageDAO(RS_CATEGORY, 'myFriendsList')
settingsDAO = new SettingsDAO()

angular.module('myApp.services', []).
value('version', '0.1').
value('settingsDAO', settingsDAO).
value('stuffDAO', new MyStuffDAO(RS_CATEGORY, MY_STUFF_KEY, settingsDAO)).
value('friendDAO', friendDAO).
value('friendsStuffDAO', new FriendsStuffDAO(friendDAO))
