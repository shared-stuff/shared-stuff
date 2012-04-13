log = utils.log
focus = utils.focus


MyStuffController = ($scope,stuffDAO)->
  $scope.stuffList = []
  $scope.isAddStuffFormHidden = true

  stuffDAO.list (restoredStuffList)->
    $scope.stuffList = restoredStuffList
    $scope.isAddStuffFormHidden = $scope.stuffList.length>0
    $scope.$digest();

  $scope.showAddForm = ()->
    $scope.isAddStuffFormHidden = false
    focus('title')

  $scope.stuff = new Stuff()

  $scope.addStuff = ()->
    $scope.stuffList.push(new Stuff($scope.stuff))
    stuffDAO.save($scope.stuffList, ->)
    $scope.stuff = new Stuff();
    $scope.isAddStuffFormHidden = true
    focus('showAddStuffFormButton')

  focus('showAddStuffFormButton')

MyStuffController.$inject = ['$scope','stuffDAO']


MyStuffEditController = ($scope,stuffDAO,$routeParams,$location)->
  $scope.stuff = new Stuff()

  stuffDAO.getItem($routeParams.id,(stuff)->
    $scope.stuff = new Stuff(stuff)
    $scope.$digest();
  )

  redirectToList = ->
    $scope.$apply( ->
      $location.path('/mystuff')
    )

  $scope.save = ()->
    $scope.stuff.modify()
    stuffDAO.saveItem($scope.stuff, redirectToList)

  $scope.delete = ()->
    if window.confirm("Do you really want to delete this stuff called \"#{$scope.stuff.title}\"?")
      stuffDAO.deleteItem($scope.stuff.id, redirectToList)

MyStuffEditController.$inject = ['$scope','stuffDAO','$routeParams','$location']


#export
this.MyStuffController = MyStuffController
this.MyStuffEditController = MyStuffEditController
