(function () {
  'use strict';

  angular
    .module('users')
    .controller('SettingsController', SettingsController);

  SettingsController.$inject = ['$scope', '$state', 'Authentication'];

  function SettingsController($scope, $state, Authentication) {
    var vm = this;

    vm.state = $state;
    vm.user = Authentication.user;
  }
}());
