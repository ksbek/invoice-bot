(function () {
  'use strict';

  angular
    .module('clients')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Clients',
      state: 'clients.list',
      roles: ['user'],
      position: 3
    });
  }
}());
