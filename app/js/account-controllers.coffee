log = utils.log
focus = utils.focus

ProfileController = ($scope,profileDAO)->
  profileDAO.load( (profile) ->
    $scope.profile = new Profile(profile)
    $scope.$digest()
  )

  $scope.save = ->
    profileDAO.save($scope.profile, ->
      $('#savedAlert').addClass('in').removeClass('out')
      setTimeout( ->
        $('#savedAlert').addClass('out').removeClass('in')
      ,5000)
    )

ProfileController.$inject = ['$scope','profileDAO']



AccountController = ($scope,settingsDAO)->
  $scope.secret = "Loading secret ..."
  settingsDAO.getSecret (secret) ->
    $scope.secret = secret
    $scope.$digest()


AccountController.$inject = ['$scope','settingsDAO']


ExportController = ($scope, friendDAO, stuffDAO)->
  $scope.export = ->
    stuffDAO.list (stuffList)->
      friendDAO.list (friendList)->
        utils.cleanObjectFromAngular(stuffList)
        utils.cleanObjectFromAngular(friendList)
        $scope.exportedData = JSON.stringify({stuff: stuffList, friends: friendList})
        $scope.$digest()
        focus('exportTextarea')


ExportController.$inject = ['$scope', 'friendDAO', 'stuffDAO']


ImportController = ($scope, friendDAO, stuffDAO)->
  $scope.importDataText = ''
  $scope.startImport = ->
    importData = JSON.parse($scope.importDataText)
    todoCount = 0

    savedCallback = ->
      todoCount--
      if todoCount == 0
        window.alert("Import Done!")
        $scope.importDataText = ''

    if importData?.stuff
      todoCount++
      stuffDAO.save(importData.stuff,savedCallback)
    if importData?.friends
      todoCount++
      friendDAO.save(importData.friends,savedCallback)



ImportController.$inject = ['$scope', 'friendDAO', 'stuffDAO']


#export
this.AccountController = AccountController
this.ExportController = ExportController
this.ImportController = ImportController
this.ProfileController = ProfileController
