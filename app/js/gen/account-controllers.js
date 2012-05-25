(function() {
  var AccountController, ExportController, ImportController, ProfileController, focus, log;

  log = utils.log;

  focus = utils.focus;

  ProfileController = function($scope, settingsDAO) {
    var settings;
    settings = {};
    settingsDAO.readSettings(function(settingsArg) {
      settings = settingsArg;
      $scope.profile = new Profile(settings.profile);
      return $scope.$digest();
    });
    return $scope.save = function() {
      settings.profile = $scope.profile;
      return settingsDAO.saveSettings(function() {
        $('#savedAlert').addClass('in').removeClass('out');
        return setTimeout(function() {
          return $('#savedAlert').addClass('out').removeClass('in');
        }, 5000);
      });
    };
  };

  ProfileController.$inject = ['$scope', 'settingsDAO'];

  AccountController = function($scope, settingsDAO) {
    $scope.secret = "Loading secret ...";
    return settingsDAO.getSecret(function(secret) {
      $scope.secret = secret;
      return $scope.$digest();
    });
  };

  AccountController.$inject = ['$scope', 'settingsDAO'];

  ExportController = function($scope, friendDAO, stuffDAO) {
    return $scope["export"] = function() {
      return stuffDAO.list(function(stuffList) {
        return friendDAO.list(function(friendList) {
          utils.cleanObjectFromAngular(stuffList);
          utils.cleanObjectFromAngular(friendList);
          $scope.exportedData = JSON.stringify({
            stuff: stuffList,
            friends: friendList
          });
          $scope.$digest();
          return focus('exportTextarea');
        });
      });
    };
  };

  ExportController.$inject = ['$scope', 'friendDAO', 'stuffDAO'];

  ImportController = function($scope, friendDAO, stuffDAO) {
    $scope.importDataText = '';
    return $scope.startImport = function() {
      var importData, savedCallback, todoCount;
      importData = JSON.parse($scope.importDataText);
      todoCount = 0;
      savedCallback = function() {
        todoCount--;
        if (todoCount === 0) {
          window.alert("Import Done!");
          return $scope.importDataText = '';
        }
      };
      if (importData != null ? importData.stuff : void 0) {
        todoCount++;
        stuffDAO.save(importData.stuff, savedCallback);
      }
      if (importData != null ? importData.friends : void 0) {
        todoCount++;
        return friendDAO.save(importData.friends, savedCallback);
      }
    };
  };

  ImportController.$inject = ['$scope', 'friendDAO', 'stuffDAO'];

  this.AccountController = AccountController;

  this.ExportController = ExportController;

  this.ImportController = ImportController;

  this.ProfileController = ProfileController;

}).call(this);
