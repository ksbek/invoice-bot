'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  // Check if the confirm parameters have client name
  if (response.result.parameters.name !== '') {

    // Check if user have client
    Client.findClientByName(response.result.parameters.name, user, function(client) {
      if (client) {
        web.chat.postMessage(channel, 'Client already exists');
      } else {
        var attachment = {
          'fallback': '',
          'callback_id': 'create_client_business_name',
          'color': '#e2a5f8',
          'attachment_type': 'default',
          'token': 'VOOjorjRck77mNR33HD1Eux4',
          'actions': [
            {
              'name': 'no',
              'text': 'Add contact name',
              'style': 'primary',
              'type': 'button',
              'value': 'no'
            },
            {
              'name': 'yes',
              'text': 'Same name',
              'type': 'button',
              'value': 'yes'
            }
          ],
          'response_url': config.baseUrl + '/api/notifications/receiveslackmsg'
        };

        var data = {
          attachments: [attachment]
        };
        web.chat.postMessage(channel, response.result.fulfillment.speech, data);
      }
    });
  } else {
    web.chat.postMessage(channel, response.result.fulfillment.speech);
  }
};
