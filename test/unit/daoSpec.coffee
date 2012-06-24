defer = utils.defer
log = utils.log
createRemoteStorageUtilsMock = testUtils.createRemoteStorageUtilsMock
PublicRemoteStorageServiceMock = testUtils.PublicRemoteStorageServiceMock

describe('RemoteStorageDAO',->

  # mock remoteStorage
  rsCategory = "rsCategory"
  rsKey = "rsKey"
  remoteStorageUtilsMock = undefined


  beforeEach ->
    remoteStorageUtilsMock = createRemoteStorageUtilsMock()


  it('should load data with remoteStorageUtils', ->
    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey)
    remoteStorageUtilsMock.setItemObjectSync(rsCategory,rsKey,{items:[{userAddress:'username@host.org'}]})

    items = undefined
    rsDAO.list (itemsResultArg) ->
          items = itemsResultArg

    waitsFor((-> items),"Retrieved Items", 100)

    runs ->
      expect(items.length).toEqual(1)
      expect(items[0].userAddress).toEqual('username@host.org')

  )


  # this is useful to wrap the rawdata into a proper class
  it('should wrap items', ->
    remoteStorageUtilsMock.setItemObjectSync(rsCategory,rsKey,{items:[{userAddress:'username@host.org'}]})

    wrapItem = (itemData) -> {name: itemData.userAddress}

    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey, wrapItem)

    items = undefined
    rsDAO.list (itemsResultArg) ->
      items = itemsResultArg

    waitsFor((->items),"Retrieved Items", 100)

    runs ->
      expect(items.length).toEqual(1)
      expect(items[0].name).toEqual('username@host.org')

  )


  it('should save data with remoteStorageUtils', ->
    remoteStorageUtilsMock.setItemObjectSync(rsCategory,rsKey,{items:[{userAddress:'username@host.org'}]})

    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey)

    saved = false
    rsDAO.saveItem({id:'id2',userAddress:'username2@host.org'},(itemsResultArg) ->
      saved = true
    )

    waitsFor((->saved),"Saving", 100)

    runs ->
      items = remoteStorageUtilsMock.getItemObjectSync(rsCategory,rsKey).items
      expect(items.length).toEqual(2)
      expect(items[0].userAddress).toEqual('username@host.org')
      expect(items[1].userAddress).toEqual('username2@host.org')
  )


  it('should find items by any attribute', ->
    remoteStorageUtilsMock.setItemObjectSync(rsCategory,rsKey,{
      items:[
        {userAddress:'username1@host.org',name:'username 1'},
        {userAddress:'username2@host.org',name:'username 2'}
      ]
    })

    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey)

    foundItem = undefined
    rsDAO.getItemBy('userAddress','username2@host.org',(itemResultArg) -> foundItem = itemResultArg)

    waitsFor( (-> foundItem) ,"Saving", 100)

    runs ->
      items = remoteStorageUtilsMock.getItemObjectSync(rsCategory,rsKey).items
      expect(foundItem.name).toEqual('username 2')
  )

)







