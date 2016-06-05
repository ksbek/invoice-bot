(function () {
  'use strict';

  angular
    .module('users')
    .controller('EditProfileController', EditProfileController);

  EditProfileController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication', '$uibModal'];

  function EditProfileController($scope, $state, $http, $location, Users, Authentication, $uibModal) {
    var vm = this;

    vm.user = Authentication.user;
    vm.copyUser = angular.copy(vm.user);
    vm.updateUserProfile = updateUserProfile;
    vm.changePassword = changePassword;
    vm.editStatus = "";
    vm.editField = editField;
    vm.exitEditField = exitEditField;

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
        vm.user = Authentication.user = response;
        vm.copyUser = angular.copy(vm.user);
        vm.editStatus = "";
      }, function (response) {
        vm.error = response.data.message;
      });
    }

    function changePassword() {
      if (!vm.userForm.$valid)
        return false;
      if (vm.passwordDetails && vm.passwordDetails.password !== '') {
        $uibModal.open({
          templateUrl: 'modules/users/client/views/settings/confirm-original-password.client.view.html',
          controller: 'ChangePasswordController',
          controllerAs: 'vm',
          resolve: {
            newPassword: function () {
              return vm.passwordDetails.password;
            }
          }
        });
      } else {
        vm.passwordError = true;
      }
    }

    function editField(editStatus) {
      if (vm.userForm.$valid) {
        vm.editStatus = editStatus;
      }
    }

    function exitEditField(editStatus) {
      vm.editStatus = '';
      vm.user[editStatus] = vm.copyUser[editStatus];
    }
  }
}());
