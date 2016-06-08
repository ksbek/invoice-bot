(function () {
  'use strict';

  angular
    .module('notifications')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    Menus.addMenuItem('topbar', {
      title: 'Notifications',
      state: 'notifications',
      roles: ['user'],
      position: 1
    });
  }
}());
