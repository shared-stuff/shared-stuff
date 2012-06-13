(function() {

  describe('Stuff', function() {
    beforeEach(function() {});
    it('should use constructor props', function() {
      var stuff;
      stuff = new Stuff({
        title: 'Title String',
        description: 'Description String'
      });
      expect(stuff.title).toEqual('Title String');
      return expect(stuff.description).toEqual('Description String');
    });
    it('should set some defaults', function() {
      var stuff, time;
      stuff = new Stuff({});
      expect(stuff.title).toEqual('');
      expect(stuff.description).toEqual('');
      expect(stuff.visibility).toEqual('friends');
      expect(stuff.sharingTypes).toEqual(['rent']);
      expect(stuff.categories).toEqual('');
      expect(stuff.link).toEqual('');
      expect(stuff.image).toEqual('');
      expect(stuff.image).toEqual('');
      expect(stuff.id.length).toBeGreaterThan(5);
      time = new Date().getTime();
      expect(stuff.created - time).toBeLessThan(1000);
      return expect(stuff.modified).toEqual(stuff.created);
    });
    it('should set modified to created as default', function() {
      var stuff;
      stuff = new Stuff({
        created: 123
      });
      return expect(stuff.modified).toEqual(stuff.created);
    });
    it('should use preserve unknown constructor props', function() {
      var stuff;
      stuff = new Stuff({
        unknownProperty: 'value X'
      });
      return expect(stuff.unknownProperty).toEqual('value X');
    });
    return it('id is a string', function() {
      var stuff;
      stuff = new Stuff();
      return expect(typeof stuff.id).toEqual('string');
    });
  });

  describe('Friend', function() {
    beforeEach(function() {});
    return it('should work with unknown constructor props', function() {
      var friend;
      friend = new Friend({
        unknownProperty: 'value X'
      });
      return expect(friend.unknownProperty).toEqual('value X');
    });
  });

  describe('Profile', function() {
    beforeEach(function() {});
    return it('should work with unknown constructor props', function() {
      var profile;
      profile = new Profile({
        unknownProperty: 'value X'
      });
      return expect(profile.unknownProperty).toEqual('value X');
    });
  });

}).call(this);
