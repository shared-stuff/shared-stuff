'use strict';
/* App Controllers */

var log = utils.log;

function AboutController($scope) {
    log("About");
    log($scope.session);
    $scope.bla = "blase";
    log(utils.randomString(10));
    $scope.msValues = [
        {id:'rent'},
        {id: 'gift'},
        {id:'use-together'},
        {id:'sell'}
    ]
}
AboutController.$inject = ['$scope'];
