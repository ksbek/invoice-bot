(function () {
  'use strict';

  angular
    .module('core')
    .controller('HeaderController', HeaderController);

  HeaderController.$inject = ['$scope', '$state', '$rootScope', 'Authentication', 'Menus', '$uibModal', 'Socket', '$window', '$localForage'];

  function HeaderController($scope, $state, $rootScope, Authentication, Menus, $uibModal, Socket, $window, $localForage) {
    var vm = this;

    vm.accountMenu = Menus.getMenu('account').items[0];
    vm.authentication = Authentication;
    vm.isCollapsed = false;
    vm.menu = Menus.getMenu('topbar');
    vm.createClient = createClient;
    vm.state = $state;
    $scope.$on('$stateChangeSuccess', stateChangeSuccess);

    init();

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
      Socket.on(Authentication.user.id + 'notification', function (message) {
        // $rootScope.messages.push(message.notification);
        // $localForage.setItem('messages', JSON.stringify($rootScope.messages)).then(function() {
        //  $localForage.getItem('messages').then(function(data) {
        //    $rootScope.messages = JSON.parse(data);
        //  });
        // });
      });
    }

    newClient.$inject = ['ClientsService'];

    function newClient(ClientsService) {
      return new ClientsService();
    }
  }
}());
