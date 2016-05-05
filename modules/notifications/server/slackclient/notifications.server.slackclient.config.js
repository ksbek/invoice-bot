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

  var io = GLOBAL.io;

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
        if (response.result.metadata && response.result.metadata.intentName === 'Make Invoice Yes Confirm') {
          User.findUserBySlackId(message.user, function(user) {
            if (user) {
              console.log(user.id);
              if (response.result.parameters.name !== '') {
                Client.findClientByName(response.result.parameters.name, user.id, function(client) {
                  if (client) {
                    console.log(client.id);
                    if (response.result.parameters.amount !== '') {
                      Invoice.createInvoiceFromSlackBot(user.id, client.id, response.result.parameters, function(invoice) {
                        rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                        console.log(invoice);

                        io.emit('invoiceclient', {
                          type: 'invoiceclient',
                          profileImageURL: user.profileImageURL,
                          username: user.username,
                          user_id: user.id,
                          client_name: client.name,
                          amount: invoice.amountDue.amount,
                          currenty: invoice.amountDue.currency
                        });

                      });
                    } else {
                      rtm.sendMessage(response.result.fulfillment.speech, dm.id);
                    }
                  } else {
                    rtm.sendMessage("Sorry, we have not such client for you", dm.id);
                  }
                });
              } else {
                rtm.sendMessage(response.result.fulfillment.speech, dm.id);
              }
            } else {
              rtm.sendMessage("Sorry, you are not correct", dm.id);
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
