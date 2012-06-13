defer = utils.defer
log = utils.log

createRemoteStorageUtilsMock = () ->
  mockedValues = {}
  return {
    getItemObjectSync: (category,key) ->
      log(mockedValues)
      json = mockedValues[category]?[key]
      if json
        return JSON.parse(json)
      else
        return undefined

    setItemObjectSync: (category,key,value) ->
      if !(category of mockedValues)
        mockedValues[category] = {}
      mockedValues[category][key] = JSON.stringify(value)

    getItem: (category,key,callback) ->
      defer ->
        callback(null,mockedValues[category]?[key]);

    setItem: (category,key,value,callback) ->
      log('Set Item'+category+key+value)
      if !(category of mockedValues)
        mockedValues[category] = {}
      mockedValues[category][key] = value
      defer ->
        callback()
  }



describe('RemoteStorageDAO',->

  # mock remoteStorage
  rsCategory = "rsCategory"
  rsKey = "rsKey"
  remoteStorageUtilsMock = undefined


  beforeEach ->
    remoteStorageUtilsMock = createRemoteStorageUtilsMock()
    remoteStorageUtilsMock.setItemObjectSync(rsCategory,rsKey,{items:[{userAddress:'username@host.org'}]})

  it('should load data with remoteStorageUtils', ->
    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey)

    items = undefined
    rsDAO.list (itemsResultArg) ->
          items = itemsResultArg

    waitsFor( ->
        items
      ,"Retrived Items", 1000
    )

    runs ->
      expect(items.length).toEqual(1)
      expect(items[0].userAddress).toEqual('username@host.org')

  )

  # this is useful to wrap the rawdata into a proper class
  it('should wrap items', ->
    wrapItem = (itemData) -> {name: itemData.userAddress}

    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey, wrapItem)

    items = undefined
    rsDAO.list (itemsResultArg) ->
      items = itemsResultArg

    waitsFor( ->
        items
      ,"Retrived Items", 1000
    )

    runs ->
      expect(items.length).toEqual(1)
      expect(items[0].name).toEqual('username@host.org')

  )

  it('should save data with remoteStorageUtils', ->
    rsDAO = new RemoteStorageDAO(remoteStorageUtilsMock,rsCategory, rsKey)

    saved = false
    rsDAO.saveItem({id:'id2',userAddress:'username2@host.org'},(itemsResultArg) ->
      saved = true
    )

    waitsFor( ->
        saved
      ,"Saving", 1000
    )

    runs ->
      items = remoteStorageUtilsMock.getItemObjectSync(rsCategory,rsKey).items
      expect(items.length).toEqual(2)
      expect(items[0].userAddress).toEqual('username@host.org')
      expect(items[1].userAddress).toEqual('username2@host.org')
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

    waitsFor( ->
        items
      ,"Retrived Items", 1000
    )

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
      ,"Saving", 1000
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