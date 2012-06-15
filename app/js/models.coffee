isBlank = utils.isBlank

copyUnknownProps = (source,target) ->
  for k,v of source
    if !(k of target)
      target[k]=v

class Stuff
  constructor: (props = {})->
    @title = props.title || ''
    @description = props.description || ''
    # 'friends','public'
    @visibility = props.visibility || 'friends'
    # Stuff.sharingTypeValues
    @sharingTypes = props.sharingTypes || ['rent']
    @sharingDirection = props.sharingDirection || 'give'
    @categories = props.categories || ''
    @link = props.link || ''
    @image = props.image || ''
    time = new Date().getTime()
    @id = props.id || ''+time
    @created = props.created || time
    @modified = props.modified || @created
    copyUnknownProps(props,this)


  modify: ()->
    @modified = new Date().getTime()

  getLocation: -> @location || @owner?.location || ''

  Stuff.sharingTypeValues = ['rent','gift','use-together']
  Stuff.sharingDirectionValues = ['give','wish']


class Friend
  constructor: (props = {})->
    @id = props.id || ''+new Date().getTime()
    @name = props.name || props.userAddress || ''
    @userAddress = props.userAddress || ''
    @secret = props.secret || ''
    copyUnknownProps(props,this)

  sanitize: ->
    if utils.isBlank(@name)
      @name = @userAddress


class Profile
  constructor: (props = {})->
    @name = props.name || ''
    @email = props.email || ''
    @image = props.image || ''
    @location = props.location || ''
    copyUnknownProps(props,this)

  @isEmpty: -> isBlank(@name) && isBlank(@email) && isBlank(@image)


# export
this.Stuff = Stuff
this.Friend = Friend
this.Profile = Profile