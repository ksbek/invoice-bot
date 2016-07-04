'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  if (response.result.parameters.name !== '' && response.result.parameters.email !== '') {
    // Create Client
    Client.createClientFromSlackBot(user.id, response.result.parameters, function(client) {
      console.log(client);
      if (client) {
        var response_speech = response.result.fulfillment.speech.replace('PAGE LINK', '<' + config.baseUrl + '/clients/' + client._id + '/edit' + '|' + client.companyName + '>');

        web.chat.postMessage(channel, response_speech);
        require(require('path').resolve('modules/notifications/server/slack/notifications.server.send.slack.js'))(config, null, client, user, 0, 2);
      } else {
        web.chat.postMessage(channel, 'Sorry, Something went wrong.');
      }
    });
  }
};
