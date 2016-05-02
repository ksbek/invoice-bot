(function () {
  'use strict';

  angular
    .module('invoices')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Invoices',
      state: 'invoices.list',
      roles: ['user'],
      position: 2
    });
  }
}());
