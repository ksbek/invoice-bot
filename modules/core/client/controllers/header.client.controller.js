(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', 'Authentication', 'Menus', '$uibModal'];

  function HeaderController($scope, $state, Authentication, Menus, $uibModal) {
    var vm = this;

    vm.accountMenu = Menus.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = Menus.getMenu('topbar');
    vm.createClient = createClient;

    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    function stateChangeSuccess() {
      // Collapsing the menu after navigation
      vm.isCollapsed = false;
    }

    function createClient() {
      var modalInstance = $uibModal.open({
        templateUrl: 'modules/clients/client/views/new-client.client.view.html',
        size: 'lg',
        windowClass: 'client-modal',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: newClient
        }
      });
    }

    newClient.$inject = ['ClientsService'];

    function newClient(ClientsService) {
      return new ClientsService();
    }
  }
}());
