log = utils.log
focus = utils.focus

FriendsStuffController = ($scope,$defer,friendDAO,friendsStuffDAO)->
  $scope.stuffList = []
  $scope.sortAttribute = '-modified'
  $scope.sortAttributeNames = {'-modified':'Newest','title':'Title','owner.name':'Friend'}

  $defer ->
      friendsStuffDAO.list (stuffList,status)->
        $scope.stuffList = stuffList
        $scope.status = status
        $scope.$digest();

  $scope.sortBy = (sortAttribute) ->
    log(sortAttribute)
    $scope.sortAttribute = sortAttribute


FriendsStuffController.$inject = ['$scope','$defer','friendDAO','friendsStuffDAO']

#export
this.FriendsStuffController = FriendsStuffController
