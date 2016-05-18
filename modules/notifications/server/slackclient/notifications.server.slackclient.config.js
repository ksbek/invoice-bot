'use strict';

// Create the notifications configuration
module.exports = function (token, config) {
  var apiai = require('apiai')(config.apiai.clientAccessToken);

  var mongoose = require('mongoose');
  var User = mongoose.model('User');
  var Client = mongoose.model('Client');
  var Invoice = mongoose.model('Invoice');

  var RtmClient = require('@slack/client').RtmClient;
  var MemoryDataStore = require('@slack/client').MemoryDataStore;
  var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
  var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

  var server = (process.env.NODE_ENV === 'secure' ? 'https://' : 'http://') + config.host + ':' + config.port;

  var io = GLOBAL.io;

  var EmailTemplate = require('email-templates').EmailTemplate;

  var last_invoice = null;

  var rtm = new RtmClient(token, {
    // Sets the level of logging we require
    logLevel: 'error',
    // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval of data
    dataStore: new MemoryDataStore(),
    // Boolean indicating whether Slack should automatically reconnect after an error response
    autoReconnect: true,
    // Boolean indicating whether each message should be marked as read or not after it is processed
    autoMark: true
  });

  rtm.start();
  // Wait for the client to connect
  rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function() {
    // Get the user's name
    var user = rtm.dataStore.getUserById(rtm.activeUserId);

    // Get the team's name
    var team = rtm.dataStore.getTeamById(rtm.activeTeamId);

    // Log the slack team name and the bot's name
    console.log('Connected to ' + team.name + ' as ' + user.name);
  });

  rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    console.log(message);
    var user = rtm.dataStore.getUserById(message.user);

    var dm = rtm.dataStore.getDMByName(user.name);
    if (dm) {
      rtm.sendTyping(dm.id);

      var request = apiai.textRequest(message.text);

      request.on('response', function(response) {
        console.log(response);

        // Check the slack user confirm yes for make invoice
        if (response.result.metadata && response.result.metadata.intentName === 'Make Invoice Yes Confirm') {

          // Check if the slack user exists
          User.findUserBySlackId(message.user, '', function(user) {
            if (user) {

              // Check if the confirm parameters have client name
              if (response.result.parameters.name !== '') {

                // Check if user have client
                Client.findClientByName(response.result.parameters.name, user.id, function(client) {
                  if (client) {

                    // Check if the confirm paramenters have amount
                    if (response.result.parameters.amount !== '') {

                      // Create invoice with confirm paramenters
                      Invoice.createInvoiceFromSlackBot(user.id, client.id, response.result.parameters, function(invoice) {
                        if (invoice) {
                          rtm.sendMessage(response.result.fulfillment.speech, dm.id);

                          console.log(invoice);
                          invoice.client = client;
                          invoice.user = user;
                          last_invoice = invoice;

                          // Send notification to notifications page
                          io.emit('invoiceclient', {
                            type: 'invoiceclient',
                            profileImageURL: user.profileImageURL,
                            username: user.username,
                            user_id: user.id,
                            client_name: client.name,
                            amount: invoice.amountDue.amount,
                            currenty: invoice.amountDue.currency
                          });
                        }
                      });
                    } else {
                      rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                    }
                  } else {
                    request = apiai.textRequest("invoice_name_not_found");
                    request.on('response', function(response) {
                      rtm.sendMessage(response, dm.id);
                    });

                    request.on('error', function(error) {
                      rtm.sendMessage("Sorry, something went wrong", dm.id);
                    });

                  }
                });
              } else {
                rtm.sendMessage(response.result.fulfillment.speech, dm.id);
              }
            } else {
              rtm.sendMessage("Sorry, you are not registered", dm.id);
            }
          });
        } else
        // Check the slack user confirm send invoice to client
        if (response.result.metadata && response.result.metadata.intentName === 'Make Invoice Send Yes Confirm') {
          // Send invoice url to slack

          var response_speech = response.result.fulfillment.speech;
          if (last_invoice.user.currency === 'AUD') {
            response_speech.replace('[CurrencySymbol]', 'A$');
          } else if (last_invoice.user.currency === 'EURO') {
            response_speech.replace('[CurrencySymbol]', '€');
          } else {
            response_speech.replace('[CurrencySymbol]', '$');
          }

          response_speech.replace('INV000', '<https://nowdue.herokuapp.com/invoices/' + last_invoice._id + '|Invoice ' + last_invoice.invoice + '>');
          rtm.sendMessage(response_speech, dm.id);

          // Send transaction email to user
          require(require('path').resolve("modules/notifications/server/mailer/notifications.server.mailer.js"))(config, last_invoice, EmailTemplate);
        } else
        // Check the slack user confirm yes for create client
        if (response.result.metadata && response.result.metadata.intentName === 'Create Client Yes Confirm') {
          // Check if the slack user exists
          User.findUserBySlackId(message.user, '', function(user) {
            if (user) {

              // Check if the confirm parameters have business name and email
              if (response.result.parameters.name !== '' && response.result.parameters.email !== '') {

                // Create Client
                Client.createClientFromSlackBot(user.id, response.result.parameters, function(client) {
                  console.log(client);
                  rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                });
              }
            } else {
              rtm.sendMessage("Sorry, you are not registered", dm.id);
            }
          });
        } else {
          rtm.sendMessage(response.result.fulfillment.speech, dm.id);
        }
      });

      request.on('error', function(error) {
        rtm.sendMessage('Oops! Something went wrong', dm.id);
      });

      request.end();
    }
  });
};
