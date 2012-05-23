class Stuff
  constructor: (props)->
    @title = props?.title || ''
    @description = props?.description || ''
    @visibility = props?.visibility || "friends"
    @link = props?.link || ''
    time = new Date().getTime()
    @id = props?.id || ''+time
    @created = props?.created || time
    @modified = props?.modified || @created

  modify: ()->
    @modified = new Date().getTime()


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




# export
this.Stuff = Stuff
this.Friend = Friend