(function () {
  'use strict';

  angular
    .module('clients')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('clients', {
        abstract: true,
        url: '/clients',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            template: '<ui-view/>'
          }
        }
      })
      .state('clients.list', {
        url: '',
        templateUrl: 'modules/clients/client/views/list-clients.client.view.html',
        controller: 'ClientsListController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Clients List'
        }
      })
      .state('clients.create', {
        url: '/create',
        templateUrl: 'modules/clients/client/views/form-client.client.view.html',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: newClient
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Create Client'
        }
      })
      .state('clients.edit', {
        url: '/:clientId/edit',
        templateUrl: 'modules/clients/client/views/form-client.client.view.html',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: getClient
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Client {{ clientResolve.name }}'
        }
      })
      .state('clients.view', {
        url: '/:clientId',
        templateUrl: 'modules/clients/client/views/view-client.client.view.html',
        controller: 'ClientsController',
        controllerAs: 'vm',
        resolve: {
          clientResolve: getClient
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Client {{ articleResolve.name }}'
        }
      });
  }

  getClient.$inject = ['$stateParams', 'ClientsService'];

  function getClient($stateParams, ClientsService) {
    return ClientsService.get({
      clientId: $stateParams.clientId
    }).$promise;
  }

  newClient.$inject = ['ClientsService'];

  function newClient(ClientsService) {
    return new ClientsService();
  }
}());
