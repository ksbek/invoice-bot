(function () {
  'use strict';

  angular
    .module('users')
    .controller('TeamController', TeamController);

  TeamController.$inject = ['$scope', 'getUsers'];

  function TeamController($scope, getUsers) {
    var vm = this;
    vm.users = getUsers.data;
  }
}());
