'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', ['ngSanitize','myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {

    $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: LoginController});

    $routeProvider.when('/mystuff', {templateUrl: 'partials/my-stuff.html', controller: MyStuffController});
    $routeProvider.when('/mystuff/:id', {templateUrl: 'partials/my-stuff-edit.html', controller: MyStuffEditController});

    $routeProvider.when('/share-stuff', {templateUrl: 'partials/share-stuff.html', controller: ShareStuffController});

    $routeProvider.when('/friends', {templateUrl: 'partials/friends.html', controller: FriendsController});
    $routeProvider.when('/friends/:id', {templateUrl: 'partials/friend-edit.html', controller: FriendEditController});
    $routeProvider.when('/addFriend/:name/:userAddress/:secret', {templateUrl: 'partials/friends.html', controller: FriendsController});
    $routeProvider.when('/addFriend/:name/:userAddress', {templateUrl: 'partials/friends.html', controller: FriendsController});

    $routeProvider.when('/invitation/:user@:host/:secret', {templateUrl: 'partials/friend.html', controller: FriendViewController});
    $routeProvider.when('/:user@:host/:secret', {templateUrl: 'partials/friend.html', controller: FriendViewController});
    $routeProvider.when('/invitation/:user@:host', {templateUrl: 'partials/friend.html', controller: FriendViewController});
    $routeProvider.when('/:user@:host', {templateUrl: 'partials/friend.html', controller: FriendViewController});

    $routeProvider.when('/friends-stuff', {templateUrl: 'partials/friends-stuff.html', controller: FriendsStuffController});

    $routeProvider.when('/account', {templateUrl: 'partials/profile.html', controller: ProfileController});
    $routeProvider.when('/profile', {templateUrl: 'partials/profile.html', controller: ProfileController});
    $routeProvider.when('/export', {templateUrl: 'partials/account-export.html', controller: ExportController});
    $routeProvider.when('/import', {templateUrl: 'partials/account-import.html', controller: ImportController});
    $routeProvider.when('/settings', {templateUrl: 'partials/account-settings.html', controller: AccountController});

    $routeProvider.when('/about', {templateUrl: 'partials/about.html', controller: AboutController});
    $routeProvider.otherwise({redirectTo: '/friends-stuff'});
  }]);

angular.element(document).ready(function() {
    angular.bootstrap(document,['myApp']);
});
