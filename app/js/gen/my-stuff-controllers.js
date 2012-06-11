(function() {
  var MyStuffController, MyStuffEditController, circles, focus, isValid, log;

  log = utils.log;

  focus = utils.focus;

  isValid = function(stuff) {
    return !utils.isBlank(stuff.title);
  };

  circles = {
    friends: 'Friends',
    'public': 'Public'
  };

  MyStuffController = function($scope, stuffDAO) {
    $scope.stuffList = [];
    $scope.isAddStuffFormHidden = true;
    $scope.circles = circles;
    $scope.sortAttribute = sessionStorage.getItem('my-stuff-sortAttribute') || '-modified';
    $scope.sortAttributeNames = {
      '-modified': 'Newest',
      'title': 'Title',
      'owner.name': 'Friend'
    };
    stuffDAO.list(function(restoredStuffList) {
      $scope.stuffList = restoredStuffList;
      $scope.isAddStuffFormHidden = $scope.stuffList.length > 0;
      $scope.status = "LOADED";
      return $scope.$digest();
    });
    $scope.showAddForm = function() {
      $scope.isAddStuffFormHidden = false;
      return focus('title');
    };
    $scope.closeForm = function() {
      return $scope.isAddStuffFormHidden = true;
    };
    $scope.sortBy = function(sortAttribute) {
      sessionStorage.setItem('my-stuff-sortAttribute', sortAttribute);
      return $scope.sortAttribute = sortAttribute;
    };
    $scope.stuff = new Stuff({
      visibility: sessionStorage.getItem('new-stuff-visibility') || null
    });
    $scope.addStuff = function() {
      if (isValid($scope.stuff)) {
        sessionStorage.setItem('new-stuff-visibility', $scope.stuff.visibility);
        $scope.stuffList.push(new Stuff($scope.stuff));
        stuffDAO.save($scope.stuffList, function() {});
        $scope.stuff = new Stuff({
          visibility: $scope.stuff.visibility
        });
        $scope.isAddStuffFormHidden = true;
        return focus('showAddStuffFormButton');
      } else {
        return $scope.showValidationErrors = true;
      }
    };
    return focus('showAddStuffFormButton');
  };

  MyStuffController.$inject = ['$scope', 'stuffDAO'];

  MyStuffEditController = function($scope, stuffDAO, $routeParams, $location) {
    var redirectToList;
    $scope.stuff = new Stuff();
    $scope.circles = circles;
    stuffDAO.getItem($routeParams.id, function(stuff) {
      log(stuff);
      $scope.stuff = new Stuff(stuff);
      log($scope.stuff);
      return $scope.$digest();
    });
    redirectToList = function() {
      return $scope.$apply(function() {
        return $location.path('/mystuff');
      });
    };
    $scope.save = function() {
      if (isValid($scope.stuff)) {
        log($scope.stuff);
        $scope.stuff.modify();
        return stuffDAO.saveItem($scope.stuff, redirectToList);
      } else {
        return $scope.showValidationErrors = true;
      }
    };
    return $scope["delete"] = function() {
      if (window.confirm("Do you really want to delete this stuff called \"" + $scope.stuff.title + "\"?")) {
        return stuffDAO.deleteItem($scope.stuff.id, redirectToList);
      }
    };
  };

  MyStuffEditController.$inject = ['$scope', 'stuffDAO', '$routeParams', '$location'];

  this.MyStuffController = MyStuffController;

  this.MyStuffEditController = MyStuffEditController;

}).call(this);
