log = utils.log
focus = utils.focus

isValid = (stuff)-> !utils.isBlank(stuff.title)


circles = {
  friends: 'Friends',
  'public': 'Public'
}

MyStuffController = ($scope, stuffDAO,profileDAO)->
  $scope.stuffList = []
  $scope.isAddStuffFormHidden = true
  $scope.circles = circles
  $scope.sortAttribute = sessionStorage.getItem('my-stuff-sortAttribute') || '-modified'
  $scope.sortAttributeNames = {'-modified':'Newest','title':'Title','owner.name':'Friend'}

  profileDAO.load (profile) ->
    $scope.profile = profile
    $scope.$digest()

  stuffDAO.list (restoredStuffList)->
    $scope.stuffList = restoredStuffList
    $scope.isAddStuffFormHidden = $scope.stuffList.length > 0
    $scope.status = "LOADED"
    $scope.$digest()

  $scope.showAddForm = ()->
    $scope.isAddStuffFormHidden = false
    focus('title')

  $scope.closeForm = ()->
    $scope.isAddStuffFormHidden = true

  $scope.sortBy = (sortAttribute) ->
    sessionStorage.setItem('my-stuff-sortAttribute',sortAttribute)
    $scope.sortAttribute = sortAttribute

  $scope.stuff = new Stuff({visibility:sessionStorage.getItem('new-stuff-visibility') || null})

  $scope.addStuff = ()->
    if isValid($scope.stuff)
      sessionStorage.setItem('new-stuff-visibility',$scope.stuff.visibility)
      $scope.stuffList.push(new Stuff($scope.stuff))
      stuffDAO.save($scope.stuffList, ->)
      $scope.stuff = new Stuff({visibility:$scope.stuff.visibility})
      $scope.isAddStuffFormHidden = true
      focus('showAddStuffFormButton')
    else
      $scope.showValidationErrors = true

  focus('showAddStuffFormButton')

MyStuffController.$inject = ['$scope', 'stuffDAO','profileDAO']


MyStuffEditController = ($scope, stuffDAO,profileDAO, $routeParams, $location)->
  $scope.stuff = new Stuff()
  $scope.circles = circles

  profileDAO.load (profile) ->
    $scope.profile = profile
    $scope.$digest()

  stuffDAO.getItem($routeParams.id, (stuff)->
    log(stuff)
    $scope.stuff = new Stuff(stuff)
    log($scope.stuff)
    $scope.$digest()
  )

  redirectToList = ->
    $scope.$apply(->
      $location.path('/mystuff')
    )

  $scope.save = ()->
    if isValid($scope.stuff)
      log($scope.stuff)
      $scope.stuff.modify()
      stuffDAO.saveItem($scope.stuff, redirectToList)
    else
      $scope.showValidationErrors = true

  $scope.delete = ()->
    if window.confirm("Do you really want to delete this stuff called \"#{$scope.stuff.title}\"?")
      stuffDAO.deleteItem($scope.stuff.id, redirectToList)

MyStuffEditController.$inject = ['$scope', 'stuffDAO','profileDAO','$routeParams', '$location']


#export
this.MyStuffController = MyStuffController
this.MyStuffEditController = MyStuffEditController
