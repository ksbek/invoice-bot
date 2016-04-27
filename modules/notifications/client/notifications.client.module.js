(function (app) {
  'use strict';

  app.registerModule('notifications', ['core']);
  app.registerModule('notifications.routes', ['ui.router', 'core.routes']);
}(ApplicationConfiguration));
