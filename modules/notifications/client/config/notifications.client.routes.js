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
        templateUrl: 'modules/notifications/client/views/notifications.client.view.html',
        controller: 'NotificationsController',
        controllerAs: 'vm',
        data: {
          roles: ['user', 'admin'],
          pageTitle: 'notifications'
        }
      });
  }
}());
