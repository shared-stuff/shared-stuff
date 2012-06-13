(function() {
  var Friend, Profile, Stuff, copyUnknownProps, isBlank;

  isBlank = utils.isBlank;

  copyUnknownProps = function(source, target) {
    var k, v, _results;
    _results = [];
    for (k in source) {
      v = source[k];
      utils.log(k);
      if (!(k in target)) {
        _results.push(target[k] = v);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Stuff = (function() {

    function Stuff(props) {
      var time;
      if (props == null) props = {};
      this.title = props.title || '';
      this.description = props.description || '';
      this.visibility = props.visibility || 'friends';
      this.sharingTypes = props.sharingTypes || ['rent'];
      this.categories = props.categories || '';
      this.link = props.link || '';
      this.image = props.image || '';
      time = new Date().getTime();
      this.id = props.id || '' + time;
      this.created = props.created || time;
      this.modified = props.modified || this.created;
      copyUnknownProps(props, this);
    }

    Stuff.prototype.modify = function() {
      return this.modified = new Date().getTime();
    };

    Stuff.sharingTypeValues = ['rent', 'gift', 'use-together'];

    return Stuff;

  })();

  Friend = (function() {

    function Friend(props) {
      if (props == null) props = {};
      this.id = props.id || '' + new Date().getTime();
      this.name = props.name || props.userAddress || '';
      this.userAddress = props.userAddress || '';
      this.secret = props.secret || '';
      copyUnknownProps(props, this);
    }

    Friend.prototype.sanitize = function() {
      if (utils.isBlank(this.name)) return this.name = this.userAddress;
    };

    return Friend;

  })();

  Profile = (function() {

    function Profile(props) {
      if (props == null) props = {};
      this.name = props.name || '';
      this.email = props.email || '';
      this.image = props.image || '';
      copyUnknownProps(props, this);
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
