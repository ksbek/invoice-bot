'use strict';

module.exports = function (app) {
  // Root routing
  var notificationsPolicy = require('../policies/notifications.server.policy'),
    notifications = require('../controllers/notifications.server.controller');

  app.route('/api/notifications').all(notificationsPolicy.isAllowed)
    .get(notifications.list)
    .post(notifications.create);

  // Define send message
  app.route('/api/notifications/apiai').post(notifications.sendMessage);

};
