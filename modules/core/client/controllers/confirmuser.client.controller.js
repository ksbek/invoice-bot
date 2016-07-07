(function () {
  'use strict';

  angular
    .module('core')
    .controller('ConfirmUserController', ConfirmUserController);

  ConfirmUserController.$inject = ['$scope', '$state', '$http', '$location', '$window'];

  function ConfirmUserController($scope, $state, $http, $location, $window) {
    var vm = this;
    // OAuth provider request
    function confirm(isConfirm) {
      // Effectively call OAuth authentication route:
      // $window.location.href = url;
    }
  }
}());
