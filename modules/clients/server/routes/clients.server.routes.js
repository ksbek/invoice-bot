'use strict';

/**
 * Module dependencies
 */
var clientsPolicy = require('../policies/clients.server.policy'),
  clients = require('../controllers/clients.server.controller');

module.exports = function(app) {
  // Clients Routes
  app.route('/api/clients').all(clientsPolicy.isAllowed)
    .get(clients.list)
    .post(clients.create);

  app.route('/api/clients/:clientId').all(clientsPolicy.isAllowed)
    .get(clients.read)
    .put(clients.update)
    .delete(clients.delete);

  // Finish by binding the Client middleware
  app.param('clientId', clients.clientByID);
};
