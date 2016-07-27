(function () {
  'use strict';

  angular
    .module('notifications.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('notifications', {
        url: '/dashboard',
        views: {
          'header': {
            templateUrl: 'modules/core/client/views/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/notifications/client/views/notifications.client.view.html',
            controller: 'NotificationsController',
            controllerAs: 'vm'
          }
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'Dashboard'
        }
      });
  }
}());
