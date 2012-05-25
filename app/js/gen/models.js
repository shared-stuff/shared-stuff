(function() {
  var Friend, Profile, Stuff, isBlank;

  isBlank = utils.isBlank;

  Stuff = (function() {

    function Stuff(props) {
      var time;
      this.title = (props != null ? props.title : void 0) || '';
      this.description = (props != null ? props.description : void 0) || '';
      this.visibility = (props != null ? props.visibility : void 0) || "friends";
      this.link = (props != null ? props.link : void 0) || '';
      this.image = (props != null ? props.image : void 0) || '';
      time = new Date().getTime();
      this.id = (props != null ? props.id : void 0) || '' + time;
      this.created = (props != null ? props.created : void 0) || time;
      this.modified = (props != null ? props.modified : void 0) || this.created;
    }

    Stuff.prototype.modify = function() {
      return this.modified = new Date().getTime();
    };

    return Stuff;

  })();

  Friend = (function() {

    function Friend(props) {
      props = props || {};
      this.id = props.id || '' + new Date().getTime();
      this.name = props.name || props.userAddress || '';
      this.userAddress = props.userAddress || '';
      this.secret = props.secret || '';
    }

    Friend.prototype.sanitize = function() {
      if (utils.isBlank(this.name)) return this.name = this.userAddress;
    };

    return Friend;

  })();

  Profile = (function() {

    function Profile(props) {
      props = props || {};
      this.name = props.name || '';
      this.email = props.email || '';
      this.image = props.image || '';
    }

    Profile.isEmpty = function() {
      return isBlank(this.name) && isBlank(this.email) && isBlank(this.image);
    };

    return Profile;

  })();

  this.Stuff = Stuff;

  this.Friend = Friend;

  this.Profile = Profile;

}).call(this);
