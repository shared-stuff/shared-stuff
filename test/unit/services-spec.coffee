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
  service = undefined
  getTime = -> 123

  beforeEach ->
    remoteStorageMock = new RemoteStorageMock()
    localStorageMock = new LocalStorageMock()
    service = new PublicRemoteStorageService(remoteStorageMock,localStorageMock,getTime)
    spyOn(remoteStorageMock,'getStorageInfo').andCallThrough()


  it('should return results from remoteStorage and store them in localStorage', ->
    remoteStorageMock.setPublicItem('user@host.com','key','value')

    result = undefined
    cacheTime = undefined
    service.get('user@host.com','key','defaultValue', (resultArg,status)->
      result = resultArg
      cacheTime = status.cacheTime
    )

    waitsFor(( -> result ),"Retrieved Result", 1000)

    runs ->
      expect(result).toEqual('value')
      expect(cacheTime).toEqual(getTime())
      expect(localStorageMock.getItem('remoteStorageCache:user@host.com:public:key')).toEqual('{"time":123,"data":"value"}')
  )

  it('should return cached values from localStorage', ->
    localStorageMock.setItem('remoteStorageCache:user@host.com:public:key','{"time":111,"data":"value"}')

    result = undefined
    cacheTime = undefined
    service.get('user@host.com','key','defaultValue', (resultArg,status)->
      result = resultArg
      cacheTime = status.cacheTime
    )

    waitsFor(( -> result ),"Retrieved Result", 100)

    runs ->
      expect(result).toEqual('value')
      expect(cacheTime).toEqual(111)
  )

  it('should refresh cached values on request', ->
    localStorageMock.setItem('remoteStorageCache:user@host.com:public:key','{"time":111,"data":"value"}')
    remoteStorageMock.setPublicItem('user@host.com','key','newValue')

    result = undefined
    service.refresh('user@host.com','key','defaultValue', (resultArg)->
      result = resultArg
    )

    waitsFor(( -> result ),"Retrieved Result", 100)

    runs ->
      expect(result).toEqual('newValue')
      expect(localStorageMock.getItem('remoteStorageCache:user@host.com:public:key')).toEqual('{"time":123,"data":"newValue"}')
  )

  it('should cache remoteStorage clients in memory', ->
    remoteStorageMock.setPublicItem('user@host.com','key','newValue')

    secondResult = undefined
    service.refresh('user@host.com','key','defaultValue', (result1)->
      service.refresh('user@host.com','key','defaultValue', (result2)->
        secondResult = result2
      )
    )

    waitsFor(( -> secondResult ),"Retrieved Result", 100)

    runs ->
      expect(remoteStorageMock.getStorageInfo.calls.length).toEqual(1);
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


