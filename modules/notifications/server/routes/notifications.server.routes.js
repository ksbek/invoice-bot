'use strict';

module.exports = function (app) {
  // Root routing
  var notifications = require('../controllers/notifications.server.controller');

  // Define send message
  app.route('/api/notifications/apiai').post(notifications.sendMessage);

};
