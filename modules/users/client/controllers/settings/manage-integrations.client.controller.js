(function () {
  'use strict';

  angular
    .module('users')
    .controller('ManageIntegrationsController', ManageIntegrationsController);

  ManageIntegrationsController.$inject = ['$scope', '$http', 'Authentication', 'Users'];

  function ManageIntegrationsController($scope, $http, Authentication, Users) {
    var vm = this;

    vm.user = Authentication.user;
    vm.hasConnectedAdditionalSocialAccounts = hasConnectedAdditionalSocialAccounts;
    vm.isConnectedSocialAccount = isConnectedSocialAccount;
    vm.removeUserSocialAccount = removeUserSocialAccount;
    vm.update = update;

    // Check if there are additional accounts
    function hasConnectedAdditionalSocialAccounts() {
      return (this.user.additionalProvidersData && Object.keys($scope.user.additionalProvidersData).length);
    }

    // Check if provider is already in use with current user
    function isConnectedSocialAccount(provider) {
      return vm.user.provider === provider || (vm.user.additionalProvidersData && vm.user.additionalProvidersData[provider]);
    }

    // Remove a user social account
    function removeUserSocialAccount(provider) {
      vm.success = vm.error = null;

      $http.delete('/api/users/accounts', {
        params: {
          provider: provider
        }
      }).success(function (response) {
        // If successful show success message and clear form
        vm.success = true;
        vm.user = Authentication.user = response;
      }).error(function (response) {
        vm.error = response.message;
      });
    }

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
