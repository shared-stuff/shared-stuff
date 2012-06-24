defer = utils.defer
log = utils.log

class RemoteStorageMock
  constructor: (@items = {}) ->

    #for setup in  tests
  setPublicItem: (userAddress, key, value) ->
    if not @items[userAddress]
      @items[userAddress] = {}
    @items[userAddress][key] = JSON.stringify(value)

  getStorageInfo: (userAddress, callback) ->
    callback(undefined, userAddress)

  createClient: (storageInfo, category) ->
    items = @items
    return {
    get: (key, callback) ->
      callback(undefined, items[storageInfo]?[key])
    }

class LocalStorageMock
  constructor: (@items = {}) ->

  setItem: (key, value) ->
    @items[key] = value
  getItem: (key) -> @items[key]


createRemoteStorageUtilsMock = () ->
  mockedValues = {}
  return {
  getItemObjectSync: (category, key) ->
    log(mockedValues)
    json = mockedValues[category]?[key]
    if json
      return JSON.parse(json)
    else
      return undefined

  setItemObjectSync: (category, key, value) ->
    if !(category of mockedValues)
      mockedValues[category] = {}
    mockedValues[category][key] = JSON.stringify(value)

  getItem: (category, key, callback) ->
    defer ->
      callback(null, mockedValues[category]?[key])

  setItem: (category, key, value, callback) ->
    log('Set Item' + category + key + value)
    if !(category of mockedValues)
      mockedValues[category] = {}
    mockedValues[category][key] = value
    defer ->
      callback()
  }

class PublicRemoteStorageServiceMock
  constructor: (@dummyValueCache, @dummyValueFresh, @dummyCacheTime, @currentTime) ->
  get: (userAddress, key, defaultValue, callback) -> callback(@dummyValueCache, {cacheTime: @dummyCacheTime})
  getRefreshed: (userAddress, key, defaultValue, callback) -> callback(@dummyValueFresh, {cacheTime: @currentTime})

this.testUtils =
  RemoteStorageMock: RemoteStorageMock,
  LocalStorageMock: LocalStorageMock,
  createRemoteStorageUtilsMock: createRemoteStorageUtilsMock
  PublicRemoteStorageServiceMock: PublicRemoteStorageServiceMock
