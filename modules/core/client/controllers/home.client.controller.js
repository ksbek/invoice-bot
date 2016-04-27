(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

  HomeController.$inject = ['$scope', '$state', '$http', '$location', '$window'];

  function HomeController($scope, $state, $http, $location, $window) {
    var vm = this;
    vm.callOauthProvider = callOauthProvider;
    // OAuth provider request
    function callOauthProvider(url) {
      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }
  }
}());
