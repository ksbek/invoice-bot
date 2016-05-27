(function () {
  'use strict';

  angular
    .module('users')
    .controller('ChangePasswordController', ChangePasswordController);

  ChangePasswordController.$inject = ['$scope', '$http', 'Authentication', 'PasswordValidator', 'newPassword'];

  function ChangePasswordController($scope, $http, Authentication, PasswordValidator, newPassword) {
    var vm = this;

    vm.user = Authentication.user;
    vm.changeUserPassword = changeUserPassword;
    vm.getPopoverMsg = PasswordValidator.getPopoverMsg;
    vm.passwordDetails = {};
    vm.passwordDetails.newPassword = newPassword;
    // Change user password
    function changeUserPassword(isValid) {
      vm.success = vm.error = null;

      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.passwordForm');

        return false;
      }

      $http.post('/api/users/password', vm.passwordDetails).success(function (response) {
        // If successful show success message and clear form
        $scope.$broadcast('show-errors-reset', 'vm.passwordForm');
        vm.success = true;
        vm.passwordDetails = null;
        $scope.$close();
      }).error(function (response) {
        vm.error = response.message;
      });
    }
  }
}());
