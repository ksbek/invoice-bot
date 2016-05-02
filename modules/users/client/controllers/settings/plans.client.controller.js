(function () {
  'use strict';

  angular
    .module('users')
    .controller('PlansController', PlansController);

  PlansController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function PlansController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.update = update;

    // Update a user profile
    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());
