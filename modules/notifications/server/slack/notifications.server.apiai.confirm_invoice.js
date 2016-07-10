'use strict';

// Create the notifications configuration
module.exports = function (response, user, channel, web, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  if (response.result.parameters.name !== '') {

    // Check if user have client
    Client.findClientByName(response.result.parameters.name, user, function(client) {
      if (client) {
        var attachment = {
          'fallback': 'Required plain-text summary of the attachment.',
          'color': '#f1d4fc',
          'author_name': 'Invoice: ' + client.companyName,
          'mrkdwn_in': [
            'text',
            'pretext'
          ],
          'text': 'Invoice amount: ' + config.currencies[user.currency] + (Math.round(response.result.parameters.amount.amount * (1 + user.tax / 100) * 100) / 100).toFixed(2) + ' `' + config.currencies[user.currency] + response.result.parameters.amount.amount + ' + ' + user.tax + '% Tax`',
          'title': 'Description: ' + response.result.parameters.description,
          'fields': [
            {
              'title': 'Nowdue allowance: ' + user.dueDateAllowance + ' days',
              'value': 'Send to: ' + client.name + ' at ' + client.email,
              'short': false
            }
          ],
          'callback_id': 'confirm_invoice',
          'attachment_type': 'default',
          'token': 'VOOjorjRck77mNR33HD1Eux4',
          'actions': [
            {
              'name': 'no',
              'text': 'No',
              'type': 'button',
              'value': 'no',
              'style': 'primary'
            },
            {
              'name': 'yes',
              'text': 'Looks good',
              'type': 'button',
              'value': 'yes',
              'style': 'primary'
            }
          ],
          'action_ts': new Date().getTime() / 1000,
          'message_ts': new Date().getTime() / 1000,
          'footer': 'Nowdue AI',
          'footer_icon': 'https://www.nowdue.ai/modules/core/client/img/i-nowdue.png',
          'ts': new Date().getTime() / 1000
        };

        var data = {
          attachments: [attachment]
        };

        web.chat.postMessage(channel, response.result.fulfillment.speech, data, function(err, response) {
          console.log(response);
        });
      } else {
        var context = {
          'name': 'invoice-name-not-found'
        };
        var newrequest = apiai.textRequest('invoice-name-not-found', { 'contexts': [context], 'sessionId': user.id });
        newrequest.on('response', function(response) {
          web.chat.postMessage(channel, response);
        });

        newrequest.on('error', function(error) {
          console.log(error);
        });
      }
    });
  }
};
