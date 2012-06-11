isBlank = utils.isBlank

class Stuff
  constructor: (props)->
    @title = props?.title || ''
    @description = props?.description || ''
    # 'friends','public'
    @visibility = props?.visibility || 'friends'
    # Stuff.sharingTypeValues
    @sharingTypes = props?.sharingTypes || ['rent']
    @categories = props?.categories || ''
    @link = props?.link || ''
    @image = props?.image || ''
    time = new Date().getTime()
    @id = props?.id || ''+time
    @created = props?.created || time
    @modified = props?.modified || @created

  modify: ()->
    @modified = new Date().getTime()

  Stuff.sharingTypeValues = ['rent','gift','use-together']


class Friend
  constructor: (props)->
    props = props || {}
    @id = props.id || ''+new Date().getTime()
    @name = props.name || props.userAddress || ''
    @userAddress = props.userAddress || ''
    @secret = props.secret || ''

  sanitize: ->
    if utils.isBlank(@name)
      @name = @userAddress


class Profile
  constructor: (props)->
    props = props || {}
    @name = props.name || ''
    @email = props.email || ''
    @image = props.image || ''

  @isEmpty: -> isBlank(@name) && isBlank(@email) && isBlank(@image)


# export
this.Stuff = Stuff
this.Friend = Friend
this.Profile = Profile