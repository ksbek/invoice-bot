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
      state: 'invoices',
      type: 'dropdown',
      roles: ['user'],
      position: 2
    });

    // Add the dropdown list item
    Menus.addSubMenuItem('topbar', 'invoices', {
      title: 'List Invoices',
      state: 'invoices.list',
      roles: ['user']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('topbar', 'invoices', {
      title: 'Create Invoice',
      state: 'invoices.create',
      roles: ['user']
    });
  }
}());
