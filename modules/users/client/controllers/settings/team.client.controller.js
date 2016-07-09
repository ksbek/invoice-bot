(function () {
  'use strict';

  angular
    .module('users')
    .controller('TeamController', TeamController);

  TeamController.$inject = ['$scope', 'getUsers', '$window', '$http', 'Authentication'];

  function TeamController($scope, getUsers, $window, $http, Authentication) {
    var vm = this;
    vm.users = getUsers.data;
    vm.remove = remove;
    vm.setManager = setManager;
    vm.setUser = setUser;
    vm.authentication = Authentication;
    function remove(user) {
      if ($window.confirm('Are you sure you want to delete this user?')) {

        $http.post('/api/users/delete', { user: user })
        .success(function (response) {
          vm.users.splice(vm.users.indexOf(user), 1);
        }).error(function (response) {
          console.log(response);
        });
      }
    }

    function setManager(user, index) {
      if ($window.confirm('Are you sure you want to set this user to manager?')) {
        $http.post('/api/users/setmanager', { user: user })
        .success(function (response) {
          vm.users[index] = response;
        }).error(function (response) {
          console.log(response);
        });
      }
    }

    function setUser(user, index) {
      if ($window.confirm('Are you sure you want to set this user to general user?')) {
        $http.post('/api/users/setuser', { user: user })
        .success(function (response) {
          vm.users[index] = response;
        }).error(function (response) {
          console.log(response);
        });
      }
    }
  }
}());