describe('MyStuffDAO',->
  rsCategory = "rsCategory"
  rsKey = "rsKey"
  remoteStorageUtilsMock = undefined
  myStuffDAO = undefined

  settingsDAO = {
    getSecret: (callback) -> callback('secret')
  }


  beforeEach ->
    remoteStorageUtilsMock = createRemoteStorageUtilsMock()
    remoteStorageUtilsMock.setItemObjectSync(rsCategory,rsKey,
      {items:[
        {id:'1',title:"Stuff Title 1",created:1,visibility:'friends'}
        {id:'2',title:"Stuff Title 2",created:2,visibility:'friends'}
      ]}
    )
    myStuffDAO = new MyStuffDAO(remoteStorageUtilsMock,rsCategory, rsKey,settingsDAO)

  it('should wrap loaded data with class Stuff', ->
    items = undefined
    myStuffDAO.list (itemsResultArg) ->
      items = itemsResultArg

    waitsFor(( -> items),"Retrieved Items", 100)

    runs ->
      expect(items.length).toEqual(2)
      expect(items[0].title).toEqual('Stuff Title 1')
      expect(typeof items[0].modify).toEqual('function') #modify is a method of Stuff
  )

  it('should save data with filtered copies in public category', ->
    saved = false
    myStuffDAO.saveItem(new Stuff({id:'2',title:'Stuff Title 2.1',visibility:'public'}),(itemsResultArg) ->
      saved = true
    )

    waitsFor( ->
        saved && remoteStorageUtilsMock.getItemObjectSync('public','sharedstuff-secret') &&
          remoteStorageUtilsMock.getItemObjectSync('public','sharedstuff-public')
      ,"Saving", 100
    )

    runs ->
      items = remoteStorageUtilsMock.getItemObjectSync(rsCategory,rsKey).items
      expect(items.length).toEqual(2)
      expect(items[0].title).toEqual('Stuff Title 1')
      expect(items[1].title).toEqual('Stuff Title 2.1')

      itemsForFriends = remoteStorageUtilsMock.getItemObjectSync('public','sharedstuff-secret').items
      expect(itemsForFriends.length).toEqual(2)
      expect(itemsForFriends[0].title).toEqual('Stuff Title 1')
      expect(itemsForFriends[1].title).toEqual('Stuff Title 2.1')

      itemsForFriends = remoteStorageUtilsMock.getItemObjectSync('public','sharedstuff-public').items
      expect(itemsForFriends.length).toEqual(1)
      expect(itemsForFriends[0].title).toEqual('Stuff Title 2.1')

  )
)


describe('ProfileDAO', ->
  publicRemoteStorageService = undefined
  profileDAO = undefined
  friend = new Friend({userAddress: 'user@host.org'})
  dummyCacheTime = 123
  currentTime = 200
  getMockedTime = -> currentTime

  beforeEach ->
    publicRemoteStorageService = new PublicRemoteStorageServiceMock({name:'cachedName'},{name: 'freshName'},dummyCacheTime,currentTime)
    profileDAO = new ProfileDAO(publicRemoteStorageService,getMockedTime)
    spyOn(publicRemoteStorageService, 'get').andCallThrough();
    spyOn(publicRemoteStorageService, 'getRefreshed').andCallThrough();

  it('should normally return a cached profile', ->
    profile = undefined
    cacheTime = undefined
    profileDAO.getByFriend(friend, (profileResult,status)->
      profile = profileResult
      cacheTime = status.cacheTime
    )

    waitsFor( (-> profile), "Load Profile", 100 )

    runs ->
      expect(profile.name).toEqual('cachedName')
      expect(cacheTime).toEqual(dummyCacheTime)
      expect(publicRemoteStorageService.get).toHaveBeenCalledWith(friend.userAddress, profileDAO.key,{},jasmine.any(Function));
  )

  it('should return a refreshed profile on request', ->
    profile = undefined
    cacheTime = undefined
    profileDAO.getByFriendRefreshed(friend, (profileResult,status)->
      profile = profileResult
      cacheTime = status.cacheTime
    )

    waitsFor( (-> profile), "Load Fresh Profile", 100 )

    runs ->
      expect(profile.name).toEqual('freshName')
      expect(cacheTime).toEqual(currentTime)
      expect(publicRemoteStorageService.getRefreshed).toHaveBeenCalledWith(friend.userAddress, profileDAO.key,{},jasmine.any(Function));
  )

  describe('getByFriendWithDeferedRefresh', ->

    it('should not return a refreshed profile defered if the cached is younger then maxAge', ->
      profile = undefined
      cacheTime = undefined
      maxAge = 200
      profileDAO.getByFriendWithDeferedRefresh(friend,maxAge, (profileResult,status)->
        profile = profileResult
        cacheTime = status.cacheTime
      )

      waitsFor( (-> profile), "Load Fresh Profile", 100 )

      runs ->
        expect(profile.name).toEqual('cachedName')
        expect(cacheTime).toEqual(dummyCacheTime)
        expect(publicRemoteStorageService.get).toHaveBeenCalledWith(friend.userAddress, profileDAO.key,{},jasmine.any(Function));
        expect(publicRemoteStorageService.getRefreshed.calls.length).toEqual(0);
    )

    it('should return an additional refreshed profile defered if the cached profile is older then maxAge', ->
      profiles = []
      cacheTimes = []
      maxAge = 50
      profileDAO.getByFriendWithDeferedRefresh(friend,maxAge, (profileResult,status)->
        profiles.push(profileResult)
        cacheTimes.push(status.cacheTime)
      )

      waitsFor( (-> profiles.length==2), "Load Cached And Fresh Profile", 100 )

      runs ->
        expect(profiles.length).toEqual(2)
        expect(profiles[0].name).toEqual('cachedName')
        expect(profiles[1].name).toEqual('freshName')
        expect(cacheTimes).toEqual([dummyCacheTime,currentTime])
        expect(publicRemoteStorageService.get).toHaveBeenCalledWith(friend.userAddress, profileDAO.key,{},jasmine.any(Function));
        expect(publicRemoteStorageService.getRefreshed).toHaveBeenCalledWith(friend.userAddress, profileDAO.key,{},jasmine.any(Function));
    )

  )

)


