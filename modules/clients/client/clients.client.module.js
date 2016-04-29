(function (app) {
  'use strict';

  app.registerModule('clients', ['core']);// The core module is required for special route handling; see /core/client/config/core.client.routes
  app.registerModule('clients.services');
  app.registerModule('clients.routes', ['ui.router', 'core.routes', 'clients.services']);
}(ApplicationConfiguration));
