log = utils.log
focus = utils.focus

isValid = (stuff)-> !utils.isBlank(stuff.title)


circles = {
  friends: 'Friends',
  'public': 'Public'
}

MyStuffController = ($scope, stuffDAO)->
  $scope.stuffList = []
  $scope.isAddStuffFormHidden = true
  $scope.circles = circles
  $scope.sortAttribute = sessionStorage.getItem('my-stuff-sortAttribute') || '-modified'
  $scope.sortAttributeNames = {'-modified':'Newest','title':'Title','owner.name':'Friend'}

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

MyStuffController.$inject = ['$scope', 'stuffDAO']


MyStuffEditController = ($scope, stuffDAO, $routeParams, $location)->
  $scope.stuff = new Stuff()
  $scope.circles = circles

  stuffDAO.getItem($routeParams.id, (stuff)->
    $scope.stuff = new Stuff(stuff)
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

MyStuffEditController.$inject = ['$scope', 'stuffDAO', '$routeParams', '$location']


#export
this.MyStuffController = MyStuffController
this.MyStuffEditController = MyStuffEditController
