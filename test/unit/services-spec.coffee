class RemoteStorageMock
    constructor: ( @items = {}) ->

    #for setup in  tests
    setPublicItem: (userAddress,key,value) ->
      if not @items[userAddress]
        @items[userAddress] = {}
      @items[userAddress][key] = JSON.stringify(value)

    getStorageInfo: (userAddress,callback) ->
      callback(undefined,userAddress)

    createClient: (storageInfo,category) ->
      items = @items
      return {
        get: (key,callback) ->
          callback(undefined,items[storageInfo]?[key])
      }

class LocalStorageMock
  constructor: (@items = {}) ->

  setItem: (key,value) ->
    @items[key] = value
  getItem: (key) -> @items[key]


describe('PublicRemoteStorageService', ->
  remoteStorageMock = undefined
  localStorageMock = undefined

  beforeEach ->
    remoteStorageMock = new RemoteStorageMock()
    localStorageMock = new LocalStorageMock()


  it('should return results from remoteStorage and store them in localStorage', ->
    remoteStorageMock.setPublicItem('user@host.com','key','value')
    service = new PublicRemoteStorageService(remoteStorageMock,localStorageMock)

    result = undefined
    service.get('user@host.com','key','defaultValue', (resultArg)->
      result = resultArg
    )

    waitsFor(( -> result ),"Retrived Result", 1000)

    runs ->
      expect(result).toEqual('value')
      expect(localStorageMock.getItem('remoteStorageCache:user@host.com:public:key')).toEqual('"value"')
  )

  it('should return cached values from localStorage', ->
    localStorageMock.setItem('remoteStorageCache:user@host.com:public:key','"value"')
    service = new PublicRemoteStorageService(remoteStorageMock,localStorageMock)

    result = undefined
    service.get('user@host.com','key','defaultValue', (resultArg)->
      result = resultArg
    )

    waitsFor(( -> result ),"Retrived Result", 1000)

    runs ->
      expect(result).toEqual('value')
  )

  it('should refresh cached values on request', ->
    localStorageMock.setItem('remoteStorageCache:user@host.com:public:key','"value"')
    remoteStorageMock.setPublicItem('user@host.com','key','newValue')
    service = new PublicRemoteStorageService(remoteStorageMock,localStorageMock)

    result = undefined
    service.refresh('user@host.com','key','defaultValue', (resultArg)->
      result = resultArg
    )

    waitsFor(( -> result ),"Retrived Result", 1000)

    runs ->
      expect(result).toEqual('newValue')
  )

)













describe('service', ->
  beforeEach(module('myApp.services'))

  describe('version', ->
    it('should return current version', inject( (version)->
        expect(version).toEqual('0.1')
    ))
  )
)


