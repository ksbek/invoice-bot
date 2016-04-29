// Clients service used to communicate Clients REST endpoints
(function () {
  'use strict';

  angular
    .module('clients')
    .factory('ClientsService', ClientsService);

  ClientsService.$inject = ['$resource'];

  function ClientsService($resource) {
    return $resource('api/clients/:clientId', {
      clientId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
