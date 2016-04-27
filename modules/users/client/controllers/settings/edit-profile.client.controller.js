(function () {
  'use strict';

  angular
    .module('users')
    .controller('EditProfileController', EditProfileController);

  EditProfileController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function EditProfileController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.updateUserProfile = updateUserProfile;

    // Update a user profile
    function updateUserProfile(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.userForm');

        return false;
      }

      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        Authentication.user = response;
        $state.go('home');
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());
