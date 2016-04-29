(function () {
  'use strict';

  angular
    .module('clients')
    .controller('ClientsListController', ClientsListController);

  ClientsListController.$inject = ['ClientsService'];

  function ClientsListController(ClientsService) {
    var vm = this;

    vm.clients = ClientsService.query();
  }
}());