describe('FriendsStuffDAO', ->
  fsDao = undefined
  remoteStorageUtilsMock = undefined


  beforeEach ->
    remoteStorageUtilsMock = createRemoteStorageUtilsMock()
    friendDAO = new RemoteStorageDAO(remoteStorageUtilsMock,RS_CATEGORY, 'myFriendsList', (data) -> new Friend(data))
    remoteStorageMock = new testUtils.RemoteStorageMock()
    localStorageMock = new testUtils.LocalStorageMock()
    publicRemoteStorageService = new PublicRemoteStorageService(remoteStorageMock,localStorageMock)
    profileDAO = new ProfileDAO(publicRemoteStorageService)
    fsDao = new FriendsStuffDAO(friendDAO,publicRemoteStorageService,profileDAO)

    # mock some test data
    remoteStorageUtilsMock.setItemObjectSync(RS_CATEGORY, 'myFriendsList',
      {items: [
        {id:1, name: 'marco', userAddress: 'marco@host.org'}
        {id:2, name: 'nora', userAddress: 'nora@host.org'}
      ]}
    )
    remoteStorageMock.setPublicItem('marco@host.org', 'sharedstuff-public',
      {items: [
        {id: 1,title: 'Marco Stuff 1'}
        {id: 2,title: 'Marco Stuff 2'}
      ]}
    )
    remoteStorageMock.setPublicItem('nora@host.org', 'sharedstuff-public',
      {items: [
        {id: 3,title: 'Newest Nora Stuff 1'}
      ]}
    )
    cachedNoraStuff = {items: [
      {id: 3,title: 'Cached Nora Stuff 1'}
    ]}
    localStorageMock.setItem('remoteStorageCache:nora@host.org:public:sharedstuff-public', JSON.stringify({time:123,data:cachedNoraStuff}))


  it("should return friend's stuff", ->
    friends = null
    stuffList = null
    status = null
    fsDao.list (friendsArg,stuffListArg,statusArg) ->
      friends = friendsArg
      stuffList = stuffListArg
      status = statusArg

    waitsFor( (-> status=='LOADED'), "Loaded Stuff", 100 )

    runs ->
      expect(friends.length).toEqual(2)
      expect(friends[0].name).toEqual('marco')
      expect(friends[1].name).toEqual('nora')

      expect(stuffList.length).toEqual(3)
      expect(stuffList[0].title).toEqual("Marco Stuff 1")
      expect(stuffList[1].title).toEqual("Marco Stuff 2")
      expect(stuffList[2].title).toEqual("Cached Nora Stuff 1")
  )

  it("should update friend's stuff on request", ->
    friends = null
    stuffList = null
    status = null
    updated = false
    fsDao.list (friendsArg,stuffListArg,statusArg) ->
      friends = friendsArg
      stuffList = stuffListArg
      status = statusArg
      if statusArg=='LOADED'
        fsDao.refreshMostOutdatedFriend(1000, ->
          updated = true
        )

    waitsFor( (-> updated), "Updated Cached Friend Stuff", 100 )

    runs ->
      expect(stuffList[2].title).toEqual("Newest Nora Stuff 1")
  )

)

