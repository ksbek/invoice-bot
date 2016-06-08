(function () {
  'use strict';

  angular
    .module('clients')
    .controller('ClientsListController', ClientsListController);

  ClientsListController.$inject = ['ClientsService', 'Authentication'];

  function ClientsListController(ClientsService, Authentication) {
    var vm = this;
    vm.authentication = Authentication;
    vm.clients = ClientsService.query();
    vm.saveClient = saveClient;
    vm.edit = edit;
    vm.exitEdit = exitEdit;
    vm.editRow = -1;

    // Save Client
    function saveClient(client) {
      // TODO: move create/update logic to service
      if (client._id) {
        client.$update(successCallback, errorCallback);
      } else {
        client.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        vm.editRow = -1;
        vm.tempClient = null;
      }

      function errorCallback(res) {
        vm.error = res.data.message;
        vm.editRow = -1;
        vm.tempClient = null;
      }
    }

    function edit(client, row) {
      if (vm.editRow !== -1)
        return;
      vm.editRow = row;
      vm.tempClient = angular.copy(client);
    }

    function exitEdit(client, row) {
      vm.editRow = -1;
      vm.clients[row] = vm.tempClient;
      vm.tempClient = null;
    }
  }
}());
