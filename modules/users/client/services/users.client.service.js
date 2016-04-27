(function () {
  'use strict';

  // Users service used for communicating with the users REST endpoint
  angular
    .module('users.services')
    .factory('Users', Users);

  Users.$inject = ['$resource'];

  function Users($resource) {
    return $resource('api/users', {}, {
      update: {
        method: 'PUT'
      }
    });
  }

  // TODO this should be Users service
  angular
    .module('users.admin.services')
    .factory('AdminService', AdminService);

  AdminService.$inject = ['$resource'];

  function AdminService($resource) {
    return $resource('api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
