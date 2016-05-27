(function () {
  'use strict';

  angular
    .module('users')
    .controller('InvoiceSettingsController', InvoiceSettingsController);

  InvoiceSettingsController.$inject = ['$scope', '$state', '$http', '$location', 'Users', 'Authentication'];

  function InvoiceSettingsController($scope, $state, $http, $location, Users, Authentication) {
    var vm = this;

    vm.user = Authentication.user;
    vm.update = update;

    vm.currencySymbols = {
      'USD': '$',
      'AUD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': '$'
    };

    if (!vm.user.currency || vm.user.currency === "")
      vm.user.currency = 'USD';
    // Update a user profile
    function update() {
      vm.success = vm.error = null;
      var user = new Users(vm.user);

      user.$update(function (response) {
        $scope.$broadcast('show-errors-reset', 'vm.userForm');

        vm.success = true;
        vm.user = Authentication.user = response;
        $state.go('notifications');
      }, function (response) {
        vm.error = response.data.message;
      });
    }
  }
}());
