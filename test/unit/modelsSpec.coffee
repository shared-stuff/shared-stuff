describe('Stuff',->
  beforeEach ->
    # nada

  it('should use constructor props', ->
    stuff = new Stuff({title:'Title String',description:'Description String'})
    expect(stuff.title).toEqual('Title String')
    expect(stuff.description).toEqual('Description String')
  )

  it('should set some defaults', ->
    stuff = new Stuff({})
    expect(stuff.title).toEqual('')
    expect(stuff.description).toEqual('')
    expect(stuff.visibility).toEqual('friends')
    expect(stuff.sharingTypes).toEqual(['rent'])
    expect(stuff.categories).toEqual('')
    expect(stuff.link).toEqual('')
    expect(stuff.image).toEqual('')
    expect(stuff.image).toEqual('')
    expect(stuff.id.length).toBeGreaterThan(5);
    time = new Date().getTime()
    expect(stuff.created-time).toBeLessThan(1000);
    expect(stuff.modified).toEqual(stuff.created);
  )

  it('should set modified to created as default', ->
    stuff = new Stuff({created:123})
    expect(stuff.modified).toEqual(stuff.created);
  )

  it('should use preserve unknown constructor props', ->
    stuff = new Stuff({unknownProperty:'value X'})
    expect(stuff.unknownProperty).toEqual('value X')
  )

  it('id is a string', ->
    stuff = new Stuff();
    expect(typeof stuff.id).toEqual('string');
  );

)

describe('Friend',->
  beforeEach ->
    # nada

  it('should work with unknown constructor props', ->
    friend = new Friend({unknownProperty:'value X'})
    expect(friend.unknownProperty).toEqual('value X')
  )

)

describe('Profile',->
  beforeEach ->
    # nada

  it('should work with unknown constructor props', ->
    profile = new Profile({unknownProperty:'value X'})
    expect(profile.unknownProperty).toEqual('value X')
  )

)