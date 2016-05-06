(function () {
  'use strict';

  angular
    .module('notifications.routes')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('notifications', {
        url: '/',
        views: {
          'header': {
            templateUrl: 'modules/users/client/views/settings/header.client.view.html'
          },
          'container@': {
            templateUrl: 'modules/notifications/client/views/notifications.client.view.html',
            controller: 'NotificationsController',
            controllerAs: 'vm'
          }
        },
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'notifications'
        }
      });
  }
}());
