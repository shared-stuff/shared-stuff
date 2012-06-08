(function() {
  var Localizer, labelBySharingType;

  labelBySharingType = {
    'rent': "Rent",
    'gift': "Gift",
    'use-together': "Use Together"
  };

  Localizer = (function() {

    function Localizer() {}

    Localizer.prototype.sharingType = function(sharingType) {
      return labelBySharingType[sharingType] || sharingType;
    };

    return Localizer;

  })();

  this.Localizer = Localizer;

}).call(this);
