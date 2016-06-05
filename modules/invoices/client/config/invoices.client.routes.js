(function () {
  'use strict';

  angular
    .module('invoices')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('invoices', {
        abstract: true,
        url: '/invoices',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            template: '<ui-view/>'
          }
        }
      })
      .state('invoices.list', {
        url: '',
        templateUrl: 'modules/invoices/client/views/list-invoices.client.view.html',
        controller: 'InvoicesListController',
        controllerAs: 'vm',
        resolve: {
          invoices: getInvoices
        },
        data: {
          pageTitle: 'Invoices List'
        }
      })
      .state('invoices.listByClient', {
        url: '/client/:clientId',
        templateUrl: 'modules/invoices/client/views/list-invoices.client.view.html',
        controller: 'InvoicesListByClientController',
        controllerAs: 'vm',
        resolve: {
          invoices: getInvoiceByClient
        },
        data: {
          pageTitle: 'Invoices List'
        }
      })
      .state('invoices.create', {
        url: '/create',
        templateUrl: 'modules/invoices/client/views/form-invoice.client.view.html',
        controller: 'InvoicesController',
        controllerAs: 'vm',
        resolve: {
          invoiceResolve: newInvoice
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Invoices Create'
        }
      })
      .state('invoices.edit', {
        url: '/:invoiceId/edit',
        templateUrl: 'modules/invoices/client/views/form-invoice.client.view.html',
        controller: 'InvoicesController',
        controllerAs: 'vm',
        resolve: {
          invoiceResolve: getInvoice
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Edit Invoice {{ invoiceResolve.name }}'
        }
      })
      .state('invoicesview', {
        url: '/invoices/:invoiceId',
        views: {
          'container@': {
            templateUrl: 'modules/invoices/client/views/view-invoice.client.view.html',
            controller: 'InvoicesController',
            controllerAs: 'vm'
          },
          'header': {
            templateUrl: 'modules/invoices/client/views/invoice-view-header.client.view.html',
            controller: 'InvoicesController',
            controllerAs: 'vm'
          },
          'footer': {
            templateUrl: 'modules/invoices/client/views/invoice-view-footer.client.view.html',
            controller: 'InvoicesController',
            controllerAs: 'vm'
          }
        },
        resolve: {
          invoiceResolve: getInvoice
        },
        data: {
          pageTitle: 'Invoice View'
        }
      });
  }

  getInvoice.$inject = ['$stateParams', 'InvoicesService'];

  function getInvoice($stateParams, InvoicesService) {
    return InvoicesService.get({
      invoiceId: $stateParams.invoiceId
    }).$promise;
  }

  newInvoice.$inject = ['InvoicesService'];

  function newInvoice(InvoicesService) {
    return new InvoicesService();
  }

  getInvoices.$inject = ['InvoicesService'];

  function getInvoices(InvoicesService) {
    return InvoicesService.query().$promise;
  }

  getInvoiceByClient.$inject = ['$stateParams', '$http'];

  function getInvoiceByClient($stateParams, $http) {
    return $http.post('/api/invoices/client/' + $stateParams.clientId, {
      params: {
        clientId: $stateParams.clientId
      }
    });
  }
}());
