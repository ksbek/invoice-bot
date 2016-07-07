(function () {
  'use strict';

  angular
    .module('users')
    .controller('UsersController', UsersController);

  UsersController.$inject = ['$scope', 'getUsers'];

  function UsersController($scope, getUsers) {
    var vm = this;
    vm.users = getUsers.data;
  }
}());
