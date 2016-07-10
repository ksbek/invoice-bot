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

        // Check if the confirm parameters have amount
        if (response.result.parameters.amount.amount !== '') {

          // Create invoice with confirm parameters
          Invoice.createInvoiceFromSlackBot(user, client.id, response.result.parameters, function(invoice) {
            if (invoice) {
              var response_speech = response.result.fulfillment.speech;
              response_speech.replace('[CurrencySymbol]', config.currencies[user.currency]);
              // response_speech = response_speech.replace('INV000', config.baseUrl + '/invoices/' + invoice._id + '|Invoice ' + invoice.invoice + '>');
              response_speech = response_speech.replace('INV000', '<' + config.baseUrl + '/invoices/' + invoice._id + '|INV' + invoice.invoice + '>');
              console.log(response_speech);

              var attachment = {
                'fallback': '',
                'callback_id': 'invoice_created',
                'color': '#e2a5f8',
                'attachment_type': 'default',
                'token': 'VOOjorjRck77mNR33HD1Eux4',
                'actions': [
                  {
                    'name': 'no',
                    'text': 'No',
                    'type': 'button',
                    'style': 'primary',
                    'value': 'no'
                  },
                  {
                    'name': 'yes',
                    'text': 'Yes',
                    'type': 'button',
                    'style': 'primary',
                    'value': 'yes'
                  }
                ],
                'response_url': config.baseUrl + '/api/notifications/receiveslackmsg'
              };

              var data = {
                attachments: [attachment]
              };

              web.chat.postMessage(channel, response_speech, data);

              console.log(invoice);
              invoice.client = client;
              invoice.user = user;

              // Send invoice created notification to notifications page
              require(require('path').resolve('modules/notifications/server/slack/notifications.server.send.slack.js'))(config, invoice, null, user, 0, 1);
            }
          });
        } else {
          web.chat.postMessage(channel, response.result.fulfillment.speech);
        }
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
  } else {
    web.chat.postMessage(channel, response.result.fulfillment.speech);
  }
};
