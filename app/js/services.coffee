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
PROFILE_KEY = PUBLIC_PREFIX+"profile"

rs = remoteStorageUtils

wrapIdentity = (item) -> item

class RemoteStorageDAO
  constructor: (@remoteStorageUtils,@category, @key,@wrapItem = wrapIdentity) ->

  readAllItems: (callback) ->
    self = this
    if self.dataCache
      defer ->
        callback(self.dataCache.items)
    else
      self.remoteStorageUtils.getItem(@category, @key, (error, data)->
          self.dataCache = JSON.parse(data || '{}')
          self.dataCache.items = getItemsFromContainer(self.dataCache,self.wrapItem)
          callback(self.dataCache.items)
      )

  findItemByID: (items, id) -> _.find(items, (it) -> it.id == id)

  list: (callback) ->
    @readAllItems(callback)

  getItem: (id, callback) ->
    @getItemBy('id',id,callback)

  getItemBy: (attribute,value, callback) ->
    @readAllItems (items) ->
      callback(_.find(items, (it) -> it[attribute] == value))

  save: (allItems, callback) ->
    utils.cleanObjectFromAngular(allItems)
    if !@dataCache
      @dataCache = {}
    @dataCache.items = allItems
    @remoteStorageUtils.setItem(@category, @key, JSON.stringify(@dataCache), callback)

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
  constructor: (@remoteStorageUtils,@category, @key, @settingsDAO) ->
    super(@remoteStorageUtils,@category,@key, (stuffData) -> new Stuff(stuffData))

  save: (allItems, callback) ->
    self = this
    super(allItems, callback)
    @settingsDAO.getSecret (secret)->
      self.remoteStorageUtils.setItem('public', PUBLIC_PREFIX+secret, JSON.stringify({items:allItems}), doNothing)
    publicStuff = _.filter(allItems, (item)-> item.visibility=='public')
    self.remoteStorageUtils.setItem('public', PUBLIC_PREFIX+PUBLIC_KEY, JSON.stringify({items:publicStuff}), doNothing)


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
          if error=='timeout'
            # TODO: bad luck
          else
            settings = JSON.parse(data || '{}')
            self.settings = settings
            if (!settings.secret)
              settings.secret = randomString(20)
              self.saveSettings(callback)
            else
              callback(settings)
      )

  getSecret: (callback) ->
    self = this
    @readSettings (settings)->
      callback(settings.secret)

  saveSettings: (callback) ->
    self = this
    rs.setItem(RS_CATEGORY, self.key, JSON.stringify(self.settings), ()->
      callback(self.settings)
    )

class ProfileDAO
  constructor: (@publicRemoteStorageService) ->
    @profile = null
    @key = PROFILE_KEY

  load: (callback) ->
    self = this
    if self.profile
      defer ->
        callback(self.profile)
    else
      rs.getItem('public', self.key, (error, data)->
        self.profile = JSON.parse(data || '{}')
        callback(new Profile(self.profile))
      )

  save: (profile,callback) ->
    self = this
    self.profile = profile
    rs.setItem('public', self.key, JSON.stringify(self.profile), ()->
      callback(self.profile)
    )

  getByFriend: (friend,callback) ->
    @publicRemoteStorageService.get(friend.userAddress,@key,{}, (result)->
      callback(new Profile(result))
    )


class PublicRemoteStorageService
  constructor: ->
    @clientByUserAddress = {}

  get: (userAddress,key,defaultValue,callback) ->
    self = this
    if !userAddress
      log("Missing UserAdress!")
      callback(defaultValue)
    else if @clientByUserAddress[userAddress]
      @getByClient(@clientByUserAddress[userAddress],key,defaultValue,callback)
    else
      remoteStorage.getStorageInfo(userAddress, (error, storageInfo) ->
        if storageInfo
          client = remoteStorage.createClient(storageInfo, 'public')
          self.clientByUserAddress[userAddress] = client
          self.getByClient(client,key,defaultValue,callback)
        else
          log(error)
          callback(defaultValue,error)
      )

  #private
  getByClient: (client,key,defaultValue,callback) ->
    client.get(key, (err, data) ->
      if data
        callback(JSON.parse(data))
      else
        callback(defaultValue)
    )

getItemsFromContainer = (itemContainer,wrapItem) -> _.map(itemContainer?.items || [],wrapItem)

class FriendsStuffDAO
  constructor: (@friendDAO,@publicRemoteStorageDAO,@profileDAO) ->
    @friendsStuffList = []

  listStuffByFriend: (friend, callback) ->
    self = this
    @profileDAO.getByFriend(friend, (profile) ->
      friend.location = profile.location
      self.publicRemoteStorageDAO.get(friend.userAddress,getFriendStuffKey(friend),[], (itemContainer)->
        callback(getItemsFromContainer(itemContainer, (item)->
          item = new Stuff(item)
          item.owner = friend
          return item
        ))
      )
    )

  # returns a list of invalid attributes
  validateFriend: (friend, callback) ->
    if !utils.isBlank(friend.userAddress)
      remoteStorage.getStorageInfo(friend.userAddress, (error, storageInfo) ->
          if storageInfo
            client = remoteStorage.createClient(storageInfo, 'public')
            if isBlank(friend.secret)
              callback([])
            else
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

  clearCache: ->
    @friendsStuffList = []

  list: (callback) ->
    self = @
    @friendDAO.list (friends)->
      loadedCounter = 0
      if friends.length==0
        callback(self.friendsStuffList,'NO_FRIENDS')
      for friend in friends
        self.listStuffByFriend(friend, (friendStuff) ->
            self._updateWithLoadedItems(friendStuff)
            loadedCounter++
            callback(self.friendsStuffList,if loadedCounter==friends.length then 'LOADED' else 'LOADING')
        )

  _updateWithLoadedItems: (friendStuff)->
    for stuff in friendStuff
      existingItem = _.find(@friendsStuffList, (it) -> it.id == stuff.id)
      if existingItem
        @friendsStuffList[_.indexOf(@friendsStuffList, existingItem)] = stuff
      else
        @friendsStuffList.push(stuff)

getFriendStuffKey = (friend) -> PUBLIC_PREFIX + (if !isBlank(friend.secret) then friend.secret else "public")




initServices = ->
  friendDAO = new RemoteStorageDAO(remoteStorageUtils,RS_CATEGORY, 'myFriendsList', (data) -> new Friend(data))
  settingsDAO = new SettingsDAO()
  publicRemoteStorageService = new PublicRemoteStorageService()
  profileDAO = new ProfileDAO(publicRemoteStorageService)

  angular.module('myApp.services', []).
  value('version', '0.1').
  value('settingsDAO', settingsDAO).
  value('stuffDAO', new MyStuffDAO(remoteStorageUtils,RS_CATEGORY, MY_STUFF_KEY, settingsDAO)).
  value('friendDAO', friendDAO).
  value('friendsStuffDAO', new FriendsStuffDAO(friendDAO,publicRemoteStorageService,profileDAO)).
  value('profileDAO',profileDAO).
  value('localizer',new Localizer())

initServices()


#export
this.RemoteStorageDAO = RemoteStorageDAO
this.MyStuffDAO = MyStuffDAO
