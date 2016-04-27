(function () {
  'use strict';

  angular
    .module('notifications')
    .run(menuConfig);

  menuConfig.$inject = ['menuService'];

  function menuConfig(menuService) {
    // Set top bar menu items
    menuService.addMenuItem('topbar', {
      title: 'Notifications',
      state: 'notifications'
    });
  }
}());
