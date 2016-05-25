(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', 'Authentication', 'Menus', '$uibModal', 'Socket', '$window'];

  function HeaderController($scope, $state, Authentication, Menus, $uibModal, Socket, $window) {
    var vm = this;

    vm.accountMenu = Menus.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = Menus.getMenu('topbar');
    vm.createClient = createClient;
    vm.state = $state;
    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    vm.callOauthProvider = callOauthProvider;
    // OAuth provider request
    function callOauthProvider(url) {
      // Effectively call OAuth authentication route:
      $window.location.href = url;
    }

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

    function init() {
      // Make sure the Socket is connected
      if (!Socket.socket) {
        Socket.connect();
      }

      // Add an event listener to the 'notificiationMessage' event
      Socket.on(Authentication.user.id + 'invoiceclient', function (message) {
        vm.messages.unshift(message);
      });
    }

    newClient.$inject = ['ClientsService'];

    function newClient(ClientsService) {
      return new ClientsService();
    }
  }
}());
